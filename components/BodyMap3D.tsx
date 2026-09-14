'use client';

import { Fragment, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useUiStrings } from '@/contexts/LanguageContext';
import { APP_LANGS, UI_STRINGS } from '@/lib/i18n/uiStrings';

// ============================================================================
// MODELLO — v4: sostituzione completa del modello 3D visivo.
//
// Il modello precedente (CC BY 4.0, Diego Luján García) è stato sostituito con
// "Body Muscle Anatomy 3D Model" di TurboSquid (#1398841, licenza Standard —
// uso commerciale/derivati inclusi, nessun obbligo di attribuzione, unico
// limite: non ridistribuire il file asset grezzo). Acquistato appositamente
// per risolvere alla radice il problema di precisione anatomica che nessuna
// stima/misurazione a occhio sul modello vecchio riusciva a risolvere.
//
// Differenza architetturale fondamentale rispetto a prima: il modello vecchio
// era UNA superficie continua senza nomi anatomici, quindi le 19 zone erano
// ricostruite a runtime con una partizione Voronoi pesata (stime di posizione
// + pesi + fasce di altezza, tutte calibrate a mano). Questo modello invece è
// già segmentato in 125 mesh separate (bones/muscoli/organi), ciascuna con un
// nome (anche se generico tipo "Torso_muscle:18", non anatomico). Le zone ora
// sono semplicemente GRUPPI DI MESH VERE — nessuna stima geometrica a runtime,
// nessuna Voronoi, nessun bordo "indovinato": il bordo di ogni zona è il bordo
// vero del muscolo nella mesh acquistata.
//
// L'associazione zona -> mesh (ZONE_OBJECT_MAP sotto) è stata determinata
// offline analizzando posizione/profondità/forma di ciascuna delle 125 mesh
// (vedi metodologia già usata per isolare il pettorale: Torso_muscle:18+19)
// e verificata con render colorati per zona (fronte/retro) prima di essere
// portata qui. Confidenza: alta per torso e spalla/bicipite/tricipite
// (sezione trasversale del braccio verificata esplicitamente); media per
// avambraccio/mano e per le zone delle gambe (fasce altezza+profondità
// sistematiche, stesso metodo del petto, ma senza verifica isolata
// mesh-per-mesh come per bicipite/tricipite).
//
// Pipeline di conversione: OBJ (600k vertici, 125 oggetti) -> glTF
// (obj2gltf, sul Mac dell'utente per via di restrizioni di rete di questo
// sandbox) -> compressione/decimazione (@gltf-transform/cli simplify,
// ratio 0.15) -> 163.888 vertici, 6.84MB, TUTTI i 125 nomi oggetto
// preservati (verificato programmaticamente, zero perdite sui 67 nomi usati
// dalle zone). Le texture (Diffuse+Normal, 1024px, JPEG) sono applicate qui
// a runtime per materiale invece che incorporate nel binario, per tenere il
// file .glb leggero; AO/Roughness/Metallic e la texture occhio (50MB bitmap)
// sono stati omessi deliberatamente — impatto visivo trascurabile per un
// visualizzatore rotante, guadagno enorme in peso di download.
// ============================================================================

interface BoxInfo {
  min: THREE.Vector3;
  size: THREE.Vector3;
}

// Nome oggetto GLB -> materiale GLTF (usemtl originale dell'OBJ) -> prefisso
// file texture. Le texture vivono in /public/models/body-v2/textures/.
const MATERIAL_TEXTURES: Record<string, { diffuse: string; normal: string } | null> = {
  Eye: null, // texture originale 50MB, impatto visivo minimo: colore piatto
  Face_muscle: { diffuse: 'Face_muscle_default_Diffuse.jpg', normal: 'Face_muscle_default_Normal.jpg' },
  Arms_muscle: { diffuse: 'Arms_Muscle_Diffuse.jpg', normal: 'Arms_Muscle_Normal.jpg' },
  Arms_bone: { diffuse: 'Arms_bone_Diffuse.jpg', normal: 'Arms_bone_Normal.jpg' },
  Spine_vertebra_bone: { diffuse: 'Spine_vertebra_bone_Diffuse.jpg', normal: 'Spine_vertebra_bone_Normal.jpg' },
  Torso_bone: { diffuse: 'Torso_bone_Diffuse.jpg', normal: 'Torso_bone_Normal.jpg' },
  Torso_muscle_anatomy: { diffuse: 'Torso_muscle_anatomy_Diffuse.jpg', normal: 'Torso_muscle_anatomy_Normal.jpg' },
  Legs_Muscle: { diffuse: 'Anatomy_Legs_and_Foot_Muscle_Diffuse.jpg', normal: 'Anatomy_Legs_and_Foot_Muscle_Normal.jpg' },
  Legs_bones: { diffuse: 'Anatomy_Legs_and_Foot_bones_Diffuse.jpg', normal: 'Anatomy_Legs_and_Foot_bones_Normal.jpg' },
  Skull_bone: { diffuse: 'Skull_bone_Diffuse.jpg', normal: 'Skull_bone_Normal.jpg' },
  Pelvic_bone: { diffuse: 'Pelvic_bone_default_Diffuse.jpg', normal: 'Pelvic_bone_default_Normal.jpg' },
};
const TEX_BASE = '/models/body-v2/textures/';

