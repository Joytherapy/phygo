# DRAFT — Privacy notice, section "Professional verification" (`/privacy#professional-verification`)

**Status: unpublished draft. Do not copy it into `app/privacy/page.tsx` until:**
- every `{{PLACEHOLDER}}` in "Values to fill before publication" is replaced (decisions: `docs/release/DECISIONS.md`);
- the text has been reviewed by a qualified data-protection professional.

The verification form already links to `/privacy#professional-verification`. That anchor does not exist yet, on purpose: the evidence feature must not be released before this section is published.

## Verified facts (read-only checks, 13 Oct 2026)
How the facts were obtained:
- Vercel and Supabase settings: read through their APIs.
- Provider documentation: the official documentation search tools, plus web search.
- The container cannot open vercel.com or supabase.com directly, so the legal pages themselves (DPA, sub-processor lists) were **not read in full**. Every contract point below says what was and was not seen.

### Where the document goes
| # | Step | Where | What happens to the file | Evidence |
|---|---|---|---|---|
| 1 | Browser → `POST /api/profile/verification` | Vercel. The function runs in **`iad1`, Washington DC, USA** | **The file is processed:** read into memory, then size, extension and first bytes are checked. It is then uploaded to Supabase. It is not written to disk and not logged | Production deployment metadata: `regions: ["iad1"]`. No `regions` in `vercel.json` and no `preferredRegion` in the code, so this is Vercel's default |
| 1a | Middleware (`middleware.ts`) | Vercel | Runs on every request. It reads only cookies and headers, **not the file** | Code |
| 2 | Vercel → Supabase Storage | Bucket `verification-documents`, project region **`eu-central-1`, Frankfurt, Germany** | **Stored** | Supabase API (project region). Supabase docs: "Storage objects are hosted in that region" |
| 3 | User or administrator opens the document | `GET /api/profile/verification/document` (owner) and `GET /api/admin/verification/document` (signed-in administrator only; no token accepted) on Vercel `iad1` | **The file is read by the server** from Storage and streamed to the authorised person. No signed link or Storage address reaches the browser. Responses forbid caching (`private, no-store`) | Code and tests |
| 3a | The browser shows the document | In-page viewer | Kept **in memory only** and released when the viewer closes. Not stored in the browser cache | Code; browser check |
| 4 | Administrator console `GET /api/admin/verification` | Vercel, `iad1` | **Metadata only:** declared details, status, history. No path and no file | Code |
| 5 | Retention route (off) | Vercel, `iad1` | Deletes the file and lists its folder. **No file content** | Code |

**Not involved:** the document is never sent to OpenAI, to the video service or to e-mail. The code has no analytics or monitoring SDK.

### Caches, copies and logs
- **Supabase Smart CDN.** It is on, because the Supabase organisation is on the **Pro** plan and Supabase enables it automatically from Pro. Supabase's docs say responses are cached at the CDN edge, and that deleting the file invalidates all copies within about 60 seconds. Since this PR:
  - the browser never downloads from Storage;
  - the server reads each time with a new random `cacheNonce`, so an edge copy is never served again;
  - the edge copy itself cannot be prevented from the application. It is documented as residual.
- **Browser cache.** Document responses are `private, no-store`, and uploads are stored with `max-age=0` instead of Storage's default of one hour.
- **Next.js data cache.** It was empty after the whole test suite ran against the production build of the app with test settings. The document routes force `no-store`.
- **Application logs.** No paths, contents, tokens or signed links. There is a test for this.
- **Vercel log drains:** none configured (API).
- **Supabase logs.**
  - Storage and API logs record request paths. The object path contains the account id and the request id, not the content.
  - No signed links are created for these documents any more, so there is no link token to record. The server's reads carry only a random cache nonce.
- **Administrator access through a token.** It has been removed. Documents and the verification console accept only a signed-in administrator. `CRON_SECRET` opens only the cron routes and the two science batch routes the cron calls.

