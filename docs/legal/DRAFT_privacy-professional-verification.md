# DRAFT — Privacy notice, section "Professional verification" (`/privacy#professional-verification`)

**Status: unpublished draft. Do not copy into `app/privacy/page.tsx` until every item marked `[TO CONFIRM]` is filled in by the owner and the text has been reviewed by a qualified data-protection professional.**

The verification form already links to `/privacy#professional-verification`. That anchor does not exist yet, on purpose: the evidence feature must not be released before this section is published.

## What the current privacy notice already says (app/privacy/page.tsx)
| Topic | Documented today | Enough for verification? |
|---|---|---|
| Controller | "For account and billing data, Phygo acts as data controller" (section 2) | **No.** The legal entity, address and contact details are not named |
| Contact | General contact address (section 15) | **To confirm** that it is monitored and is the channel for data-protection requests |
| Processors | Supabase (database and authentication, EU region), OpenAI, Vercel (hosting), Resend (e-mail) (section 6) | **Partly.** Supabase Storage (documents) is not named, and nor is the region where Vercel processes the upload |
| Transfers | Standard Contractual Clauses "where a sub-processor is outside the EEA" (section 7) | **To confirm** for Vercel and Supabase Storage |
| Retention | Clinical data only (section 9) | **No.** Nothing on verification data |
| Rights and complaint | Listed in sections 12 and 15 | Yes, in general terms |
| Automated decisions | None for clinical data (section 13) | Verification is also decided by a person (fact, from the code) |

Found while checking, outside verification: the video service (Daily) is used in production but is **not** in the sub-processor list (section 6). To be added (owner and legal).

## Facts taken from the code (true today, no confirmation needed)
- **Data collected:**
  - legal first and last name;
  - country, territorial Order or register, and registration number;
  - one document (PDF, JPEG or PNG, up to 4 MB);
  - the declaration (text version, date and time);
  - the administrator's register check (result, time, who);
  - the decision (time, who, reason category, message to the user);
  - an optional internal note;
  - an hourly counter of submissions (abuse prevention).
- **Storage:**
  - the document is kept in a private storage area;
  - users read only their own document, through a link valid for 60 seconds;
  - administrators reach documents only after a server-side permission check, also through a 60-second link.
- **Who decides:**
  - the check is made by a person, against the public official register;
  - there is no automatic query of the register and no automated decision.
- **Approval requirements:**
  - the document must be on file;
  - a "match" with the register must be recorded.
- **What is never done with the document:** it is never sent to AI services (OpenAI) or to the video service. It never appears in patient records, in clinical PDFs, or to other users or patients.
- **Already-verified accounts:**
  - they can send the document without interruption, as long as name, number and Order stay the same;
  - after the deadline without a confirmed document, the functions that need verification are suspended;
  - no data is deleted.

## Items the owner must confirm `[TO CONFIRM]`
1. The controller's identity: legal name, address, and VAT or company number if any. Also whether a DPO has been appointed.
2. The contact channel for data-protection requests: the existing general address, or a dedicated one.
3. **Legal basis.** Options for the lawyer:
   - performance of the contract (Terms §3: the service is for qualified professionals), Art. 6(1)(b) GDPR;
   - legitimate interest in patient safety and abuse prevention, Art. 6(1)(f), which needs a balancing test;
   - a combination of the two.

   Nothing is decided here.
4. **Processors for this feature:**
   - Supabase: database and Storage. Confirm the region and that the DPA covers Storage.
   - Vercel: the upload passes through its functions. The deployment metadata shows the function region `iad1` (Washington, USA), so the document transits through the United States: confirm the region choice (an EU region can be set in the project), the DPA and the transfer mechanism (for example the EU-US Data Privacy Framework or Standard Contractual Clauses).
   - Resend: only if verification e-mails are activated (not active today).
5. **Who the "authorised administrators" are:** their role and how many. Today the list is a server setting.
6. **Retention periods.** The proposal is in `docs/security/verification-evidence.md`: 30 days for the document, 12 months for internal notes, 24 months for older requests. Nothing is active.
7. Whether the "verified" status will ever be shown to other users or patients. Today it is shown only to the account owner.
8. Whether users can export their data, and how.
9. How the 60-day transition is communicated: in-app only (implemented), or also by e-mail (not implemented).

