# DRAFT — Privacy notice, section "Professional verification" (`/privacy#professional-verification`)

**Status: unpublished draft. Do not copy it into `app/privacy/page.tsx` until:**
- every item marked `[TO CONFIRM]` or `[OWNER DECISION]` is resolved;
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
- **Access:** the owner and authorised administrators get a temporary link, after a server-side permission check. Nobody else does: no other user, no patient.
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

## Items to resolve
`[OWNER DECISION]`
1. **Function region:** keep `iad1` or move to an EU region (`fra1` Frankfurt or `cdg1` Paris). See the analysis in the PR.
2. **Vercel plan:** Hobby (non-commercial, no evidence of DPA coverage) or Pro.
3. **Who the authorised administrators are:** their role and how many.
4. **Retention periods:** approve or change the proposal.
5. **The 60-day transition:** when, and how it is communicated (in-app only, or also by e-mail).
6. **Data export:** whether users can export their data, and how.

`[TO CONFIRM]` (facts the owner must provide or check)
1. The controller's identity: legal name, address, VAT or company number. Whether a DPO has been appointed.
2. The contact channel for data-protection requests.
3. **Supabase:**
   - whether the DPA is accepted or signed for this organisation, and by which entity;
   - the current sub-processor list;
   - the transfer mechanism (SCCs or other).
4. **Vercel:**
   - whether the account has an applicable DPA (today the evidence says Pro or Enterprise only);
   - the current sub-processor list;
   - the DPF listing on dataprivacyframework.gov.
5. Whether Supabase logs record the server's read requests (they contain the object path, which includes the account id; no content).

`[LEGAL REVIEW]`
1. **Legal basis.** Not decided here. The options for the lawyer are:
   - contract, Art. 6(1)(b);
   - legitimate interest, Art. 6(1)(f), with a balancing test;
   - both.
2. **Transfers:**
   - to the USA (Vercel functions);
   - through the global CDN (Cloudflare) cache;
   - whether processing by a US company counts as a transfer even with an EU region.
3. The rights paragraph, including the limits on erasure while the account is active.
4. Section 6 of the current notice ("each bound by a Data Processing Agreement"): it must be true before it is published.

---

## Italiano

### Verifica professionale
**Perché la chiediamo.** Alcune funzioni di PHYGO sono riservate ai fisioterapisti di cui abbiamo verificato l'iscrizione all'albo:
- l'intelligenza artificiale applicata a informazioni cliniche reali;
- le videoconsulenze;
- la gestione di pazienti reali.

Usiamo i dati della verifica solo per questo scopo e per prevenire abusi. Non li usiamo per finalità commerciali o di profilazione.

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
  - eventuali note interne dell'amministratore.
- **Un contatore** del numero di invii per ora, per prevenire abusi.

**Come verifichiamo l'iscrizione.**
- Un amministratore di PHYGO confronta a mano tre elementi:
  - i dati che hai dichiarato;
  - il documento;
  - l'albo pubblico ufficiale (per l'Italia, l'Albo nazionale gestito dalla FNOFI).
- Registra se i dati corrispondono, non corrispondono o non sono presenti, poi decide.
- Non interroghiamo l'albo in modo automatico e non prendiamo decisioni automatizzate.
- Approviamo solo se il documento è presente e la corrispondenza con l'albo è stata registrata.

**Chi può vedere i dati.**
- **Tu:** lo stato, il messaggio che ti inviamo e il tuo documento, tramite un link temporaneo.
- **Gli amministratori autorizzati da PHYGO** `[TO CONFIRM: ruolo e numero]`: accedono al documento solo dopo un controllo dei permessi, con un link temporaneo.
- **Nessun altro:** gli altri utenti e i pazienti non vedono il documento. Il documento non compare nelle cartelle cliniche, nei PDF clinici o nelle ricerche, e non viene inviato a servizi di intelligenza artificiale.

**Chi tratta i dati per nostro conto.**
- **Supabase:** database e archivio dei documenti, ospitati nella regione di Francoforte (Germania). I file vengono consegnati attraverso la rete di distribuzione dei contenuti di Supabase (Cloudflare), che può conservarne copie temporanee nei propri nodi. `[TO CONFIRM: accordo sul trattamento dei dati, sub-responsabili, garanzie per i trasferimenti]`
- **Vercel:** hosting dell'applicazione. Il documento caricato viene elaborato dai server dell'applicazione, che oggi si trovano negli Stati Uniti (Washington). `[OWNER DECISION: mantenere questa regione o spostare l'elaborazione in una regione dell'Unione europea]` `[TO CONFIRM: accordo sul trattamento dei dati e garanzie per il trasferimento]`
- **Nessun altro:** il documento non viene inviato a servizi di intelligenza artificiale, al servizio video o via e-mail.