### Providers: what was verified and what was not
| | Supabase | Vercel |
|---|---|---|
| Plan | **Pro** (Supabase API) | **Hobby**. Established earlier in the project; the team API does not show the plan. Check in Settings → Billing |
| Region | `eu-central-1` (Frankfurt) for database, Auth and Storage (API + docs) | Functions in `iad1` (USA) (API). Static files are served from Vercel's global network |
| Copies outside the region | Possible, through the CDN (Cloudflare) cache, per Supabase's own documentation. Logs, backups and support access are part of the transfer analysis, per Supabase | Requests enter Vercel's network at a nearby point of presence and are forwarded to `iad1` |
| DPA | Exists (supabase.com/legal/dpa). **Not verified:** whether it is accepted or signed for this organisation (check Organization → Legal Documents), or which Supabase entity signs it | Exists (vercel.com/legal/dpa). The excerpt read says it applies to customers on **Enterprise and Pro** plans. **No evidence that it covers Hobby** |
| Plan terms | — | Vercel's docs: the Hobby plan is for **personal, non-commercial use** only. PHYGO has paid plans, so this must be resolved with Vercel |
| Sub-processors | A list is published. The June 2026 version names AWS and Cloudflare (hosting), among others. **Read only through search results:** review the live list | **Not obtained.** Review vercel.com/legal/sub-processors |
| Transfer mechanism | SCCs according to third-party summaries; **no primary text read**. **No evidence** of DPF certification | Vercel states it is certified under the EU-U.S. Data Privacy Framework (its own help article). **Not checked** on dataprivacyframework.gov. The DPA refers to SCCs |

## What the current privacy notice already says (app/privacy/page.tsx)
| Topic | Documented today | Enough for verification? |
|---|---|---|
| Controller | "For account and billing data, Phygo acts as data controller" (section 2) | **No.** The legal entity, address and contact details are not named |
| Contact | General contact address (section 15) | **To confirm** that it is monitored and is the channel for data-protection requests |
| Processors | Supabase ("database and authentication, EU region"), OpenAI, Vercel ("application hosting"), Resend (section 6), each "bound by a Data Processing Agreement" | **Partly.** Storage and the CDN are not mentioned. The functions' US region is not mentioned. The "bound by a DPA" statement is **not supported by evidence for Vercel on Hobby** |
| Transfers | Standard Contractual Clauses "where a sub-processor is outside the EEA" (section 7) | **Not supported yet** for Vercel (the processing happens in the USA) |
| Retention | Clinical data only (section 9) | **No.** Nothing on verification data |
| Rights and complaint | Listed in sections 12 and 15 | Yes, in general terms |
| Automated decisions | None for clinical data (section 13) | Verification is also decided by a person (fact, from the code) |

Found while checking, outside verification:
- Daily (video) is used in production but is **not** in the sub-processor list (section 6).
- The `iad1` region applies to **every** server function, so clinical data sent to the API (notes, AI requests) is also processed in the USA. The privacy notice does not say so today.

## Facts taken from the code (true today)
- **Data collected:**
  - legal first and last name;
  - country, territorial Order or register, and registration number;
  - one document (PDF, JPEG or PNG, up to 4 MB);
  - the declaration (text version, date and time);
  - the administrator's register check (result, time, who);
  - the decision (time, who, reason category, message to the user);
  - an optional internal note;
  - an hourly counter of submissions (abuse prevention).
- **Access:** the owner and authorised administrators open the document through the server, after a permission check. The browser receives the file itself (no link, no token), shows it from memory, and does not cache it. Nobody else can open it: no other user, no patient.
- **Who decides:**
  - a person decides;
  - there is no automatic query of the register and no automated decision;
  - approval needs the document and a recorded "match" with the register.
- **Already-verified accounts:**
  - they can send the document without interruption when name, number and Order are unchanged;
  - the 60-day deadline is **not active** (the backfill has not been run);
  - no data is deleted.
- **Retention:**
  - nothing automatic is active;
  - the periods (30 days, 12 months, 24 months) are **proposals not yet approved** and must not be published.

## Values to fill before publication
The texts below use these placeholders. Every value comes from the owner. The reasons for each recommendation are in `docs/release/DECISIONS.md`. **Do not publish while any placeholder remains.**