// Zona -> elenco di mesh reali che la compongono (vedi commento sopra sulla
// metodologia e sui livelli di confidenza).
//
// NOTA BUG RISOLTO (causa di "manca il resto" — solo braccia/spalle/bicipite/
// tricipite visibili, tutto il resto assente): i nomi originali degli oggetti
// nel file OBJ/GLB usano i due punti per le duplicazioni C4D, es.
// "Torso_muscle:2", "Legs_Muscle:20". Il GLTFLoader di three.js, però, pulisce
// SEMPRE i nomi dei nodi rimuovendo i caratteri riservati "[ ] . : /" (usati
// internamente per il parsing dei nomi delle animation track — vedi
// THREE.PropertyBinding.sanitizeNodeName), quindi a runtime il nodo si chiama
// "Torso_muscle2", non "Torso_muscle:2". La mappa sotto usava ancora i due
// punti: meshByName.get('Torso_muscle:2') non trovava mai nulla per NESSUNA
// zona che li contenesse (torso quasi intero, tutte le zone delle gambe),
// mentre le zone braccio funzionavano perché i loro nomi originali non hanno
// mai avuto i due punti. Fix: nomi allineati a come li chiama three.js dopo
// il caricamento (verificato: nessuna collisione di nomi dopo la pulizia).
const ZONE_OBJECT_MAP: Record<string, string[]> = {
  'cervical-spine': ['Torso_muscle2', 'Torso_muscle3', 'Torso_muscle9', 'Torso_muscle15'],
  trapezius: ['Torso_muscle1', 'Torso_muscle5', 'Torso_muscle8', 'Torso_muscle10', 'Torso_muscle12', 'Torso_muscle16'],
  shoulder: ['Torso_muscle4', 'Torso_muscle7', 'Torso_muscle11', 'Torso_muscle20', 'Torso_muscle21', 'Arms_muscle8'],
  chest: ['Torso_muscle18', 'Torso_muscle19'],
  'core-abdomen': ['Torso_muscle6', 'Torso_muscle17'],
  'thoracic-spine': ['Torso_muscle13'],
  'lumbar-spine': ['Torso_muscle14'],
  biceps: ['Arms_muscle2'],
  triceps: ['Arms_muscle4', 'Arms_muscle1', 'Arms_muscle6', 'Arms_muscle9'],
  elbow: ['Arms_muscle10'],
  forearm: ['Arms_muscle11', 'Arms_muscle16', 'Arms_muscle5', 'Arms_muscle15', 'Arms_muscle3', 'Arms_muscle', 'Arms_muscle17', 'Arms_muscle13', 'Arms_muscle14'],
  'wrist-hand': ['Arms_muscle12', 'Arms_muscle7'],
  hip: ['Legs_Muscle20', 'Legs_Muscle5'],
  glutes: ['Legs_Muscle11', 'Legs_Muscle12', 'Legs_Muscle6'],
  quadriceps: ['Legs_Muscle2', 'Legs_Muscle4', 'Legs_Muscle15', 'Legs_Muscle17', 'Legs_Muscle16', 'Legs_Muscle23', 'Legs_Muscle1'],
  hamstrings: ['Legs_Muscle10', 'Legs_Muscle21', 'Legs_Muscle24', 'Legs_Muscle22', 'Legs_Muscle13', 'Legs_Muscle3', 'Legs_Muscle7'],
  knee: ['Legs_bone9'],
  calf: ['Legs_Muscle14', 'Legs_Muscle8', 'Legs_Muscle9', 'Legs_Muscle25', 'Legs_Muscle26'],
  'ankle-foot': ['Legs_Muscle18', 'Legs_Muscle19', 'Legs_Muscle27'],
};

// Zone display names are localized (see ui.bodyMap.zoneNames in
// lib/i18n/uiStrings.ts) and passed in as props — this used to be a
// hardcoded English-only map, which is why zone labels never translated.
const ZONE_ORDER = Object.keys(ZONE_OBJECT_MAP);

// Every language's zone names, precomputed once, so search matches a zone
// typed in any of the 4 languages regardless of which one is currently
// displayed (e.g. typing "cadera" still finds the hip zone in English UI).
const ALL_LANG_ZONE_NAMES: Record<string, string>[] = APP_LANGS.map(
  (l) => UI_STRINGS[l].bodyMap.zoneNames as Record<string, string>
);