**Titolare e base giuridica.**
- Titolare del trattamento: `[TO CONFIRM: denominazione, sede, contatti]`.
- Base giuridica: `[TO CONFIRM con il legale: esecuzione del contratto, legittimo interesse alla sicurezza dei pazienti e alla prevenzione degli abusi, o entrambi]`.

**Quanto conserviamo i dati.** `[TO CONFIRM: inserire i periodi solo dopo l'approvazione]`
- Il documento: fino a `[periodo]` dopo la decisione. Se lo sostituisci con un nuovo invio, viene cancellato subito.
- Le note interne: `[periodo]`.
- Le richieste precedenti e il loro storico: `[periodo]`.
- La richiesta su cui si basa lo stato attuale: finché l'account esiste.
- Alla chiusura dell'account, cancelliamo tutti questi dati, salvo obblighi di legge.

**Account verificati prima dell'introduzione del documento.** Questi account ricevono una richiesta di invio del documento, con una scadenza (`[TO CONFIRM: 60 giorni dalla comunicazione]`).
- Se nome, numero e Ordine restano invariati, lo stato «Verificato» non cambia durante il controllo.
- Alla scadenza senza un documento confermato, le funzioni che richiedono la verifica vengono sospese finché non lo confermiamo.
- Account e dati dei pazienti non vengono cancellati.

**È obbligatorio?** No. Senza verifica continui a usare le funzioni non cliniche di PHYGO.

**I tuoi diritti.**
- Puoi chiedere:
  - l'accesso ai tuoi dati (incluse le note interne che ti riguardano);
  - la rettifica, inviando una nuova richiesta;
  - la cancellazione e la limitazione del trattamento;
  - la portabilità e l'opposizione, nei casi previsti dalla legge.

  `[TO CONFIRM con il legale: limiti alla cancellazione mentre l'account è attivo]`
- Scrivi a `[TO CONFIRM: contatto]`. Rispondiamo entro i termini di legge.
- Puoi presentare reclamo all'autorità di controllo del Paese in cui vivi, lavori o dove è avvenuta la presunta violazione. In Italia è il Garante per la protezione dei dati personali.

---

## English

### Professional verification
**Why we ask.** Some PHYGO features are reserved for physiotherapists whose registration we have verified:
- AI applied to real clinical information;
- video consultations;
- managing real patients.

We use verification data only for this purpose and to prevent abuse. We do not use it for marketing or profiling.

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
  - any internal notes by the administrator.
- **A counter** of submissions per hour, to prevent abuse.

**How we verify your registration.**
- A PHYGO administrator compares three things by hand:
  - what you declared;
  - the document;
  - the public official register (for Italy, the national register run by FNOFI).
- They record whether the details match, do not match, or are not found, and then decide.
- We do not query the register automatically and make no automated decisions.
- Approval requires the document and a recorded match with the register.

**Who can see the data.**
- **You:** your status, the message we send you, and your document, through a temporary link.
- **Administrators authorised by PHYGO** `[TO CONFIRM: role and number]`: they open the document only after a permission check, through a temporary link.
- **No one else:** other users and patients never see the document. It never appears in patient records, clinical PDFs or search, and is never sent to AI services.

**Who processes the data on our behalf.**
- **Supabase:** database and document storage, hosted in the Frankfurt (Germany) region. Files are delivered through Supabase's content delivery network (Cloudflare), which may keep temporary copies at its nodes. `[TO CONFIRM: data processing agreement, sub-processors, transfer safeguards]`
- **Vercel:** application hosting. The uploaded document is processed by our application servers, which are currently located in the United States (Washington). `[OWNER DECISION: keep this region or move processing to a European Union region]` `[TO CONFIRM: data processing agreement and transfer safeguards]`
- **No one else:** the document is never sent to AI services, to the video service or by e-mail.

**Controller and legal basis.**
- Controller: `[TO CONFIRM: legal name, address, contact]`.
- Legal basis: `[TO CONFIRM with counsel: performance of the contract, legitimate interest in patient safety and abuse prevention, or both]`.

**How long we keep it.** `[TO CONFIRM: insert periods only after approval]`
- The document: until `[period]` after the decision. If you replace it with a new submission, it is deleted at once.
- Internal notes: `[period]`.
- Earlier requests and their history: `[period]`.
- The request your current status is based on: while your account exists.
- When your account is closed, all of this is deleted, subject to legal obligations.

**Accounts verified before documents were required.** These accounts are asked to send the document by a deadline (`[TO CONFIRM: 60 days from notice]`).
- If your name, number and Order stay the same, your "Verified" status does not change while we check it.
- If the deadline passes without a confirmed document, features that need verification are suspended until we confirm it.
- Your account and patient data are not deleted.

**Is it mandatory?** No. Without verification you keep using PHYGO's non-clinical features.

