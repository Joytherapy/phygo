require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const NERVES = [
  // ─── PLESSI ───
  {
    slug: 'brachial-plexus',
    name: 'Brachial Plexus',
    region: 'plexus',
    origin: 'Radici anteriori C5-T1',
    anatomy: 'Rete nervosa complessa organizzata in radici, tronchi, divisioni, fasci e branche terminali. Decorre dal collo, attraverso lo spazio interscalenico, sotto la clavicola, fino all\'ascella, dove origina i nervi principali dell\'arto superiore (mediano, ulnare, radiale, muscolocutaneo, ascellare).',
    motor_function: 'Innervazione motoria dell\'intero arto superiore, tramite i suoi rami terminali.',
    sensory_function: 'Innervazione sensitiva dell\'intero arto superiore, tramite i suoi rami terminali.',
    compression_site: 'Sindrome dello stretto toracico (spazio interscalenico o costoclavicolare); lesioni traumatiche da trazione (parto distocico, incidenti motociclistici con caduta sulla spalla).',
    clinical_sign: 'Paralisi di Erb-Duchenne (lesione alta, C5-C6, "waiter\'s tip") o paralisi di Klumpke (lesione bassa, C8-T1, mano ad artiglio) a seconda del livello coinvolto.',
  },
  {
    slug: 'lumbosacral-plexus',
    name: 'Lumbosacral Plexus',
    region: 'plexus',
    origin: 'Radici anteriori L1-S4',
    anatomy: 'Formato dal plesso lombare (L1-L4, davanti al muscolo psoas) e dal plesso sacrale (L4-S4, sulla parete posteriore della pelvi), origina i principali nervi dell\'arto inferiore (femorale, otturatorio, sciatico, gluteo superiore e inferiore).',
    motor_function: 'Innervazione motoria dell\'intero arto inferiore e del pavimento pelvico, tramite i suoi rami terminali.',
    sensory_function: 'Innervazione sensitiva dell\'intero arto inferiore e della regione perineale, tramite i suoi rami terminali.',
    compression_site: 'Ematoma retroperitoneale o del muscolo ileopsoas; masse pelviche; interventi chirurgici pelvici estesi.',
    clinical_sign: 'Deficit combinato di più territori nervosi dell\'arto inferiore, spesso associato a dolore lombare o pelvico irradiato.',
  },

  // ─── ARTO SUPERIORE ───
  {
    slug: 'median-nerve',
    name: 'Median Nerve',
    region: 'upper_limb',
    origin: 'Fasci laterale e mediale del plesso brachiale (C5-T1)',
    anatomy: 'Decorre lungo la faccia mediale del braccio, attraversa la fossa cubitale tra i due capi del muscolo pronatore rotondo, scende nell\'avambraccio tra i flessori superficiali e profondi delle dita, ed entra nella mano attraverso il tunnel carpale al polso.',
    motor_function: 'Innerva la maggior parte dei muscoli flessori dell\'avambraccio (eccetto flessore ulnare del carpo e metà ulnare del flessore profondo delle dita) e i muscoli tenar (opposizione e abduzione del pollice).',
    sensory_function: 'Sensibilità del palmo e delle prime tre dita e mezza (pollice, indice, medio, metà radiale dell\'anulare).',
    compression_site: 'Tunnel carpale al polso (sede di gran lunga più comune), pronatore rotondo al gomito.',
    clinical_sign: 'Sindrome del tunnel carpale: parestesie notturne a pollice-indice-medio, "mano benedicente" (hand of benediction) nel tentativo di chiudere il pugno se la lesione è alta, atrofia tenar nei casi avanzati.',
  },
  {
    slug: 'ulnar-nerve',
    name: 'Ulnar Nerve',
    region: 'upper_limb',
    origin: 'Fascio mediale del plesso brachiale (C8-T1)',
    anatomy: 'Decorre lungo la faccia mediale del braccio, passa posteriormente all\'epicondilo mediale dell\'omero (il "gomito del violinista"), scende nell\'avambraccio tra flessore ulnare del carpo e flessore profondo delle dita, ed entra nella mano attraverso il canale di Guyon al polso.',
    motor_function: 'Innerva la maggior parte dei muscoli intrinseci della mano (interossei, ipotenar, adduttore del pollice) e due muscoli dell\'avambraccio (flessore ulnare del carpo, metà ulnare del flessore profondo delle dita).',
    sensory_function: 'Sensibilità del mignolo e della metà ulnare dell\'anulare, sia sul palmo che sul dorso.',
    compression_site: 'Tunnel cubitale al gomito (sede più comune, "gomito del violinista"), canale di Guyon al polso.',
    clinical_sign: 'Mano ad artiglio (claw hand) per paralisi degli interossei, segno di Froment (compensazione con il flessore lungo del pollice durante la presa a pinza per debolezza dell\'adduttore del pollice).',
  },
  {
    slug: 'radial-nerve',
    name: 'Radial Nerve',
    region: 'upper_limb',
    origin: 'Fascio posteriore del plesso brachiale (C5-T1)',
    anatomy: 'Decorre posteriormente attorno all\'omero nel solco radiale (a stretto contatto con l\'osso), passa anteriormente al gomito tra brachiale e brachioradiale, e si divide in un ramo superficiale sensitivo e un ramo profondo (nervo interosseo posteriore) prevalentemente motorio.',
    motor_function: 'Innerva il tricipite brachiale e tutti i muscoli estensori di polso e dita (estensore radiale/ulnare del carpo, estensore delle dita, estensore lungo del pollice).',
    sensory_function: 'Sensibilità del dorso della mano, del primo spazio interdigitale e della faccia posteriore di braccio/avambraccio.',
    compression_site: 'Solco radiale dell\'omero (compressione da appoggio prolungato, es. dormire con il braccio sotto il partner — "paralisi del sabato sera"), frattura diafisaria dell\'omero.',
    clinical_sign: 'Mano cadente (wrist drop): incapacità di estendere polso e dita contro gravità, con sensibilità relativamente preservata rispetto al deficit motorio.',
  },
  {
    slug: 'musculocutaneous-nerve',
    name: 'Musculocutaneous Nerve',
    region: 'upper_limb',
    origin: 'Fascio laterale del plesso brachiale (C5-C7)',
    anatomy: 'Perfora il muscolo coracobrachiale, decorre tra bicipite brachiale e brachiale nel compartimento anteriore del braccio, e termina come nervo cutaneo laterale dell\'avambraccio.',
    motor_function: 'Innerva i tre muscoli del compartimento anteriore del braccio: coracobrachiale, bicipite brachiale, brachiale — principali flessori del gomito e supinatori dell\'avambraccio.',
    sensory_function: 'Sensibilità della faccia laterale dell\'avambraccio.',
    compression_site: 'Raro isolatamente; più spesso coinvolto in lesioni del fascio laterale del plesso brachiale o durante interventi di chirurgia della spalla.',
    clinical_sign: 'Marcata debolezza nella flessione del gomito, con relativo risparmio dell\'estensione del polso (a differenza di una lesione del nervo radiale).',
  },
  {
    slug: 'axillary-nerve',
    name: 'Axillary Nerve',
    region: 'upper_limb',
    origin: 'Fascio posteriore del plesso brachiale (C5-C6)',
    anatomy: 'Decorre posteriormente attraverso lo spazio quadrilatero (delimitato da piccolo rotondo, grande rotondo, capo lungo del tricipite e omero), avvolgendo il collo chirurgico dell\'omero.',
    motor_function: 'Innerva il muscolo deltoide (principale abduttore della spalla oltre i primi 15°) e il piccolo rotondo (extrarotazione della spalla).',
    sensory_function: 'Sensibilità della regione deltoidea laterale della spalla ("regalo del sergente", area del gallone militare).',
    compression_site: 'Frattura del collo chirurgico dell\'omero, lussazione anteriore di spalla, iniezioni intramuscolari mal posizionate nel deltoide.',
    clinical_sign: 'Incapacità di abdurre il braccio oltre i primi gradi, ipoestesia della spalla laterale, atrofia del deltoide nei casi cronici ("spalla squadrata").',
  },
  {
    slug: 'long-thoracic-nerve',
    name: 'Long Thoracic Nerve',
    region: 'upper_limb',
    origin: 'Radici C5-C7 (direttamente, prima della formazione dei tronchi del plesso)',
    anatomy: 'Decorre lungo la parete laterale del torace, sulla superficie del muscolo dentato anteriore, particolarmente superficiale e vulnerabile durante la dissezione ascellare.',
    motor_function: 'Innerva esclusivamente il muscolo dentato anteriore, responsabile della stabilizzazione della scapola contro la parete toracica durante l\'elevazione del braccio.',
    sensory_function: 'Nessuna componente sensitiva.',
    compression_site: 'Chirurgia della mammella con dissezione ascellare (es. mastectomia con linfoadenectomia), traumi da trazione (zaini pesanti, sport con movimenti ripetuti sopra la testa).',
    clinical_sign: 'Scapola alata (winged scapula): il margine mediale della scapola si solleva visibilmente dalla parete toracica, evidente spingendo contro un muro con le braccia tese.',
  },

  // ─── ARTO INFERIORE ───
  {
    slug: 'sciatic-nerve',
    name: 'Sciatic Nerve',
    region: 'lower_limb',
    origin: 'Plesso sacrale (L4-S3)',
    anatomy: 'Il nervo più grande e spesso del corpo umano. Esce dalla pelvi attraverso il grande forame ischiatico (sotto o attraverso il muscolo piriforme), decorre posteriormente alla coscia, e si divide tipicamente a livello del cavo popliteo nei nervi tibiale e peroneale comune.',
    motor_function: 'Innerva i muscoli posteriori della coscia (ischiocrurali: bicipite femorale, semitendinoso, semimembranoso), oltre a tutta la muscolatura di gamba e piede tramite le sue branche terminali.',
    sensory_function: 'Sensibilità della gamba e del piede (eccetto la faccia mediale, di pertinenza del nervo safeno, ramo del femorale).',
    compression_site: 'Compressione radicolare lombare (protrusione/ernia discale L4-S1, causa più comune di sciatalgia), sindrome del piriforme (compressione del nervo nel suo decorso attraverso o sotto il muscolo piriforme).',
    clinical_sign: 'Sciatalgia: dolore irradiato dal gluteo lungo la faccia posteriore della coscia fino al piede, spesso con Straight Leg Raise Test positivo.',
  },
  {
    slug: 'femoral-nerve',
    name: 'Femoral Nerve',
    region: 'lower_limb',
    origin: 'Plesso lombare (L2-L4)',
    anatomy: 'Decorre nel solco tra muscolo psoas e iliaco, passa sotto il legamento inguinale lateralmente ai vasi femorali, ed entra nella coscia dove si divide rapidamente in numerosi rami.',
    motor_function: 'Innerva il muscolo quadricipite femorale (principale estensore del ginocchio) e il muscolo ileopsoas (flessore dell\'anca, insieme all\'innervazione diretta da radici lombari).',
    sensory_function: 'Sensibilità della faccia anteriore della coscia e, tramite il nervo safeno (ramo terminale), della faccia mediale di gamba e piede.',
    compression_site: 'Ematoma del muscolo ileopsoas (es. in terapia anticoagulante), chirurgia pelvica/inguinale (es. bypass femoro-popliteo, isterectomia), neuropatia diabetica.',
    clinical_sign: 'Marcata debolezza nell\'estensione del ginocchio con cedimento dell\'arto durante il carico, riflesso rotuleo ridotto o assente.',
  },
  {
    slug: 'obturator-nerve',
    name: 'Obturator Nerve',
    region: 'lower_limb',
    origin: 'Plesso lombare (L2-L4)',
    anatomy: 'Decorre lungo la parete pelvica laterale ed esce dalla pelvi attraverso il forame otturatorio, entrando nel compartimento mediale della coscia.',
    motor_function: 'Innerva i muscoli adduttori della coscia (grande, lungo, breve adduttore, gracile, otturatore esterno).',
    sensory_function: 'Sensibilità di una piccola area sulla faccia mediale della coscia, sopra il ginocchio.',
    compression_site: 'Chirurgia pelvica (linfoadenectomia in chirurgia oncologica ginecologica/urologica), parto distocico prolungato, ernia otturatoria.',
    clinical_sign: 'Debolezza nell\'adduzione dell\'anca, andatura con circumduzione compensatoria dell\'arto colpito, occasionale dolore riferito al ginocchio mediale.',
  },
  {
    slug: 'tibial-nerve',
    name: 'Tibial Nerve',
    region: 'lower_limb',
    origin: 'Ramo terminale mediale del nervo sciatico',
    anatomy: 'Decorre attraverso il cavo popliteo, scende in profondità nel compartimento posteriore della gamba (sotto il muscolo soleo), e passa posteriormente al malleolo mediale attraverso il tunnel tarsale, dove si divide nei nervi plantari mediale e laterale.',
    motor_function: 'Innerva l\'intero compartimento posteriore della gamba (tricipite surale, flessori lunghi di alluce e dita — flessione plantare del piede) e la muscolatura intrinseca della pianta del piede.',
    sensory_function: 'Sensibilità della pianta del piede e della faccia posteriore della gamba.',
    compression_site: 'Tunnel tarsale al malleolo mediale (analogo del tunnel carpale per il piede), raramente compresso rispetto al peroneale per la sua posizione profonda e protetta.',
    clinical_sign: 'Incapacità di flettere plantarmente il piede o le dita ("non riesce ad alzarsi sulle punte"), parestesie plantari nella sindrome del tunnel tarsale.',
  },
  {
    slug: 'common-peroneal-nerve',
    name: 'Common Peroneal Nerve',
    region: 'lower_limb',
    origin: 'Ramo terminale laterale del nervo sciatico',
    anatomy: 'Decorre lateralmente nel cavo popliteo, avvolge superficialmente il collo del perone (dove è particolarmente vulnerabile a compressione, essendo qui palpabile sotto la cute), e si divide nei nervi peroneale superficiale e profondo.',
    motor_function: 'Tramite le sue branche, controlla la dorsiflessione del piede e l\'eversione/inversione — deficit combinato se leso prima della divisione.',
    sensory_function: 'Contribuisce, tramite le sue branche, alla sensibilità della faccia anterolaterale di gamba e dorso del piede.',
    compression_site: 'Collo del perone (sede più comune di lesione nervosa dell\'intero arto inferiore) — da accavallamento prolungato delle gambe, ingessature strette, posizione chirurgica prolungata, perdita di peso rapida.',
    clinical_sign: 'Piede cadente (foot drop) con andatura steppante compensatoria; è la neuropatia da compressione più frequente dell\'arto inferiore.',
  },
  {
    slug: 'superficial-peroneal-nerve',
    name: 'Superficial Peroneal Nerve',
    region: 'lower_limb',
    origin: 'Ramo terminale del nervo peroneale comune',
    anatomy: 'Decorre nel compartimento laterale della gamba, tra i muscoli peronei, per poi diventare superficiale e cutaneo nel terzo distale della gamba.',
    motor_function: 'Innerva i muscoli peronei lungo e breve (eversione del piede).',
    sensory_function: 'Sensibilità della faccia anterolaterale distale della gamba e della maggior parte del dorso del piede (eccetto il primo spazio interdigitale, di pertinenza del peroneale profondo).',
    compression_site: 'Uscita dalla fascia del compartimento laterale (circa 10-12 cm sopra il malleolo laterale), distorsioni ricorrenti di caviglia.',
    clinical_sign: 'Debolezza nell\'eversione del piede con relativo risparmio della dorsiflessione (a differenza di una lesione del peroneale comune completo), parestesie sul dorso del piede.',
  },
  {
    slug: 'deep-peroneal-nerve',
    name: 'Deep Peroneal Nerve',
    region: 'lower_limb',
    origin: 'Ramo terminale del nervo peroneale comune',
    anatomy: 'Decorre nel compartimento anteriore della gamba insieme all\'arteria tibiale anteriore, passa sotto il retinacolo estensore alla caviglia.',
    motor_function: 'Innerva i muscoli del compartimento anteriore della gamba (tibiale anteriore, estensore lungo dell\'alluce, estensore lungo delle dita — dorsiflessione del piede e delle dita).',
    sensory_function: 'Piccola area sensitiva limitata al primo spazio interdigitale (tra alluce e secondo dito).',
    compression_site: 'Sindrome del tunnel tarsale anteriore al retinacolo estensore, sindrome compartimentale anteriore acuta (emergenza chirurgica).',
    clinical_sign: 'Piede cadente per paralisi selettiva della dorsiflessione, con eversione preservata (a differenza della lesione del peroneale comune) — utile per distinguere il livello della lesione.',
  },
  {
    slug: 'lateral-femoral-cutaneous-nerve',
    name: 'Lateral Femoral Cutaneous Nerve',
    region: 'lower_limb',
    origin: 'Plesso lombare (L2-L3)',
    anatomy: 'Nervo puramente sensitivo. Decorre lungo la parete pelvica ed esce sotto o attraverso il legamento inguinale, vicino alla spina iliaca anterosuperiore, per poi diventare sottocutaneo sulla faccia laterale della coscia.',
    motor_function: 'Nessuna componente motoria.',
    sensory_function: 'Sensibilità della faccia laterale della coscia, dalla regione inguinale fino al ginocchio.',
    compression_site: 'Passaggio sotto il legamento inguinale — favorito da obesità, gravidanza, indumenti stretti in vita, cinture per attrezzi pesanti; nervo alla base della meralgia parestesica.',
    clinical_sign: 'Bruciore, formicolio e ipoestesia sulla faccia laterale della coscia, tipicamente senza deficit motorio associato (essendo un nervo puramente sensitivo).',
  },

  // ─── NERVI CRANICI CON DECORSO PERIFERICO RILEVANTE ───
  {
    slug: 'spinal-accessory-nerve',
    name: 'Spinal Accessory Nerve (CN XI)',
    region: 'plexus',
    origin: 'Radici del midollo cervicale superiore (C1-C5), con contributo variabile dal nucleo ambiguo bulbare',
    anatomy: 'Emerge dal forame giugulare insieme ai nervi cranici IX e X, decorre attraverso il triangolo posteriore del collo, dove è particolarmente superficiale e vulnerabile durante la dissezione linfonodale chirurgica.',
    motor_function: 'Innerva i muscoli sternocleidomastoideo (rotazione e flessione laterale del capo) e trapezio (elevazione, retrazione e rotazione della scapola).',
    sensory_function: 'Nessuna componente sensitiva.',
    compression_site: 'Non è propriamente compressivo — la lesione è quasi sempre iatrogena, da dissezione linfonodale del collo (es. chirurgia oncologica per tumori testa-collo).',
    clinical_sign: 'Scapola alata con spalla abbassata e ruotata (diversa da quella del dentato anteriore), difficoltà nell\'elevare il braccio sopra la testa, dolore cronico alla spalla da instabilità scapolare.',
  },
];

async function main() {
  console.log(`Inserisco ${NERVES.length} nervi periferici...`);

  const { data: existing } = await supabase
    .from('peripheral_nerves')
    .select('slug');

  const existingSlugs = new Set((existing || []).map((n) => n.slug));
  const toInsert = NERVES.filter((n) => !existingSlugs.has(n.slug));

  if (toInsert.length === 0) {
    console.log('Tutti già presenti, nessun inserimento necessario.');
    return;
  }

  const { data, error } = await supabase
    .from('peripheral_nerves')
    .insert(toInsert)
    .select('id, slug, name');

  if (error) throw error;

  console.log(`Inseriti ${data.length}:`);
  data.forEach((d) => console.log(`  - ${d.name} (${d.slug})`));
}

main().catch((err) => {
  console.error('Errore:', err);
  process.exit(1);
});
