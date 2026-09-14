'use client';

import { Fragment, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useUiStrings } from '@/contexts/LanguageContext';

interface Zone3D {
  slug: string;
  // Nome italiano di riserva, usato solo se lo slug non è presente in
  // ui.brainMap.zoneNames (non dovrebbe capitare) — il nome mostrato viene
  // normalmente risolto in base alla lingua attiva, vedi zoneNames prop più sotto.
  name: string;
  // Posizione come FRAZIONE (0..1) del bounding box reale del modello caricato —
  // così il marker resta sempre "dentro" il modello. [0,0,0] = angolo min del box,
  // [1,1,1] = angolo max, 0.5 = centro su quell'asse.
  fraction: [number, number, number];
}

// Solo le zone grandi e visibili DALL'ESTERNO sulla superficie del modello. Le
// strutture profonde (talamo, ippocampo, amigdala ecc.) restano navigabili tramite
// l'elenco "Strutture profonde" sotto il modello 3D, nella pagina.
//
// Tutte e 6 le posizioni sono DEFINITIVE:
// - stelo encefalico e cervelletto: calcolate matematicamente dal centro esatto delle
//   rispettive mesh nel file (questo modello le ha come mesh separate);
// - i 4 lobi: calibrati a mano con click-to-place direttamente sul modello.
const BRAIN_ZONES_3D: Zone3D[] = [
  { slug: 'brainstem', name: 'Tronco Encefalico', fraction: [0.510924641237057, 0.20527322624610528, 0.40305727334594926] },
  { slug: 'cerebellum', name: 'Cervelletto', fraction: [0.5106993637898103, 0.4037981609334596, 0.26031870482883745] },
  { slug: 'frontal-lobe', name: 'Lobo Frontale', fraction: [0.5784839052407639, 0.8431434388276089, 0.8960610040389682] },
  { slug: 'parietal-lobe', name: 'Lobo Parietale', fraction: [0.5748233978129051, 0.9784274277289939, 0.38598979098606834] },
  { slug: 'temporal-lobe', name: 'Lobo Temporale', fraction: [0.020449440939476458, 0.5330341800015003, 0.549918955076177] },
  { slug: 'occipital-lobe', name: 'Lobo Occipitale', fraction: [0.6003032195498839, 0.5148566587676869, 0.016457367837172512] },
];

interface BoxInfo {
  min: THREE.Vector3;
  size: THREE.Vector3;
}

function findMeshByMaterialHint(scene: THREE.Object3D, hint: string): THREE.Mesh | null {
  let found: THREE.Mesh | null = null;
  scene.traverse((obj) => {
    if (found) return;
    const m = obj as THREE.Mesh;
    if (!(m as any).isMesh || !m.geometry) return;
    const mat = Array.isArray(m.material) ? m.material[0] : (m.material as THREE.Material | undefined);
    const matName = mat?.name?.toLowerCase() ?? '';
    if (matName.includes(hint.toLowerCase())) found = m;
  });
  return found;
}