**Your rights.**
- You may ask for:
  - access to your data (including internal notes about you);
  - rectification, by sending a new request;
  - erasure and restriction of processing;
  - portability and objection, where the law provides for them.

  `[TO CONFIRM with counsel: limits on erasure while the account is active]`
- Write to `[TO CONFIRM: contact]`. We reply within the legal time limits.
- You may complain to the supervisory authority where you live, work, or where the alleged infringement took place. In Italy this is the Garante per la protezione dei dati personali.

---

## Español

### Verificación profesional
**Por qué la pedimos.** Algunas funciones de PHYGO están reservadas a fisioterapeutas cuya colegiación hemos verificado:
- la inteligencia artificial aplicada a información clínica real;
- las videoconsultas;
- la gestión de pacientes reales.

Usamos los datos de la verificación solo con este fin y para prevenir abusos. No los usamos con fines comerciales ni de elaboración de perfiles.

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
  - las notas internas del administrador, si las hay.
- **Un contador** de envíos por hora, para prevenir abusos.

**Cómo verificamos la colegiación.**
- Un administrador de PHYGO compara a mano tres elementos:
  - lo que declaraste;
  - el documento;
  - el registro público oficial (para Italia, el registro nacional gestionado por la FNOFI).
- Registra si los datos coinciden, no coinciden o no figuran, y después decide.
- No consultamos el registro de forma automática ni tomamos decisiones automatizadas.
- Solo aprobamos si el documento está presente y se ha registrado la coincidencia con el registro.

**Quién puede ver los datos.**
- **Tú:** tu estado, el mensaje que te enviamos y tu documento, mediante un enlace temporal.
- **Los administradores autorizados por PHYGO** `[TO CONFIRM: función y número]`: abren el documento solo tras un control de permisos, con un enlace temporal.
- **Nadie más:** los demás usuarios y los pacientes no ven el documento. No aparece en historias clínicas, PDF clínicos ni búsquedas, y nunca se envía a servicios de inteligencia artificial.

**Quién trata los datos por nuestra cuenta.**
- **Supabase:** base de datos y almacenamiento de documentos, alojados en la región de Fráncfort (Alemania). Los archivos se entregan a través de la red de distribución de contenidos de Supabase (Cloudflare), que puede conservar copias temporales en sus nodos. `[TO CONFIRM: contrato de encargo, subencargados, garantías para las transferencias]`
- **Vercel:** alojamiento de la aplicación. El documento subido lo procesan los servidores de la aplicación, que hoy se encuentran en Estados Unidos (Washington). `[OWNER DECISION: mantener esta región o trasladar el procesamiento a una región de la Unión Europea]` `[TO CONFIRM: contrato de encargo y garantías para la transferencia]`
- **Nadie más:** el documento nunca se envía a servicios de inteligencia artificial, al servicio de vídeo ni por correo electrónico.

**Responsable y base jurídica.**
- Responsable del tratamiento: `[TO CONFIRM: denominación, domicilio, contacto]`.
- Base jurídica: `[TO CONFIRM con el asesor: ejecución del contrato, interés legítimo en la seguridad de los pacientes y la prevención de abusos, o ambos]`.

**Cuánto tiempo los conservamos.** `[TO CONFIRM: incluir los plazos solo tras su aprobación]`
- El documento: hasta `[plazo]` después de la decisión. Si lo sustituyes con un nuevo envío, se elimina de inmediato.
- Las notas internas: `[plazo]`.
- Las solicitudes anteriores y su historial: `[plazo]`.
- La solicitud en la que se basa tu estado actual: mientras exista la cuenta.
- Al cerrar la cuenta, eliminamos todos estos datos, salvo obligaciones legales.

**Cuentas verificadas antes de que se exigiera el documento.** A estas cuentas se les pide enviar el documento antes de una fecha (`[TO CONFIRM: 60 días desde la comunicación]`).
- Si nombre, número y Colegio no cambian, el estado «Verificado» se mantiene durante la comprobación.
- Si vence el plazo sin un documento confirmado, las funciones que requieren verificación se suspenden hasta que lo confirmemos.
- La cuenta y los datos de los pacientes no se eliminan.

**¿Es obligatorio?** No. Sin verificación sigues usando las funciones no clínicas de PHYGO.

**Tus derechos.**
- Puedes solicitar:
  - el acceso a tus datos (incluidas las notas internas sobre ti);
  - la rectificación, enviando una nueva solicitud;
  - la supresión y la limitación del tratamiento;
  - la portabilidad y la oposición, cuando la ley lo prevea.

  `[TO CONFIRM con el asesor: límites a la supresión mientras la cuenta esté activa]`
- Escribe a `[TO CONFIRM: contacto]`. Respondemos en los plazos legales.
- Puedes reclamar ante la autoridad de control del país donde vives, trabajas o donde se produjo la presunta infracción. En España es la Agencia Española de Protección de Datos; en Italia, el Garante per la protezione dei dati personali.