// Sinonimi italiani per zona, usati solo dalla ricerca (i nomi mostrati sopra
// la mesh restano quelli in ZONE_NAMES, invariati). Aiuta chi digita in
// italiano a trovare la zona anche se il termine inglese non coincide.
const ZONE_SEARCH_ALIASES: Record<string, string[]> = {
  'cervical-spine': ['cervicale', 'collo', 'rachide cervicale'],
  trapezius: ['trapezio'],
  shoulder: ['spalla', 'deltoide'],
  chest: ['petto', 'pettorali', 'torace'],
  biceps: ['bicipite'],
  triceps: ['tricipite'],
  elbow: ['gomito'],
  forearm: ['avambraccio'],
  'wrist-hand': ['polso', 'mano'],
  'core-abdomen': ['addome', 'core', 'pancia'],
  'thoracic-spine': ['dorsale', 'rachide toracico', 'schiena alta'],
  'lumbar-spine': ['lombare', 'rachide lombare', 'schiena bassa'],
  hip: ['anca'],
  glutes: ['glutei'],
  quadriceps: ['quadricipite', 'coscia'],
  hamstrings: ['femorali', 'ischiocrurali'],
  knee: ['ginocchio'],
  calf: ['polpaccio'],
  'ankle-foot': ['caviglia', 'piede'],
};

function zoneMatchesQuery(slug: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  if (slug.toLowerCase().includes(q)) return true;
  if (ALL_LANG_ZONE_NAMES.some((names) => names[slug]?.toLowerCase().includes(q))) return true;
  return (ZONE_SEARCH_ALIASES[slug] || []).some((alias) => alias.toLowerCase().includes(q));
}

// ============================================================================
// ZONE PROFONDE (ossa) — v5.
//
// Le 19 zone sopra usano solo le mesh "muscolo" (la superficie che si vede).
// Il modello acquistato include anche 28 mesh ossee finora inutilizzate.
// Non diventano zone indipendenti (nessuna nuova scheda clinica da creare in
// Phygo): sono un livello aggiuntivo delle zone GIÀ esistenti, visibile solo
// in modalità "raggi-X" quando quella zona è attiva — il muscolo sopra si fa
// semi-trasparente e l'osso sotto si illumina.
//
// Identificazione fatta per via geometrica (posizione/forma isolata, stessa
// metodologia delle zone muscolari) e incrociata con Kapandji — Fisiologia
// Articolare (Arto Superiore/Inferiore/Testa e Tronco): struttura generale
// della vertebra (corpo + arco posteriore), curve del rachide (lordosi
// cervicale/lombare, cifosi dorsale), rapporto radio-ulna al gomito.
//
// Due correzioni importanti trovate SOLO grazie alla verifica visiva (i nomi
// nel file NON corrispondono all'anatomia reale):
// - l'oggetto chiamato "Pelvic_bone" nel file è in realtà il SACRO (forma
//   piccola, centrale, con le tipiche docce sacrali) — qui trattato come
//   parte del rachide lombare;
// - l'oggetto chiamato "Coccyx" nel file è in realtà il BACINO (ali iliache
//   ben visibili, struttura molto più larga) — qui associato ad anca/glutei.
// Se non avessi controllato visivamente le mesh isolate, questi due sarebbero
// stati scambiati.
// Ogni gruppo osseo è cliccabile ED è una "pagina" a sé, indipendente dalle
// 19 zone muscolari — cliccare il femore in raggi-X deve portare alla scheda
// del femore (anatomia + patologie ossee possibili: fratture, ecc.), non a
// quella di quadricipite/femorali. Servono quindi SLUG NUOVI e DISTINTI dalle
// 19 zone esistenti (prefisso "bone-"): la pagina corrispondente in Phygo va
// creata per ciascuno di questi (vedi nota a fondo file).
const BONE_GROUPS: Record<string, string[]> = {
  'bone-cranio': ['Skull_bone1', 'Skull_bone2', 'Skull_boneTooth1', 'Skull_boneTooth2', 'Skull_boneTooth3', 'Skull_boneTooth4'],
  'bone-clavicola-scapola': ['Torso_bone1', 'Torso_bone2'],
  'bone-coste-sterno': ['Torso_bone3', 'Torso_bone4', 'Torso_bone5'], // incl. coste fluttuanti
  'bone-omero': ['Arms_bone3'],
  'bone-radio-ulna': ['Arms_bone1', 'Arms_bone2'],
  'bone-mano': ['Arms_bone4', 'Arms_bone5', 'Arms_bone6', 'Arms_bone7', 'Arms_bone8'],
  'bone-bacino': ['Coccyx'], // nome file errato: è il bacino, non il coccige — vedi commento sopra
  'bone-sacro': ['Pelvic_bone'], // nome file errato: è il sacro, non il bacino — vedi commento sopra
  'bone-femore': ['Legs_bone10'],
  'bone-tibia-perone': ['Legs_bone1', 'Legs_bone2'],
  'bone-piede': ['Legs_bone3', 'Legs_bone4', 'Legs_bone5', 'Legs_bone6', 'Legs_bone7', 'Legs_bone8'],
};
// Bone display names are localized (see ui.bodyMap.boneNames in
// lib/i18n/uiStrings.ts) and passed in as props — same fix as ZONE_NAMES
// above. BONE_ORDER is derived independently of any name map: the 11
// BONE_GROUPS keys, followed by the 3 BONE_SPINE_BANDS keys (cervical/
// thoracic/lumbar vertebrae, sliced from the spine mesh by height band —
// see BONE_SPINE_BANDS below).
const BONE_ORDER = [...Object.keys(BONE_GROUPS), 'bone-cervicale', 'bone-dorsale', 'bone-lombare'];