// Costruisce, per ogni zona, la geometria ESATTA della sua area sulla superficie del
// cervello (invece di una sfera generica intorno a un punto) — così l'alone
// "illumina" davvero solo la porzione di corteccia di pertinenza, non un cerchio
// approssimativo. Stelo encefalico e cervelletto sono mesh separate: la loro area è
// semplicemente l'intera mesh. I 4 lobi condividono un'unica mesh di corteccia: ogni
// triangolo viene assegnato al lobo con il centro calibrato più vicino (una
// partizione tipo Voronoi). Tutte le geometrie vengono "cotte" nello stesso spazio
// locale (box/frazione) usato per posizionare i marker, così si possono disegnare
// direttamente dentro lo stesso <group scale offset> senza ulteriori trasformazioni.
function useZoneRegions(scene: THREE.Object3D | null, box: BoxInfo | null) {
  return useMemo(() => {
    const regions: Record<string, THREE.BufferGeometry> = {};
    if (!scene || !box) return regions;

    const WHOLE_MESH_ZONES: Record<string, string> = { brainstem: 'brain_stem', cerebellum: 'cerebellum' };
    Object.entries(WHOLE_MESH_ZONES).forEach(([slug, hint]) => {
      const mesh = findMeshByMaterialHint(scene, hint);
      if (!mesh) return;
      mesh.updateWorldMatrix(true, false);
      const g = mesh.geometry.clone();
      g.applyMatrix4(mesh.matrixWorld);
      regions[slug] = g;
    });

    const cortex = findMeshByMaterialHint(scene, 'brain_low');
    const lobes = BRAIN_ZONES_3D.filter((z) => !WHOLE_MESH_ZONES[z.slug]);
    if (cortex && lobes.length) {
      cortex.updateWorldMatrix(true, false);
      const baked = cortex.geometry.clone();
      baked.applyMatrix4(cortex.matrixWorld);
      const posAttr = baked.attributes.position;
      const idx = baked.index;
      const triCount = idx ? idx.count / 3 : posAttr.count / 3;
      const getVertexIndex = (i: number) => (idx ? idx.getX(i) : i);

      const lobeCenters = lobes.map(
        (z) =>
          new THREE.Vector3(
            box.min.x + z.fraction[0] * box.size.x,
            box.min.y + z.fraction[1] * box.size.y,
            box.min.z + z.fraction[2] * box.size.z
          )
      );

      // Peso relativo di ciascun lobo — dalle proporzioni anatomiche reali (vedi
      // l'infografica "Brain Lateral View" di riferimento): il frontale è il lobo più
      // esteso della superficie laterale, il temporale è quasi altrettanto grande,
      // il parietale è nella media, l'occipitale è il più piccolo. Un peso più alto fa
      // "vincere" quel lobo anche a distanza leggermente maggiore dal suo centro
      // calibrato (diagramma di Voronoi pesato), così il territorio assegnato rispecchia
      // le vere proporzioni invece di essere semplicemente equidistante.
      const LOBE_WEIGHT: Record<string, number> = {
        'frontal-lobe': 1.15,
        'parietal-lobe': 1.0,
        'temporal-lobe': 0.95,
        'occipital-lobe': 0.7,
      };

      const maxLocalDim = Math.max(box.size.x, box.size.y, box.size.z);
      // Usato solo per decidere se un centro specchiato è abbastanza distinto
      // dall'originale (sotto) — NON più come limite di raggio per l'assegnazione dei
      // triangoli: con lo specchiamento bilaterale ogni punto della corteccia ha
      // ormai un sito "vicino" su entrambi gli emisferi, quindi il vecchio limite
      // lasciava porzioni di lobo (specialmente vicino ai bordi) senza alcuna zona
      // assegnata — la "macchia" appariva incompleta invece di coprire l'intero lobo.
      const baseReach = maxLocalDim * 0.3;

      // Il punto calibrato di ogni lobo è stato cliccato su UN solo emisfero, ma ogni
      // lobo esiste su ENTRAMBI i lati del cervello. Specchiamo ogni centro rispetto
      // al piano mediano — stimato dalla x di stelo encefalico e cervelletto, che sono
      // strutture centrali per natura — per ottenere anche il centro del lato non
      // calibrato: così la corteccia si illumina simmetricamente su entrambi gli
      // emisferi, invece di "esplodere" su un lato (nessun limite di raggio dal lato
      // sbagliato) e restare completamente spenta sull'altro.
      const brainstemZone = BRAIN_ZONES_3D.find((z) => z.slug === 'brainstem');
      const cerebellumZone = BRAIN_ZONES_3D.find((z) => z.slug === 'cerebellum');
      const midlineFracX = ((brainstemZone?.fraction[0] ?? 0.5) + (cerebellumZone?.fraction[0] ?? 0.5)) / 2;
      const midlineX = box.min.x + midlineFracX * box.size.x;

      type Site = { zoneIndex: number; center: THREE.Vector3; weight: number };
      const sites: Site[] = [];
      lobes.forEach((z, li) => {
        const c = lobeCenters[li];
        const weight = LOBE_WEIGHT[z.slug] ?? 1;
        sites.push({ zoneIndex: li, center: c, weight });
        const mirrored = new THREE.Vector3(2 * midlineX - c.x, c.y, c.z);
        // Se il punto calibrato era già vicino al piano mediano, il centro specchiato
        // finirebbe quasi sovrapposto all'originale: inutile aggiungerlo.
        if (mirrored.distanceTo(c) > baseReach * 0.1) {
          sites.push({ zoneIndex: li, center: mirrored, weight });
        }
      });

      const tmp = new THREE.Vector3();
      const vertexCount = posAttr.count;
      const vertexZone = new Int8Array(vertexCount).fill(-1);
      for (let v = 0; v < vertexCount; v++) {
        tmp.fromBufferAttribute(posAttr, v);
        let bestZone = -1;
        let bestScore = Infinity;
        for (let si = 0; si < sites.length; si++) {
          const d = tmp.distanceToSquared(sites[si].center);
          const score = d / (sites[si].weight * sites[si].weight);
          if (score < bestScore) {
            bestScore = score;
            bestZone = sites[si].zoneIndex;
          }
        }
        // Ogni vertice della corteccia viene sempre assegnato al lobo (pesato) più
        // vicino: nessun taglio per distanza massima. Così l'intera superficie del
        // lobo risulta coperta dalla sua zona, bordo compreso — non solo un cerchio
        // vicino al punto calibrato.
        vertexZone[v] = bestZone;
      }

      const bucket: number[][] = lobeCenters.map(() => []);
      for (let t = 0; t < triCount; t++) {
        const a = getVertexIndex(t * 3);
        const b = getVertexIndex(t * 3 + 1);
        const c = getVertexIndex(t * 3 + 2);
        const za = vertexZone[a];
        const zb = vertexZone[b];
        const zc = vertexZone[c];
        // Maggioranza tra i 3 vertici (se b e c concordano vince quella zona,
        // altrimenti resta al vertice a) — evita bordi troppo frastagliati.
        const zone = zb === zc ? zb : za;
        if (zone === -1) continue;
        bucket[zone].push(a, b, c);
      }

      lobes.forEach((z, li) => {
        const tris = bucket[li];
        if (!tris.length) return;
        const positions = new Float32Array(tris.length * 3);
        for (let i = 0; i < tris.length; i++) {
          tmp.fromBufferAttribute(posAttr, tris[i]);
          positions[i * 3] = tmp.x;
          positions[i * 3 + 1] = tmp.y;
          positions[i * 3 + 2] = tmp.z;
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        g.computeVertexNormals();
        regions[z.slug] = g;
      });
    }

    return regions;
  }, [scene, box]);
}

// Shader "fresnel": la zona si illumina di più ai bordi (visti di taglio) e resta più
// tenue al centro — l'effetto "campo di energia" tipico delle interfacce 3D premium
// (Apple Vision Pro, configuratori di prodotto) invece di una tinta piatta uniforme.
const REGION_VERTEX_SHADER = `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;
const REGION_FRAGMENT_SHADER = `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uFresnelPower;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    float fresnel = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewDir)), 0.0), uFresnelPower);
    // Base alta (0.55) così l'intera zona resta chiaramente visibile anche di fronte
    // alla camera — il fresnel aggiunge solo un accento più acceso ai bordi, non è
    // l'unica fonte di visibilità (altrimenti il centro del lobo sembra "spento").
    float alpha = uOpacity * (0.55 + 0.45 * fresnel);
    gl_FragColor = vec4(uColor, clamp(alpha, 0.0, 1.0));
  }