## Texts needing legal review
All four language versions below need it, in particular:
- the legal-basis paragraph;
- the rights paragraph, including the limits on erasure while the account is active;
- the retention paragraph;
- the international transfers paragraph.

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
- **Tu:** lo stato, il messaggio che ti inviamo e il tuo documento, tramite un link valido 60 secondi.
- **Gli amministratori autorizzati da PHYGO** `[TO CONFIRM: ruolo e numero]`: accedono al documento solo dopo un controllo dei permessi, con un link valido 60 secondi.
- **Nessun altro:** gli altri utenti e i pazienti non vedono il documento. Il documento non compare nelle cartelle cliniche, nei PDF clinici o nelle ricerche, e non viene inviato a servizi di intelligenza artificiale.

**Chi tratta i dati per nostro conto.**
- Supabase: database e archivio dei documenti `[TO CONFIRM: regione e copertura del contratto per Storage]`.
- Vercel: hosting dell'applicazione, attraverso cui transita il caricamento `[TO CONFIRM: regione e garanzie]`.

Entrambi agiscono come responsabili del trattamento, vincolati da un accordo sul trattamento dei dati. `[TO CONFIRM: trasferimenti fuori dallo Spazio economico europeo e relative garanzie]`

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
- **You:** your status, the message we send you, and your document, through a link valid for 60 seconds.
- **Administrators authorised by PHYGO** `[TO CONFIRM: role and number]`: they open the document only after a permission check, through a 60-second link.
- **No one else:** other users and patients never see the document. It never appears in patient records, clinical PDFs or search, and is never sent to AI services.

**Who processes the data on our behalf.**
- Supabase: database and document storage `[TO CONFIRM: region and DPA coverage for Storage]`.
- Vercel: application hosting, which the upload passes through `[TO CONFIRM: region and safeguards]`.

Both act as processors under a data processing agreement. `[TO CONFIRM: transfers outside the European Economic Area and safeguards]`

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
- **Tú:** tu estado, el mensaje que te enviamos y tu documento, mediante un enlace válido durante 60 segundos.
- **Los administradores autorizados por PHYGO** `[TO CONFIRM: función y número]`: abren el documento solo tras un control de permisos, con un enlace de 60 segundos.
- **Nadie más:** los demás usuarios y los pacientes no ven el documento. No aparece en historias clínicas, PDF clínicos ni búsquedas, y nunca se envía a servicios de inteligencia artificial.

**Quién trata los datos por nuestra cuenta.**
- Supabase: base de datos y almacenamiento de documentos `[TO CONFIRM: región y cobertura del contrato para Storage]`.
- Vercel: alojamiento de la aplicación, por la que pasa la subida `[TO CONFIRM: región y garantías]`.

Ambos actúan como encargados del tratamiento en virtud de un contrato de encargo. `[TO CONFIRM: transferencias fuera del Espacio Económico Europeo y garantías]`

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
- **Vous :** votre statut, le message que nous vous adressons et votre document, par un lien valable 60 secondes.
- **Les administrateurs autorisés par PHYGO** `[TO CONFIRM : fonction et nombre]` : ils n'ouvrent le document qu'après un contrôle des autorisations, par un lien de 60 secondes.
- **Personne d'autre :** les autres utilisateurs et les patients ne voient pas le document. Il n'apparaît ni dans les dossiers patients, ni dans les PDF cliniques, ni dans les recherches, et n'est jamais envoyé à des services d'intelligence artificielle.

**Qui traite les données pour notre compte.**
- Supabase : base de données et stockage des documents `[TO CONFIRM : région et couverture du contrat pour Storage]`.
- Vercel : hébergement de l'application, par laquelle transite le téléversement `[TO CONFIRM : région et garanties]`.

Tous deux agissent en tant que sous-traitants, liés par un accord de traitement des données. `[TO CONFIRM : transferts hors de l'Espace économique européen et garanties]`

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