// Le 3 mesh "Spine_vertebra_bone*" (vedi sotto) non hanno un confine pulito
// per livello, quindi per avere 3 zone cliccabili separate (cervicale /
// dorsale / lombare) si ritaglia la stessa nuvola di vertici per fascia di
// altezza Y, con soglie allineate ai confini già usati dalle zone muscolari
// corrispondenti.
const BONE_SPINE_BANDS: Record<string, [number, number]> = {
  'bone-cervicale': [660, Infinity],
  'bone-dorsale': [517, 660],
  'bone-lombare': [-Infinity, 517],
};

// Materiali "muscolo" da rendere semi-trasparenti quando la modalità raggi-X
// è attiva — TUTTI insieme (torso, braccia, gambe), per mostrare l'intero
// scheletro in una volta sola, non zona per zona.
const XRAY_FADE_MATERIALS = ['Torso_muscle_anatomy', 'Arms_muscle', 'Legs_Muscle'];

// Le 3 mesh "Spine_vertebra_bone*": intera colonna vertebrale (cervicale +
// dorsale + lombare), presa per intero per lo scheletro completo.
const SPINE_BONE_NAMES = ['Spine_vertebra_bone1', 'Spine_vertebra_bone2', 'Spine_vertebra_bone3'];

// Applica le texture (Diffuse+Normal) una sola volta per gruppo materiale —
// stessa istanza di THREE.Texture riusata su tutte le mesh che condividono
// quel materiale, invece di ricaricare il file per ogni mesh. Ritorna la
// mappa dei materiali creati: serve dopo per l'effetto raggi-X (animare
// l'opacità dei materiali "muscolo" quando si rivela una zona profonda).
function applyMaterials(scene: THREE.Object3D): Map<string, THREE.MeshStandardMaterial> {
  const loader = new THREE.TextureLoader();
  const madeMaterials = new Map<string, THREE.MeshStandardMaterial>();

  const buildMaterial = (matName: string): THREE.MeshStandardMaterial => {
    const cached = madeMaterials.get(matName);
    if (cached) return cached;

    const tex = MATERIAL_TEXTURES[matName];
    const mat = new THREE.MeshStandardMaterial({ roughness: 0.65, metalness: 0.05 });
    if (tex) {
      const diffuse = loader.load(TEX_BASE + tex.diffuse);
      diffuse.colorSpace = THREE.SRGBColorSpace;
      diffuse.flipY = false;
      mat.map = diffuse;
      const normal = loader.load(TEX_BASE + tex.normal);
      normal.flipY = false;
      mat.normalMap = normal;
    } else {
      mat.color = new THREE.Color('#c9a68e');
    }
    madeMaterials.set(matName, mat);
    return mat;
  };

  scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!(mesh as any).isMesh) return;
    const srcMat = mesh.material as THREE.Material | THREE.Material[];
    const singleMat = Array.isArray(srcMat) ? srcMat[0] : srcMat;
    const matName = singleMat?.name || 'default';
    mesh.material = buildMaterial(matName);
  });

  return madeMaterials;
}

// Unisce le geometrie (posizioni world-space "cotte", coincidenti con lo
// spazio locale visto che i 125 nodi del GLB non hanno trasformazioni proprie
// — verificato: tutti a identità) delle mesh reali di una zona in un'unica
// BufferGeometry, per l'overlay di evidenziazione hover/click.
// Stessa pulizia che three.js applica ai nomi dei nodi in fase di caricamento
// GLTF (THREE.PropertyBinding.sanitizeNodeName: spazi -> "_", caratteri
// riservati "[ ] . : /" rimossi). Usata come fallback di sicurezza nel lookup
// sotto, così anche se ZONE_OBJECT_MAP contenesse per errore un nome "grezzo"
// (con i due punti dell'OBJ originale) la mesh viene comunque trovata.
function sanitizeThreeName(name: string): string {
  return name.replace(/\s/g, '_').replace(/[[\].:/]/g, '');
}