`;

// Alone che ricalca la vera area anatomica della zona sulla superficie del cervello
// (non una sfera): stessa geometria della corteccia/mesh di pertinenza, leggermente
// scostata nel depth buffer (polygonOffset) per restare visibile senza z-fighting.
// Transizioni ammorbidite (lerp verso il target ogni frame, non scatti istantanei) e
// bordo "fresnel" per un effetto rifinito da app premium.
function RegionHighlight({
  geometry,
  color,
  hovered,
  onHover,
  onLeave,
  onClick,
}: {
  geometry: THREE.BufferGeometry;
  color: string;
  hovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const opacityRef = useRef(0);
  const colorVec = useMemo(() => new THREE.Color(color), [color]);
  const uniforms = useMemo(
    () => ({
      uColor: { value: colorVec },
      uOpacity: { value: 0 },
      uFresnelPower: { value: 2.2 },
    }),
    [colorVec]
  );

  useFrame(({ clock }) => {
    if (!matRef.current) return;
    // Ora tutta la corteccia è ripartita tra i 4 lobi (nessun buco), quindi le 4
    // regioni insieme coprono l'intera superficie: se restassero visibili anche a
    // riposo il cervello sembrerebbe "tutto verde" invece di 4 zone distinte.
    // Perciò a riposo l'opacità è 0 (invisibile) — la zona "diventa evidente" solo
    // quando ci passi sopra o la selezioni, come richiesto.
    const breathe = hovered ? Math.sin(clock.elapsedTime * 1.6) * 0.04 : 0;
    const target = hovered ? 0.85 + breathe : 0;
    // Interpolazione morbida verso il valore obiettivo: hover/unhover diventa una
    // dissolvenza fluida invece di uno scatto secco.
    opacityRef.current += (target - opacityRef.current) * 0.12;
    matRef.current.uniforms.uOpacity.value = opacityRef.current;
    matRef.current.uniforms.uFresnelPower.value += ((hovered ? 1.4 : 2.4) - matRef.current.uniforms.uFresnelPower.value) * 0.1;
  });

  return (
    <mesh
      geometry={geometry}
      renderOrder={10}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onHover();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onLeave();
        document.body.style.cursor = 'auto';
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {/* Questa geometria coincide ESATTAMENTE con la superficie del cervello
          sottostante (è "cotta" dagli stessi vertici) — con il depth test normale la
          precisione limitata dello z-buffer la fa sparire quasi ovunque dietro la
          mesh opaca (z-fighting), qualunque polygonOffset si usi: è la causa per cui
          la zona risultava invisibile. Soluzione da "decal" robusta: niente depth
          test + render order alto, così questo strato disegna SEMPRE sopra,
          garantito, indipendentemente da distanza camera o precisione dello
          z-buffer. L'opacità (mai 1.0) evita che copra il dettaglio anatomico sotto. */}
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        depthTest={false}
        side={THREE.DoubleSide}
        uniforms={uniforms}
        vertexShader={REGION_VERTEX_SHADER}
        fragmentShader={REGION_FRAGMENT_SHADER}
      />
    </mesh>
  );
}

// Modello reale del cervello — cervello intero non sezionato, "Human Brain" di agher08
// su Sketchfab, licenza CC-BY-4.0 (credito discreto sotto il viewer) — servito da
// /public/models/brain/scene.gltf.
function BrainScene({
  onSelectZone,
  hoveredSlug,
  setHoveredSlug,
  zoneNames,
}: {
  onSelectZone: (slug: string) => void;
  hoveredSlug: string | null;
  setHoveredSlug: (slug: string | null) => void;
  zoneNames: Record<string, string>;
}) {
  const { scene } = useGLTF('/models/brain/scene.gltf');
  const [transform, setTransform] = useState<{ scale: number; offset: THREE.Vector3 } | null>(null);
  const [box, setBox] = useState<BoxInfo | null>(null);

  useEffect(() => {
    if (!scene) return;

    // Esclude piccoli frammenti estranei che gonfierebbero il bounding box senza far
    // parte del cervello visibile: teniamo solo le mesh con almeno il 5% dei vertici
    // della mesh più grande.
    const meshes: THREE.Mesh[] = [];
    scene.traverse((obj) => {
      const m = obj as THREE.Mesh;
      if ((m as any).isMesh && m.geometry) meshes.push(m);
    });

    let b: THREE.Box3;
    if (meshes.length === 0) {
      b = new THREE.Box3().setFromObject(scene);
    } else {
      const counts = meshes.map((m) => m.geometry.attributes.position?.count || 0);
      const maxCount = Math.max(...counts);
      const keep = meshes.filter((_, i) => counts[i] >= maxCount * 0.05);
      b = new THREE.Box3();
      keep.forEach((m) => {
        m.updateWorldMatrix(true, false);
        b.union(new THREE.Box3().setFromObject(m));
      });
    }

    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    b.getSize(size);
    b.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = 2.2 / maxDim;
    setTransform({ scale, offset: center.clone().multiplyScalar(-scale) });
    setBox({ min: b.min.clone(), size });
  }, [scene]);

  const zoneRegions = useZoneRegions(scene, box);

  if (!transform || !box) return null;

  // Raggio del piccolo alone di riserva (sfera), usato solo per le zone senza una
  // geometria di area precisa disponibile — non dovrebbe capitare in condizioni
  // normali, dato che tutte e 6 le zone hanno una mesh/area dedicata.
  const haloRadius = Math.max(box.size.x, box.size.y, box.size.z) * 0.11;

  return (
    <group scale={transform.scale} position={transform.offset}>
      <primitive object={scene} />

      {BRAIN_ZONES_3D.map((zone) => {
        const localPos: [number, number, number] = [
          box.min.x + zone.fraction[0] * box.size.x,
          box.min.y + zone.fraction[1] * box.size.y,
          box.min.z + zone.fraction[2] * box.size.z,
        ];
        const color = '#32D6A0';
        const region = zoneRegions[zone.slug];
        const hovered = hoveredSlug === zone.slug;

        return (
          <Fragment key={zone.slug}>
            {region && (
              <RegionHighlight
                geometry={region}
                color={color}
                hovered={hovered}
                onHover={() => setHoveredSlug(zone.slug)}
                onLeave={() => setHoveredSlug(null)}
                onClick={() => onSelectZone(zone.slug)}
              />
            )}
            <ZoneMarker
              name={zoneNames[zone.slug] ?? zone.name}
              position={localPos}
              haloRadius={haloRadius}
              hasRegion={!!region}
              color={color}
              hovered={hovered}
              onHover={() => setHoveredSlug(zone.slug)}
              onLeave={() => setHoveredSlug(null)}
              onClick={() => onSelectZone(zone.slug)}
            />
          </Fragment>
        );
      })}
    </group>
  );
}

useGLTF.preload('/models/brain/scene.gltf');

function LoadingFallback({ text }: { text: string }) {
  return (
    <Html center>
      <div className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 text-xs text-white/60">
        {text}
      </div>
    </Html>
  );
}

function ZoneMarker({
  name,
  position,
  haloRadius,
  hasRegion,
  color,
  hovered,
  onHover,
  onLeave,
  onClick,
}: {
  name: string;
  position: [number, number, number];
  haloRadius: number;
  hasRegion: boolean;
  color: string;
  hovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}) {
  const haloRef = useRef<THREE.Mesh>(null);
  const haloCoreRef = useRef<THREE.Mesh>(null);
  const haloOpacityRef = useRef(0.1);
  const haloCoreOpacityRef = useRef(0.05);

  useFrame(({ clock }) => {
    if (haloRef.current) {
      const breathe = 1 + Math.sin(clock.elapsedTime * 1.6 + position[0] * 5) * 0.06;
      haloRef.current.scale.setScalar(hovered ? 1.25 : breathe);
      const mat = haloRef.current.material as THREE.MeshBasicMaterial;
      haloOpacityRef.current += ((hovered ? 0.32 : 0.1) - haloOpacityRef.current) * 0.12;
      mat.opacity = haloOpacityRef.current;
    }
    if (haloCoreRef.current) {
      const mat = haloCoreRef.current.material as THREE.MeshBasicMaterial;
      haloCoreOpacityRef.current += ((hovered ? 0.18 : 0.05) - haloCoreOpacityRef.current) * 0.12;
      mat.opacity = haloCoreOpacityRef.current;
    }
  });

  return (
    <group position={position}>
      {/* Alone "di riserva" a sfera — usato solo se questa zona non ha ancora una
          geometria di area precisa (hasRegion=false), es. durante il primo caricamento
          o come fallback difensivo. */}
      {!hasRegion && (
        <>
          <mesh
            ref={haloRef}
            onPointerOver={(e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation();
              onHover();
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={(e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation();
              onLeave();
              document.body.style.cursor = 'auto';
            }}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <sphereGeometry args={[haloRadius, 24, 24]} />
            <meshBasicMaterial color={color} transparent opacity={0.1} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
          <mesh ref={haloCoreRef} scale={0.55}>
            <sphereGeometry args={[haloRadius, 24, 24]} />
            <meshBasicMaterial color={color} transparent opacity={0.05} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        </>
      )}
      {/* Il pallino verde è stato rimosso: la zona anatomica precisa (RegionHighlight)
          è già essa stessa l'area cliccabile/hoverable, e la sua stessa illuminazione
          al passaggio del mouse basta a segnalare dove sei — un punto fisso in più
          risultava ridondante ora che l'intera area del lobo reagisce. Resta solo
          l'etichetta col nome, ancorata allo stesso punto calibrato. */}
      {/* NIENTE distanceFactor: qualunque valore provato veniva scalato in modo
          imprevedibile dalla distanza 3D della camera (anche vicino allo zoom minimo
          diventava enorme). Senza distanceFactor, Html usa dimensione CSS fissa in
          pixel di schermo — una targhetta 2D "ancorata" al punto, sempre della stessa
          dimensione a schermo qualunque sia lo zoom: comportamento prevedibile.
          Sempre montata (non solo quando hovered) e animata via CSS opacity/transform,
          così appare/scompare con una dissolvenza fluida invece di un pop-in secco. */}
      <Html center style={{ pointerEvents: 'none' }}>
        <div
          className="whitespace-nowrap flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-xl border border-white/10 shadow-[0_6px_20px_rgba(0,0,0,0.4)] text-[10px] font-medium text-white transition-[opacity,transform] duration-200 ease-out"
          style={{
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'translateY(-2.4rem) scale(1)' : 'translateY(-1.6rem) scale(0.85)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
          {name}
        </div>
      </Html>
    </group>
  );
}

// Rotazione automatica lenta quando l'utente non sta interagendo (si ferma appena
// trascini, riparte 2.5s dopo che rilasci) — dà "vita" al modello invece di restare
// fermo in attesa, come nei configuratori 3D delle app più curate. Muta l'istanza di
// OrbitControls direttamente (nessun re-render React ad ogni frame).
function AutoRotateControls() {
  const controlsRef = useRef<any>(null);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleResume = () => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => {
      if (controlsRef.current) controlsRef.current.autoRotate = true;
    }, 2500);
  };

  useEffect(() => {
    scheduleResume();
    return () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      minDistance={1.5}
      maxDistance={12}
      rotateSpeed={0.6}
      enableDamping
      dampingFactor={0.08}
      autoRotate
      autoRotateSpeed={0.6}
      onStart={() => {
        if (resumeTimer.current) clearTimeout(resumeTimer.current);
        if (controlsRef.current) controlsRef.current.autoRotate = false;
      }}
      onEnd={scheduleResume}
    />
  );
}

export default function BrainMap3D({ onSelectZone }: { onSelectZone: (slug: string) => void }) {
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const ui = useUiStrings();
  const bm = ui.brainMap;

  return (
    <div className="relative w-full h-[520px] sm:h-[760px] rounded-[28px] border border-black/[0.06] dark:border-white/10 bg-[#08090b] overflow-hidden">
      <Canvas camera={{ position: [1.9, 1.05, 2.7], fov: 42 }} dpr={[1, 2]}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 4, 2]} intensity={1.3} color="#fff2e6" />
        <directionalLight position={[-3, -1, -3]} intensity={0.45} color="#ffffff" />
        <pointLight position={[0, 1.5, 3]} intensity={0.5} color="#ffffff" />
        <Suspense fallback={<LoadingFallback text={bm.loading3DModel} />}>
          <BrainScene onSelectZone={onSelectZone} hoveredSlug={hoveredSlug} setHoveredSlug={setHoveredSlug} zoneNames={bm.zoneNames} />
        </Suspense>
        <AutoRotateControls />
      </Canvas>

      <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] text-white/40">
        {bm.dragRotateZoom}
      </p>

      {/* Credito CC-BY-4.0 richiesto dalla licenza del modello "Human Brain" di agher08
          (Sketchfab) — discreto ma presente, come richiesto dalla licenza. */}
      <a
        href="https://sketchfab.com/3d-models/human-brain-c9c9d4d671b94345952d012cc2ea7a24"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-1 right-2 text-[9px] text-white/20 hover:text-white/40 transition-colors"
      >
        {bm.modelCreditPrefix} agher08 (CC BY 4.0)
      </a>
    </div>
  );
}