---

## Français

### Vérification professionnelle
**Pourquoi nous la demandons.** Certaines fonctions de PHYGO sont réservées aux kinésithérapeutes dont nous avons vérifié l'inscription :
- l'intelligence artificielle appliquée à des informations cliniques réelles ;
- les téléconsultations ;
- la gestion de patients réels.

Nous utilisons les données de vérification uniquement à cette fin et pour prévenir les abus. Nous ne les utilisons ni à des fins commerciales ni pour du profilage.

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
  - les notes internes de l'administrateur, le cas échéant.
- **Un compteur** d'envois par heure, pour prévenir les abus.

**Comment nous vérifions l'inscription.**
- Un administrateur de PHYGO compare à la main trois éléments :
  - ce que vous avez déclaré ;
  - le document ;
  - le registre public officiel (pour l'Italie, le registre national tenu par la FNOFI).
- Il enregistre si les données correspondent, ne correspondent pas ou sont introuvables, puis décide.
- Nous n'interrogeons pas le registre automatiquement et ne prenons aucune décision automatisée.
- Nous n'approuvons que si le document est présent et que la correspondance avec le registre a été enregistrée.

**Qui peut voir les données.**
- **Vous :** votre statut, le message que nous vous adressons et votre document, par un lien temporaire.
- **Les administrateurs autorisés par PHYGO** `[TO CONFIRM : fonction et nombre]` : ils n'ouvrent le document qu'après un contrôle des autorisations, par un lien temporaire.
- **Personne d'autre :** les autres utilisateurs et les patients ne voient pas le document. Il n'apparaît ni dans les dossiers patients, ni dans les PDF cliniques, ni dans les recherches, et n'est jamais envoyé à des services d'intelligence artificielle.

**Qui traite les données pour notre compte.**
- **Supabase :** base de données et stockage des documents, hébergés dans la région de Francfort (Allemagne). Les fichiers sont distribués par le réseau de diffusion de contenu de Supabase (Cloudflare), qui peut en conserver des copies temporaires sur ses nœuds. `[TO CONFIRM : accord de traitement des données, sous-traitants ultérieurs, garanties pour les transferts]`
- **Vercel :** hébergement de l'application. Le document téléversé est traité par les serveurs de l'application, situés aujourd'hui aux États-Unis (Washington). `[OWNER DECISION : conserver cette région ou déplacer le traitement dans une région de l'Union européenne]` `[TO CONFIRM : accord de traitement des données et garanties pour le transfert]`
- **Personne d'autre :** le document n'est jamais envoyé à des services d'intelligence artificielle, au service vidéo ni par e-mail.

**Responsable et base juridique.**
- Responsable du traitement : `[TO CONFIRM : dénomination, siège, contact]`.
- Base juridique : `[TO CONFIRM avec le conseil : exécution du contrat, intérêt légitime à la sécurité des patients et à la prévention des abus, ou les deux]`.

**Durée de conservation.** `[TO CONFIRM : indiquer les durées seulement après approbation]`
- Le document : jusqu'à `[durée]` après la décision. Si vous le remplacez par un nouvel envoi, il est supprimé immédiatement.
- Les notes internes : `[durée]`.
- Les demandes antérieures et leur historique : `[durée]`.
- La demande sur laquelle repose votre statut actuel : tant que le compte existe.
- À la fermeture du compte, toutes ces données sont supprimées, sous réserve des obligations légales.

**Comptes vérifiés avant l'exigence du document.** Il est demandé à ces comptes d'envoyer le document avant une échéance (`[TO CONFIRM : 60 jours à compter de la notification]`).
- Si nom, numéro et Ordre restent identiques, le statut « Vérifié » ne change pas pendant le contrôle.
- Si l'échéance passe sans document confirmé, les fonctions qui exigent la vérification sont suspendues jusqu'à notre confirmation.
- Le compte et les données des patients ne sont pas supprimés.

**Est-ce obligatoire ?** Non. Sans vérification, vous continuez à utiliser les fonctions non cliniques de PHYGO.

**Vos droits.**
- Vous pouvez demander :
  - l'accès à vos données (y compris les notes internes vous concernant) ;
  - la rectification, en envoyant une nouvelle demande ;
  - l'effacement et la limitation du traitement ;
  - la portabilité et l'opposition, dans les cas prévus par la loi.

  `[TO CONFIRM avec le conseil : limites de l'effacement tant que le compte est actif]`
- Écrivez à `[TO CONFIRM : contact]`. Nous répondons dans les délais légaux.
- Vous pouvez introduire une réclamation auprès de l'autorité de contrôle du pays où vous résidez, travaillez ou où la violation présumée a eu lieu. En France, c'est la CNIL ; en Italie, le Garante per la protezione dei dati personali.