function mergeNamedMeshes(meshByName: Map<string, THREE.Mesh>, names: string[]): THREE.BufferGeometry | null {
  const meshes = names
    .map((n) => meshByName.get(n) ?? meshByName.get(sanitizeThreeName(n)))
    .filter((m): m is THREE.Mesh => !!m);
  if (!meshes.length) return null;

  let totalVerts = 0;
  let totalTris = 0;
  meshes.forEach((m) => {
    totalVerts += m.geometry.attributes.position.count;
    const idx = m.geometry.index;
    totalTris += idx ? idx.count / 3 : m.geometry.attributes.position.count / 3;
  });
  const positions = new Float32Array(totalVerts * 3);
  const index = new Uint32Array(totalTris * 3);
  let vOffset = 0;
  let iOffset = 0;
  meshes.forEach((m) => {
    // Letto vertice per vertice con getX/getY/getZ invece di copiare
    // direttamente .array: dopo la compressione di gltf-transform gli
    // attributi possono essere interleaved (un unico buffer condiviso con
    // normal/uv), quindi .array non è un semplice elenco di posizioni e una
    // copia diretta sfora l'offset (bug trovato: "positions.set out of
    // bounds"). getX/getY/getZ gestiscono correttamente qualsiasi layout.
    const attr = m.geometry.attributes.position;
    const count = attr.count;
    for (let v = 0; v < count; v++) {
      positions[(vOffset + v) * 3] = attr.getX(v);
      positions[(vOffset + v) * 3 + 1] = attr.getY(v);
      positions[(vOffset + v) * 3 + 2] = attr.getZ(v);
    }
    // FONDAMENTALE, mancava nella prima versione: senza riportare anche
    // l'indice dei triangoli (che dopo la decimazione NON è quasi mai
    // "ogni 3 vertici consecutivi = un triangolo"), Three.js interpreta i
    // vertici fusi come una sequenza arbitraria di triangoli e disegna
    // segmenti che saltano da un punto all'altro della mesh — è esattamente
    // il grande triangolo "a vela" visto nel primo test dal vivo, non un
    // problema di posizione delle zone.
    const idxAttr = m.geometry.index;
    if (idxAttr) {
      for (let i = 0; i < idxAttr.count; i++) {
        index[iOffset + i] = idxAttr.getX(i) + vOffset;
      }
      iOffset += idxAttr.count;
    } else {
      for (let i = 0; i < count; i++) index[iOffset + i] = vOffset + i;
      iOffset += count;
    }
    vOffset += count;
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  g.setIndex(new THREE.BufferAttribute(index, 1));
  g.computeVertexNormals();
  return g;
}

// Come mergeNamedMeshes, ma per il livello osseo (raggi-X): in più accetta
// una fascia di altezza Y opzionale (non usata al momento — lo scheletro
// completo prende ogni mesh per intero — ma tenuta per un eventuale ritaglio
// futuro) e tiene un triangolo solo se TUTTI e 3 i suoi vertici cadono nella
// fascia. Qui si ricostruiscono i vertici per triangolo invece di riusare un
// indice condiviso: più semplice e sicuro quando si scarta una parte della
// mesh, il costo in memoria è trascurabile per queste dimensioni (overlay
// decorativo, non geometria di scena principale).
function mergeBoneMeshes(
  meshByName: Map<string, THREE.Mesh>,
  names: string[],
  yRange?: [number, number]
): THREE.BufferGeometry | null {
  const meshes = names
    .map((n) => meshByName.get(n) ?? meshByName.get(sanitizeThreeName(n)))
    .filter((m): m is THREE.Mesh => !!m);
  if (!meshes.length) return null;

  const positions: number[] = [];
  meshes.forEach((m) => {
    const attr = m.geometry.attributes.position;
    const count = attr.count;
    const vx = new Float32Array(count);
    const vy = new Float32Array(count);
    const vz = new Float32Array(count);
    for (let v = 0; v < count; v++) {
      vx[v] = attr.getX(v);
      vy[v] = attr.getY(v);
      vz[v] = attr.getZ(v);
    }
    const idxAttr = m.geometry.index;
    const triCount = idxAttr ? idxAttr.count / 3 : count / 3;
    for (let t = 0; t < triCount; t++) {
      const i0 = idxAttr ? idxAttr.getX(t * 3) : t * 3;
      const i1 = idxAttr ? idxAttr.getX(t * 3 + 1) : t * 3 + 1;
      const i2 = idxAttr ? idxAttr.getX(t * 3 + 2) : t * 3 + 2;
      if (yRange) {
        const [yMin, yMax] = yRange;
        if (vy[i0] < yMin || vy[i0] >= yMax) continue;
        if (vy[i1] < yMin || vy[i1] >= yMax) continue;
        if (vy[i2] < yMin || vy[i2] >= yMax) continue;
      }
      [i0, i1, i2].forEach((i) => {
        positions.push(vx[i], vy[i], vz[i]);
      });
    }
  });

  if (!positions.length) return null;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
  g.computeVertexNormals();
  return g;
}

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
    float alpha = uOpacity * (0.55 + 0.45 * fresnel);
    gl_FragColor = vec4(uColor, clamp(alpha, 0.0, 1.0));
  }
`;

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
    const breathe = hovered ? Math.sin(clock.elapsedTime * 1.6) * 0.04 : 0;
    const target = hovered ? 0.85 + breathe : 0;
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
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        depthTest
        polygonOffset
        polygonOffsetFactor={-4}
        polygonOffsetUnits={-4}
        side={THREE.DoubleSide}
        uniforms={uniforms}
        vertexShader={REGION_VERTEX_SHADER}
        fragmentShader={REGION_FRAGMENT_SHADER}
      />
    </mesh>
  );
}

function LoadingFallback({ text }: { text: string }) {
  return (
    <Html center>
      <div className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 text-xs text-white/60">
        {text}
      </div>
    </Html>
  );
}

function ZoneLabel({ name, position, color, hovered }: { name: string; position: [number, number, number]; color: string; hovered: boolean }) {
  return (
    <Html center position={position} style={{ pointerEvents: 'none' }}>
      <div
        className="whitespace-nowrap flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-xl border border-white/10 shadow-[0_6px_20px_rgba(0,0,0,0.4)] text-[10px] font-medium text-white transition-[opacity,transform] duration-200 ease-out"
        style={{
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateY(-1.6rem) scale(1)' : 'translateY(-1rem) scale(0.85)',
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
        {name}
      </div>
    </Html>
  );
}

// Modalità debug (?calibrate=1): al posto della vecchia UI di piazzamento
// punti (obsoleta — non esistono più "siti" da calibrare, le zone sono mesh
// vere), mostra semplicemente il nome tecnico della mesh cliccata. Utile per
// individuare rapidamente a quale oggetto appartiene una zona da rivedere,
// senza dover rigenerare i render offline di identificazione.
function DebugPanel({ meshName }: { meshName: string | null }) {
  return (
    <div className="absolute top-3 left-3 right-3 rounded-2xl bg-black/85 backdrop-blur-xl border border-white/10 p-4 text-white">
      <p className="text-[10px] font-mono text-white/40 mb-1">Modalità debug — clicca una mesh</p>
      <p className="text-sm font-semibold">{meshName ?? '—'}</p>
    </div>
  );
}

function BodyScene({
  onSelectZone,
  hoveredSlug,
  setHoveredSlug,
  debugMode,
  onDebugMeshClick,
  xrayMode,
  zoneNames,
  boneNames,
}: {
  onSelectZone: (slug: string) => void;
  hoveredSlug: string | null;
  setHoveredSlug: (slug: string | null) => void;
  debugMode: boolean;
  onDebugMeshClick: (name: string) => void;
  xrayMode: boolean;
  zoneNames: Record<string, string>;
  boneNames: Record<string, string>;
}) {
  const { scene } = useGLTF('/models/body-v2/model.glb');
  const [transform, setTransform] = useState<{ scale: number; offset: THREE.Vector3 } | null>(null);
  const [meshByName, setMeshByName] = useState<Map<string, THREE.Mesh> | null>(null);
  const materialsRef = useRef<Map<string, THREE.MeshStandardMaterial> | null>(null);

  useEffect(() => {
    if (!scene) return;
    materialsRef.current = applyMaterials(scene);

    const byName = new Map<string, THREE.Mesh>();
    scene.traverse((obj) => {
      const m = obj as THREE.Mesh;
      if ((m as any).isMesh && m.name) byName.set(m.name, m);
    });
    setMeshByName(byName);

    const b = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    b.getSize(size);
    b.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = 2.4 / maxDim;
    setTransform({ scale, offset: center.clone().multiplyScalar(-scale) });
  }, [scene]);

  const zoneRegions = useMemo(() => {
    const regions: Record<string, THREE.BufferGeometry> = {};
    if (!meshByName) return regions;
    ZONE_ORDER.forEach((slug) => {
      const g = mergeNamedMeshes(meshByName, ZONE_OBJECT_MAP[slug]);
      if (g) regions[slug] = g;
    });
    return regions;
  }, [meshByName]);

  const zoneLabelPos = useMemo(() => {
    const pos: Record<string, [number, number, number]> = {};
    if (!meshByName) return pos;
    ZONE_ORDER.forEach((slug) => {
      const g = zoneRegions[slug];
      if (!g) return;
      g.computeBoundingBox();
      const c = new THREE.Vector3();
      g.boundingBox!.getCenter(c);
      pos[slug] = [c.x, c.y, c.z];
    });
    return pos;
  }, [meshByName, zoneRegions]);

  // Gruppi ossei cliccabili — attivi solo in modalità raggi-X (fuori da
  // quella modalità sono dentro il corpo, coperti dal muscolo opaco, quindi
  // non ha senso renderli interattivi). Ognuno è indipendente dalle 19 zone
  // muscolari: stesso identico meccanismo (mergeNamedMeshes + RegionHighlight
  // + click -> onSelectZone), ma con i propri slug "bone-*" — vedi nota sopra
  // BONE_GROUPS sul perché servono pagine nuove in Phygo, non quelle dei
  // muscoli. La forma visibile del vero e proprio osso (texture inclusa) è
  // già quella della mesh reale nella scena — qui serve solo l'overlay di
  // evidenziazione hover/click, esattamente come per le zone muscolari.
  const boneRegions = useMemo(() => {
    const regions: Record<string, THREE.BufferGeometry> = {};
    if (!meshByName) return regions;
    Object.keys(BONE_GROUPS).forEach((slug) => {
      const g = mergeNamedMeshes(meshByName, BONE_GROUPS[slug]);
      if (g) regions[slug] = g;
    });
    Object.keys(BONE_SPINE_BANDS).forEach((slug) => {
      const g = mergeBoneMeshes(meshByName, SPINE_BONE_NAMES, BONE_SPINE_BANDS[slug]);
      if (g) regions[slug] = g;
    });
    return regions;
  }, [meshByName]);

  const boneLabelPos = useMemo(() => {
    const pos: Record<string, [number, number, number]> = {};
    BONE_ORDER.forEach((slug) => {
      const g = boneRegions[slug];
      if (!g) return;
      g.computeBoundingBox();
      const c = new THREE.Vector3();
      g.boundingBox!.getCenter(c);
      pos[slug] = [c.x, c.y, c.z];
    });
    return pos;
  }, [boneRegions]);

  // Anima l'opacità dei materiali "muscolo" coinvolti nell'effetto raggi-X:
  // quando la modalità è attiva, TUTTI i materiali muscolo si fanno
  // trasparenti insieme (per rivelare le mesh ossee reali già presenti nella
  // scena, che a muscolo opaco restano semplicemente coperte/invisibili).
  // Fuori dalla modalità raggi-X il muscolo resta sempre opaco.
  useFrame(() => {
    const materials = materialsRef.current;
    if (!materials) return;
    XRAY_FADE_MATERIALS.forEach((matName) => {
      const mat = materials.get(matName);
      if (!mat) return;
      const target = xrayMode ? 0.12 : 1;
      mat.transparent = true;
      mat.opacity += (target - mat.opacity) * 0.12;
      mat.depthWrite = mat.opacity > 0.6;
    });
  });

  if (!transform) return null;

  return (
    <group scale={transform.scale} position={transform.offset}>
      <primitive
        object={scene}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (!debugMode) return;
          e.stopPropagation();
          const name = (e.object as THREE.Mesh)?.name || '(senza nome)';
          onDebugMeshClick(name);
        }}
      />

      {/* Zone muscolari: interattive SOLO fuori dai raggi-X. In raggi-X il
          click deve andare all'osso sotto, non al muscolo (che oltretutto è
          semi-trasparente) — vedi i gruppi ossei subito sotto. */}
      {!debugMode &&
        !xrayMode &&
        ZONE_ORDER.map((slug) => {
          const region = zoneRegions[slug];
          const hovered = hoveredSlug === slug;
          const color = '#32D6A0';
          const labelPos = zoneLabelPos[slug];
          if (!region || !labelPos) return null;

          return (
            <Fragment key={slug}>
              <RegionHighlight
                geometry={region}
                color={color}
                hovered={hovered}
                onHover={() => setHoveredSlug(slug)}
                onLeave={() => setHoveredSlug(null)}
                onClick={() => onSelectZone(slug)}
              />
              <ZoneLabel name={zoneNames[slug]} position={labelPos} color={color} hovered={hovered} />
            </Fragment>
          );
        })}

      {/* Gruppi ossei: interattivi SOLO durante i raggi-X (fuori da quella
          modalità sono coperti dal muscolo opaco, non ha senso hoverarli). La
          forma visibile dell'osso reale (texture inclusa) è già la mesh della
          scena, rivelata dalla trasparenza animata sopra — qui solo hover/click. */}
      {!debugMode &&
        xrayMode &&
        BONE_ORDER.map((slug) => {
          const region = boneRegions[slug];
          const hovered = hoveredSlug === slug;
          const color = '#bcd7ff';
          const labelPos = boneLabelPos[slug];
          if (!region || !labelPos) return null;

          return (
            <Fragment key={slug}>
              <RegionHighlight
                geometry={region}
                color={color}
                hovered={hovered}
                onHover={() => setHoveredSlug(slug)}
                onLeave={() => setHoveredSlug(null)}
                onClick={() => onSelectZone(slug)}
              />
              <ZoneLabel name={boneNames[slug]} position={labelPos} color={color} hovered={hovered} />
            </Fragment>
          );
        })}
    </group>
  );
}

useGLTF.preload('/models/body-v2/model.glb');

// Barra di ricerca zone — pensata soprattutto per le zone "piccole" (gomito,
// ginocchio, polso/mano, caviglia/piede) difficili da centrare col mouse
// sul modello 3D. Selezionare un risultato equivale a cliccare la zona sul
// modello (stessa onSelectZone); passarci sopra col mouse nella lista la
// evidenzia in anteprima sul modello riusando lo stato hover già esistente,
// senza bisogno di trovarla e centrarla manualmente.
function ZoneSearch({
  onSelectZone,
  setHoveredSlug,
  zoneNames,
  placeholder,
  noResultsText,
}: {
  onSelectZone: (slug: string) => void;
  setHoveredSlug: (slug: string | null) => void;
  zoneNames: Record<string, string>;
  placeholder: string;
  noResultsText: string;
}) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return ZONE_ORDER.filter((slug) => zoneMatchesQuery(slug, query));
  }, [query]);

  const showDropdown = focused && query.trim().length > 0;

  return (
    <div className="absolute top-3 left-3 z-10 w-[min(220px,45%)]">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          // piccolo ritardo per non chiudere il dropdown prima del click su un risultato
          setTimeout(() => setFocused(false), 120);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && results.length > 0) {
            onSelectZone(results[0]);
            setQuery('');
            setHoveredSlug(null);
            (e.target as HTMLInputElement).blur();
          }
          if (e.key === 'Escape') {
            setQuery('');
            setHoveredSlug(null);
            (e.target as HTMLInputElement).blur();
          }
        }}
        placeholder={placeholder}
        className="w-full px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 text-xs text-white placeholder:text-white/35 outline-none focus:border-white/25"
      />

      {showDropdown && (
        <div className="mt-1.5 rounded-2xl bg-black/85 backdrop-blur-xl border border-white/10 overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          {results.length === 0 ? (
            <p className="px-3 py-2 text-xs text-white/40">{noResultsText}</p>
          ) : (
            results.map((slug) => (
              <button
                key={slug}
                type="button"
                onMouseEnter={() => setHoveredSlug(slug)}
                onMouseLeave={() => setHoveredSlug(null)}
                onClick={() => {
                  onSelectZone(slug);
                  setQuery('');
                  setHoveredSlug(null);
                }}
                className="block w-full text-left px-3 py-1.5 text-xs text-white/90 hover:bg-white/10 transition-colors"
              >
                {zoneNames[slug]}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

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
      autoRotateSpeed={0.5}
      onStart={() => {
        if (resumeTimer.current) clearTimeout(resumeTimer.current);
        if (controlsRef.current) controlsRef.current.autoRotate = false;
      }}
      onEnd={scheduleResume}
    />
  );
}

export default function BodyMap3D({
  onSelectZone,
  calibrate = false,
}: {
  onSelectZone: (slug: string) => void;
  calibrate?: boolean;
}) {
  const ui = useUiStrings();
  const bm = ui.bodyMap;
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [debugMeshName, setDebugMeshName] = useState<string | null>(null);
  const [xrayMode, setXrayMode] = useState(false);

  return (
    <div className="relative w-full h-[560px] sm:h-[820px] rounded-[28px] border border-black/[0.06] dark:border-white/10 bg-[#08090b] overflow-hidden">
      <Canvas camera={{ position: [0, 0.3, 3.4], fov: 42 }} dpr={[1, 2]}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 4, 2]} intensity={1.3} color="#fff2e6" />
        <directionalLight position={[-3, -1, -3]} intensity={0.45} color="#ffffff" />
        <pointLight position={[0, 1.5, 3]} intensity={0.5} color="#ffffff" />
        <Suspense fallback={<LoadingFallback text={bm.loadingModel} />}>
          <BodyScene
            onSelectZone={onSelectZone}
            hoveredSlug={hoveredSlug}
            setHoveredSlug={setHoveredSlug}
            debugMode={calibrate}
            onDebugMeshClick={setDebugMeshName}
            xrayMode={xrayMode}
            zoneNames={bm.zoneNames}
            boneNames={bm.boneNames}
          />
        </Suspense>
        <AutoRotateControls />
      </Canvas>

      <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] text-white/40">
        {bm.dragRotateZoom}
      </p>

      {!calibrate && (
        <button
          type="button"
          onClick={() => setXrayMode((v) => !v)}
          aria-pressed={xrayMode}
          className={`absolute top-3 right-3 z-10 px-3 py-1.5 rounded-full backdrop-blur-xl border text-xs font-medium transition-colors ${
            xrayMode
              ? 'bg-[#bcd7ff] text-black border-[#bcd7ff]'
              : 'bg-black/60 text-white/80 border-white/10 hover:border-white/25'
          }`}
        >
          {bm.xrayLabel} {xrayMode ? 'ON' : 'OFF'}
        </button>
      )}

      {!calibrate && (
        <ZoneSearch
          onSelectZone={onSelectZone}
          setHoveredSlug={setHoveredSlug}
          zoneNames={bm.zoneNames}
          placeholder={bm.searchPlaceholder}
          noResultsText={bm.noZoneFound}
        />
      )}

      {/* Licenza TurboSquid Standard: uso commerciale/derivati inclusi, nessun
          obbligo di attribuzione — credito lasciato per trasparenza interna. */}
      <span className="absolute bottom-1 right-2 text-[9px] text-white/20">
        {bm.modelCreditPrefix} TurboSquid #1398841 (Standard License)
      </span>

      {calibrate && <DebugPanel meshName={debugMeshName} />}
    </div>
  );
}