| Placeholder | What it is | Recommended value | Status |
|---|---|---|---|
| `{{CONTROLLER}}` | Legal name, address, VAT or company number of whoever runs PHYGO | — (owner's data) | **Needed** |
| `{{PRIVACY_CONTACT}}` | Address for data-protection requests | A dedicated, monitored mailbox (for example a privacy@ alias of the PHYGO domain) | **Needed** |
| `{{DPO_SENTENCE}}` | DPO details, or remove the sentence | Remove, unless a DPO has been appointed | To confirm |
| `{{ADMINS}}` | Who reviews documents | "the PHYGO owner, who is a physiotherapist" (one person today) | To confirm |
| `{{LEGAL_BASIS}}` | Legal basis | Contract, Art. 6(1)(b) GDPR, for checking eligibility; legitimate interest, Art. 6(1)(f), for keeping the decision record and preventing abuse | **Lawyer** |
| `{{FUNCTION_REGION}}` | Where the servers that receive the upload run | Frankfurt, Germany (after PR #16), otherwise Washington, USA | Owner (plan) |
| `{{TRANSFER_SAFEGUARDS}}` | Safeguards for Vercel, Supabase, Cloudflare | EU-U.S. Data Privacy Framework where the provider is certified, otherwise the Standard Contractual Clauses in the provider's DPA | **Lawyer**, after the DPAs are signed |
| `{{RETENTION_DOCUMENT}}` | Document file | 30 days after the decision | Owner |
| `{{RETENTION_NOTES}}` | Internal notes | 12 months | Owner |
| `{{RETENTION_HISTORY}}` | Earlier requests and their history | 24 months after the later decision | Owner |
| `{{TRANSITION_DAYS}}` | Deadline for accounts verified before documents | 60 days from the notice | Owner |

---

## Italiano

### Verifica professionale
**Perché la chiediamo.** Alcune funzioni di PHYGO sono riservate ai fisioterapisti di cui abbiamo verificato l'iscrizione all'albo:
- l'intelligenza artificiale applicata a informazioni cliniche reali;
- le videoconsulenze;
- la gestione di pazienti reali.

Usiamo i dati della verifica solo per questo scopo e per prevenire abusi. Non li usiamo per finalità commerciali o di profilazione.

**Titolare.** {{CONTROLLER}}. Contatto per la protezione dei dati: {{PRIVACY_CONTACT}}. {{DPO_SENTENCE}}

**Quali dati raccogliamo.**
- **Iscrizione:**
  - nome e cognome legali;
  - Paese, Ordine territoriale o registro;
  - numero di iscrizione.
- **Il documento** che prova l'iscrizione (PDF, JPEG o PNG, massimo 4 MB).
  - Non caricare documenti d'identità, dati di pazienti o informazioni non necessarie su altre persone.
  - Puoi oscurare ciò che non serve, purché nome e numero di iscrizione restino leggibili.
- **La dichiarazione** che hai accettato: versione del testo, data e ora.
- **L'esito della verifica:**
  - il risultato del controllo sull'albo ufficiale;
  - la decisione, con data e autore;
  - l'eventuale categoria del motivo;
  - il messaggio che ti inviamo;
  - eventuali note interne di chi verifica.
- **Un contatore** del numero di invii e di aperture del documento per ora, per prevenire abusi.

**Perché e su quale base.** Trattiamo questi dati per verificare che tu possa accedere alle funzioni riservate ai professionisti e per prevenire abusi. Base giuridica: {{LEGAL_BASIS}}. Fornire i dati non è obbligatorio: senza verifica continui a usare le funzioni non cliniche di PHYGO.

**Come verifichiamo l'iscrizione.**
- Una persona ({{ADMINS}}) confronta a mano tre elementi:
  - i dati che hai dichiarato;
  - il documento;
  - l'albo pubblico ufficiale (per l'Italia, l'Albo nazionale gestito dalla FNOFI).
- Registra se i dati corrispondono, non corrispondono o non sono presenti, poi decide.
- Non interroghiamo l'albo in modo automatico e non prendiamo decisioni automatizzate.
- Approviamo solo se il documento è presente e la corrispondenza con l'albo è stata registrata.

**Chi può vedere il documento.**
- **Tu**, dal tuo profilo.
- **Chi verifica per PHYGO** ({{ADMINS}}), solo dopo un controllo dei permessi.
- **Come viene mostrato:** il documento passa dal nostro server e viene mostrato nella pagina. Non riceviamo né consegniamo link pubblici, e il browser non lo conserva in cache.
- **Nessun altro:** gli altri utenti e i pazienti non lo vedono. Il documento non compare nelle cartelle cliniche, nei PDF clinici o nelle ricerche, e non viene inviato a servizi di intelligenza artificiale, al servizio video o via e-mail.

**Chi tratta i dati per nostro conto.**
- **Supabase:** database e archivio privato dei documenti, nella regione di Francoforte (Germania). I file letti dal nostro server passano dalla rete di distribuzione di Supabase (Cloudflare), che può conservarne copie temporanee non riutilizzabili. Una copia viene invalidata quando il file viene cancellato.
- **Vercel:** hosting dell'applicazione. Il documento caricato viene elaborato dai server dell'applicazione a {{FUNCTION_REGION}}.

Entrambi agiscono come responsabili del trattamento in base a un accordo sul trattamento dei dati. Supabase e Vercel sono società con sede negli Stati Uniti: per i trasferimenti di dati ci basiamo su {{TRANSFER_SAFEGUARDS}}.

**Quanto conserviamo i dati.**
- Il documento: {{RETENTION_DOCUMENT}}. Se lo sostituisci con un nuovo invio, viene cancellato subito.
- Le note interne: {{RETENTION_NOTES}}.
- Le richieste precedenti e il loro storico: {{RETENTION_HISTORY}}.
- La richiesta su cui si basa il tuo stato attuale: finché l'account esiste.
- Alla chiusura dell'account cancelliamo tutti questi dati, salvo obblighi di legge.

**Account verificati prima dell'introduzione del documento.** Ti chiederemo di inviare il documento entro {{TRANSITION_DAYS}}.
- Se nome, numero e Ordine restano invariati, lo stato «Verificato» non cambia durante il controllo.
- Alla scadenza senza un documento confermato, le funzioni che richiedono la verifica vengono sospese finché non lo confermiamo.
- Account e dati dei pazienti non vengono cancellati.

**I tuoi diritti.**
- Puoi chiedere:
  - l'accesso ai tuoi dati (incluse le note interne che ti riguardano);
  - la rettifica, inviando una nuova richiesta;
  - la cancellazione e la limitazione del trattamento;
  - l'opposizione al trattamento basato sul legittimo interesse;
  - la portabilità dei dati che ci hai fornito.

  Finché l'account resta attivo e riservato ai professionisti, la cancellazione dei dati di verifica comporta la sospensione delle funzioni che li richiedono.
- Scrivi a {{PRIVACY_CONTACT}}. Rispondiamo entro un mese, salvo proroghe previste dalla legge.
- Puoi presentare reclamo all'autorità di controllo del Paese in cui vivi, lavori o dove è avvenuta la presunta violazione. In Italia è il Garante per la protezione dei dati personali.

---

## English

### Professional verification
**Why we ask.** Some PHYGO features are reserved for physiotherapists whose registration we have verified:
- AI applied to real clinical information;
- video consultations;
- managing real patients.

We use verification data only for this purpose and to prevent abuse. We do not use it for marketing or profiling.

**Controller.** {{CONTROLLER}}. Data-protection contact: {{PRIVACY_CONTACT}}. {{DPO_SENTENCE}}

**What we collect.**
- **Registration:**
  - legal first and last name;
  - country, territorial Order or register;
  - registration number.
- **The document** proving the registration (PDF, JPEG or PNG, up to 4 MB).
  - Do not upload identity documents, patient data, or unnecessary information about other people.
  - You may cover what is not needed, as long as your name and registration number stay readable.
- **The declaration** you accepted: text version, date and time.
- **The outcome of the review:**
  - the result of the check on the official register;
  - the decision, with its date and author;
  - any reason category;
  - the message we send you;
  - any internal notes by the reviewer.
- **A counter** of submissions and document openings per hour, to prevent abuse.

**Why, and on what basis.** We process this data to check that you may use the features reserved for professionals, and to prevent abuse. Legal basis: {{LEGAL_BASIS}}. Providing the data is not mandatory: without verification you keep using PHYGO's non-clinical features.

**How we verify your registration.**
- A person ({{ADMINS}}) compares three things by hand:
  - what you declared;
  - the document;
  - the public official register (for Italy, the national register run by FNOFI).
- They record whether the details match, do not match, or are not found, and then decide.
- We do not query the register automatically and make no automated decisions.
- Approval requires the document and a recorded match with the register.

**Who can see the document.**
- **You**, from your profile.
- **The reviewer for PHYGO** ({{ADMINS}}), only after a permission check.
- **How it is shown:** the document goes through our server and is shown inside the page. No public link is created or handed out, and the browser does not cache it.
- **No one else:** other users and patients never see it. It never appears in patient records, clinical PDFs or search, and is never sent to AI services, the video service or by e-mail.

**Who processes the data on our behalf.**
- **Supabase:** database and private document storage, in the Frankfurt (Germany) region. Files read by our server pass through Supabase's content delivery network (Cloudflare), which may keep temporary copies that are not reused. A copy is invalidated when the file is deleted.
- **Vercel:** application hosting. The uploaded document is processed by our application servers in {{FUNCTION_REGION}}.

Both act as processors under a data processing agreement. Supabase and Vercel are companies based in the United States: for data transfers we rely on {{TRANSFER_SAFEGUARDS}}.

**How long we keep it.**
- The document: {{RETENTION_DOCUMENT}}. If you replace it with a new submission, it is deleted at once.
- Internal notes: {{RETENTION_NOTES}}.
- Earlier requests and their history: {{RETENTION_HISTORY}}.
- The request your current status is based on: while your account exists.
- When your account is closed, all of this is deleted, subject to legal obligations.

**Accounts verified before documents were required.** We will ask you to send the document within {{TRANSITION_DAYS}}.
- If your name, number and Order stay the same, your "Verified" status does not change while we check it.
- If the deadline passes without a confirmed document, features that need verification are suspended until we confirm it.
- Your account and patient data are not deleted.

**Your rights.**
- You may ask for:
  - access to your data (including internal notes about you);
  - rectification, by sending a new request;
  - erasure and restriction of processing;
  - objection to processing based on legitimate interest;
  - portability of the data you gave us.

  While your account is active and reserved for professionals, erasing your verification data suspends the features that require it.
- Write to {{PRIVACY_CONTACT}}. We reply within one month, unless the law allows an extension.
- You may complain to the supervisory authority where you live, work, or where the alleged infringement took place. In Italy this is the Garante per la protezione dei dati personali.

---

## Español

### Verificación profesional
**Por qué la pedimos.** Algunas funciones de PHYGO están reservadas a fisioterapeutas cuya colegiación hemos verificado:
- la inteligencia artificial aplicada a información clínica real;
- las videoconsultas;
- la gestión de pacientes reales.

Usamos los datos de la verificación solo con este fin y para prevenir abusos. No los usamos con fines comerciales ni de elaboración de perfiles.

**Responsable.** {{CONTROLLER}}. Contacto de protección de datos: {{PRIVACY_CONTACT}}. {{DPO_SENTENCE}}

**Qué datos recogemos.**
- **Colegiación:**
  - nombre y apellidos legales;
  - país, Colegio o registro;
  - número de colegiación.
- **El documento** que acredita la colegiación (PDF, JPEG o PNG, máximo 4 MB).
  - No subas documentos de identidad, datos de pacientes ni información innecesaria sobre otras personas.
  - Puedes ocultar lo que no sea necesario, siempre que el nombre y el número sigan siendo legibles.
- **La declaración** que aceptaste: versión del texto, fecha y hora.
- **El resultado de la revisión:**
  - el resultado de la comprobación en el registro oficial;
  - la decisión, con su fecha y autor;
  - la categoría del motivo, en su caso;
  - el mensaje que te enviamos;
  - las notas internas de quien verifica, si las hay.
- **Un contador** de envíos y aperturas del documento por hora, para prevenir abusos.

**Por qué y con qué base.** Tratamos estos datos para comprobar que puedes usar las funciones reservadas a profesionales y para prevenir abusos. Base jurídica: {{LEGAL_BASIS}}. Facilitar los datos no es obligatorio: sin verificación sigues usando las funciones no clínicas de PHYGO.

**Cómo verificamos la colegiación.**
- Una persona ({{ADMINS}}) compara a mano tres elementos:
  - lo que declaraste;
  - el documento;
  - el registro público oficial (para Italia, el registro nacional gestionado por la FNOFI).
- Registra si los datos coinciden, no coinciden o no figuran, y después decide.
- No consultamos el registro de forma automática ni tomamos decisiones automatizadas.
- Solo aprobamos si el documento está presente y se ha registrado la coincidencia con el registro.

**Quién puede ver el documento.**
- **Tú**, desde tu perfil.
- **Quien verifica para PHYGO** ({{ADMINS}}), solo tras un control de permisos.
- **Cómo se muestra:** el documento pasa por nuestro servidor y se muestra dentro de la página. No se crean ni se entregan enlaces públicos, y el navegador no lo guarda en caché.
- **Nadie más:** los demás usuarios y los pacientes no lo ven. No aparece en historias clínicas, PDF clínicos ni búsquedas, y nunca se envía a servicios de inteligencia artificial, al servicio de vídeo ni por correo electrónico.

**Quién trata los datos por nuestra cuenta.**
- **Supabase:** base de datos y almacenamiento privado de documentos, en la región de Fráncfort (Alemania). Los archivos que lee nuestro servidor pasan por la red de distribución de contenidos de Supabase (Cloudflare), que puede conservar copias temporales que no se reutilizan. Una copia se invalida cuando se elimina el archivo.
- **Vercel:** alojamiento de la aplicación. El documento subido lo procesan los servidores de la aplicación en {{FUNCTION_REGION}}.

Ambos actúan como encargados del tratamiento en virtud de un contrato de encargo. Supabase y Vercel son empresas con sede en Estados Unidos: para las transferencias de datos nos basamos en {{TRANSFER_SAFEGUARDS}}.

**Cuánto tiempo los conservamos.**
- El documento: {{RETENTION_DOCUMENT}}. Si lo sustituyes con un nuevo envío, se elimina de inmediato.
- Las notas internas: {{RETENTION_NOTES}}.
- Las solicitudes anteriores y su historial: {{RETENTION_HISTORY}}.
- La solicitud en la que se basa tu estado actual: mientras exista la cuenta.
- Al cerrar la cuenta, eliminamos todos estos datos, salvo obligaciones legales.

**Cuentas verificadas antes de que se exigiera el documento.** Te pediremos que envíes el documento en un plazo de {{TRANSITION_DAYS}}.
- Si nombre, número y Colegio no cambian, el estado «Verificado» se mantiene durante la comprobación.
- Si vence el plazo sin un documento confirmado, las funciones que requieren verificación se suspenden hasta que lo confirmemos.
- La cuenta y los datos de los pacientes no se eliminan.

**Tus derechos.**
- Puedes solicitar:
  - el acceso a tus datos (incluidas las notas internas sobre ti);
  - la rectificación, enviando una nueva solicitud;
  - la supresión y la limitación del tratamiento;
  - la oposición al tratamiento basado en el interés legítimo;
  - la portabilidad de los datos que nos facilitaste.

  Mientras la cuenta siga activa y reservada a profesionales, suprimir los datos de verificación suspende las funciones que los requieren.
- Escribe a {{PRIVACY_CONTACT}}. Respondemos en el plazo de un mes, salvo las prórrogas previstas por la ley.
- Puedes reclamar ante la autoridad de control del país donde vives, trabajas o donde se produjo la presunta infracción. En España es la Agencia Española de Protección de Datos; en Italia, el Garante per la protezione dei dati personali.

---

## Français

### Vérification professionnelle
**Pourquoi nous la demandons.** Certaines fonctions de PHYGO sont réservées aux kinésithérapeutes dont nous avons vérifié l'inscription :
- l'intelligence artificielle appliquée à des informations cliniques réelles ;
- les téléconsultations ;
- la gestion de patients réels.

Nous utilisons les données de vérification uniquement à cette fin et pour prévenir les abus. Nous ne les utilisons ni à des fins commerciales ni pour du profilage.

**Responsable.** {{CONTROLLER}}. Contact pour la protection des données : {{PRIVACY_CONTACT}}. {{DPO_SENTENCE}}

**Données collectées.**
- **Inscription :**
  - nom et prénom légaux ;
  - pays, Ordre ou registre ;
  - numéro d'inscription.
- **Le document** prouvant l'inscription (PDF, JPEG ou PNG, 4 Mo maximum).
  - Ne téléversez pas de pièce d'identité, de données de patients ni d'informations inutiles sur d'autres personnes.
  - Vous pouvez masquer ce qui n'est pas nécessaire, tant que le nom et le numéro restent lisibles.
- **La déclaration** que vous avez acceptée : version du texte, date et heure.
- **Le résultat de l'examen :**
  - le résultat du contrôle sur le registre officiel ;
  - la décision, avec sa date et son auteur ;
  - la catégorie du motif, le cas échéant ;
  - le message que nous vous adressons ;
  - les notes internes de la personne qui vérifie, le cas échéant.
- **Un compteur** d'envois et d'ouvertures du document par heure, pour prévenir les abus.

**Pourquoi et sur quelle base.** Nous traitons ces données pour vérifier que vous pouvez utiliser les fonctions réservées aux professionnels et pour prévenir les abus. Base juridique : {{LEGAL_BASIS}}. Fournir ces données n'est pas obligatoire : sans vérification, vous continuez à utiliser les fonctions non cliniques de PHYGO.

**Comment nous vérifions l'inscription.**
- Une personne ({{ADMINS}}) compare à la main trois éléments :
  - ce que vous avez déclaré ;
  - le document ;
  - le registre public officiel (pour l'Italie, le registre national tenu par la FNOFI).
- Elle enregistre si les données correspondent, ne correspondent pas ou sont introuvables, puis décide.
- Nous n'interrogeons pas le registre automatiquement et ne prenons aucune décision automatisée.
- Nous n'approuvons que si le document est présent et que la correspondance avec le registre a été enregistrée.

**Qui peut voir le document.**
- **Vous**, depuis votre profil.
- **La personne qui vérifie pour PHYGO** ({{ADMINS}}), uniquement après un contrôle des autorisations.
- **Comment il est affiché :** le document passe par notre serveur et s'affiche dans la page. Aucun lien public n'est créé ni transmis, et le navigateur ne le conserve pas en cache.
- **Personne d'autre :** les autres utilisateurs et les patients ne le voient pas. Il n'apparaît ni dans les dossiers patients, ni dans les PDF cliniques, ni dans les recherches, et n'est jamais envoyé à des services d'intelligence artificielle, au service vidéo ni par e-mail.

**Qui traite les données pour notre compte.**
- **Supabase :** base de données et stockage privé des documents, dans la région de Francfort (Allemagne). Les fichiers lus par notre serveur passent par le réseau de diffusion de contenu de Supabase (Cloudflare), qui peut en conserver des copies temporaires non réutilisées. Une copie est invalidée lorsque le fichier est supprimé.
- **Vercel :** hébergement de l'application. Le document téléversé est traité par les serveurs de l'application à {{FUNCTION_REGION}}.

Tous deux agissent en tant que sous-traitants, liés par un accord de traitement des données. Supabase et Vercel sont des sociétés établies aux États-Unis : pour les transferts de données, nous nous appuyons sur {{TRANSFER_SAFEGUARDS}}.

**Durée de conservation.**
- Le document : {{RETENTION_DOCUMENT}}. Si vous le remplacez par un nouvel envoi, il est supprimé immédiatement.
- Les notes internes : {{RETENTION_NOTES}}.
- Les demandes antérieures et leur historique : {{RETENTION_HISTORY}}.
- La demande sur laquelle repose votre statut actuel : tant que le compte existe.
- À la fermeture du compte, toutes ces données sont supprimées, sous réserve des obligations légales.

**Comptes vérifiés avant l'exigence du document.** Nous vous demanderons d'envoyer le document dans un délai de {{TRANSITION_DAYS}}.
- Si nom, numéro et Ordre restent identiques, le statut « Vérifié » ne change pas pendant le contrôle.
- Si l'échéance passe sans document confirmé, les fonctions qui exigent la vérification sont suspendues jusqu'à notre confirmation.
- Le compte et les données des patients ne sont pas supprimés.

**Vos droits.**
- Vous pouvez demander :
  - l'accès à vos données (y compris les notes internes vous concernant) ;
  - la rectification, en envoyant une nouvelle demande ;
  - l'effacement et la limitation du traitement ;
  - l'opposition au traitement fondé sur l'intérêt légitime ;
  - la portabilité des données que vous nous avez fournies.

  Tant que le compte est actif et réservé aux professionnels, l'effacement des données de vérification suspend les fonctions qui les exigent.
- Écrivez à {{PRIVACY_CONTACT}}. Nous répondons dans un délai d'un mois, sauf prolongation prévue par la loi.
- Vous pouvez introduire une réclamation auprès de l'autorité de contrôle du pays où vous résidez, travaillez ou où la violation présumée a eu lieu. En France, c'est la CNIL ; en Italie, le Garante per la protezione dei dati personali.
