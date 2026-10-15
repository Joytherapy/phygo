# DRAFT — Privacy notice, sections 6 "Sub-processors" and 7 "International data transfers"

**Status: unpublished draft, for legal review.** It replaces sections 6 and 7 of the current privacy notice, which today:
- list Resend, which the code does not use;
- omit Daily (video) and the browser's speech service (dictation);
- describe OpenAI as "note generation" only;
- state that every provider is bound by a Data Processing Agreement, which is not yet proven (decision D6).

Source of the facts: `docs/infra/providers-and-transfers.md` (PR #16), read from the code on 13 Oct 2026. It is published together with the professional-verification section, through `lib/i18n/legal/verificationValues.ts` (PR #17): nothing changes on the site until every value is set and the legal review is approved.

## Values to fill
| Placeholder | What | Recommendation | Evidence needed before filling it |
|---|---|---|---|
| `{{PROCESSOR_AGREEMENTS}}` | The sentence saying the providers are bound by a data processing agreement | "Each of them processes data on our behalf under a data processing agreement." | The DPAs of Supabase, Vercel, OpenAI and Daily accepted, with saved copies (D6). Until then this sentence must not be published |
| `{{AUTH_EMAIL_PROVIDER}}` | Who sends sign-in and password e-mails | Supabase's own e-mail service, unless a custom SMTP provider is set in the Supabase dashboard (then name it) | Owner checks Supabase → Authentication → SMTP settings |
| `{{OPENAI_RETENTION}}` | How long OpenAI keeps what it receives | Without zero data retention: "OpenAI may keep it for up to 30 days to detect abuse, then deletes it." With zero data retention approved: "OpenAI does not keep it after answering." | OpenAI's API data policy (30 days for abuse monitoring, per OpenAI's "Your data" page); a written ZDR approval if requested (D15) |
| `{{FUNCTION_REGION}}`, `{{TRANSFER_SAFEGUARDS}}` | As in the verification section | See `DRAFT_privacy-professional-verification.md` | D7, D8 |

## Fixed statements to confirm before publication
- "PHYGO does not record calls": true of the code (no recording is enabled when a room is created). The owner confirms that recording is not enabled at domain level in the Daily dashboard.
- "We use no advertising, traffic-analytics or tracking services": true of the code today (no analytics, tag manager or error-tracking script). It must be re-checked if one is added.
- "Not used to train its models": OpenAI's API data policy (no training on API data unless the customer opts in). The owner confirms that no opt-in is enabled in the OpenAI dashboard.

## What the text does not say, on purpose
- It does not claim Data Privacy Framework certification for any provider: none was confirmed on the official list.
- It does not say how Google, Apple or Microsoft treat dictation audio: their current terms were not confirmed. It says that PHYGO has no agreement with them, which is true.
- It does not promise EU-only processing.

---

## Italiano

### 6. Fornitori che trattano dati per nostro conto
Per far funzionare PHYGO usiamo questi fornitori. {{PROCESSOR_AGREEMENTS}}
- **Supabase** (Supabase Inc., Stati Uniti): database, accesso all'account e archivio privato dei file, nella regione di Francoforte (Germania). Contiene i dati dell'account, le cartelle cliniche, i file caricati e i documenti di verifica. Le e-mail di accesso e di reimpostazione della password sono inviate tramite {{AUTH_EMAIL_PROVIDER}}.
- **Vercel** (Vercel Inc., Stati Uniti): hosting dell'applicazione. I nostri server si trovano a {{FUNCTION_REGION}} e ricevono ogni richiesta al sito, con i dati che invii.
- **OpenAI** (OpenAI, L.L.C., Stati Uniti): funzioni di intelligenza artificiale. Riceve ciò che invii a queste funzioni:
  - trascrizioni e note delle sedute;
  - le domande ad Ask PHYGO, con la nota della seduta in corso;
  - le immagini che carichi per l'analisi, per esempio radiografie, risonanze o impegnative.

  In base alle condizioni dell'API di OpenAI, questi dati non vengono usati per addestrare i suoi modelli. {{OPENAI_RETENTION}}
- **Daily** (Daily.co, Inc., Stati Uniti): videoconsulenze. Trasmette audio, video e chat della chiamata e vede gli indirizzi IP dei partecipanti. PHYGO non registra le chiamate.

**Dettatura vocale.** Se usi la dettatura durante una seduta, l'audio viene trascritto dal servizio vocale del tuo browser, non da PHYGO: in Chrome da Google, in Safari da Apple, in Edge da Microsoft. Quel fornitore tratta l'audio secondo le proprie condizioni e PHYGO non ha un accordo con lui. Se non è accettabile per i tuoi pazienti, non usare la dettatura e scrivi le note a mano.

Non usiamo servizi di pubblicità, di analisi del traffico o di tracciamento.

### 7. Trasferimenti di dati fuori dall'Unione europea
Supabase, Vercel, OpenAI e Daily hanno sede negli Stati Uniti. Alcuni loro servizi o fornitori possono accedere ai dati da fuori dello Spazio economico europeo, e OpenAI e Daily possono trattarli negli Stati Uniti. Per questi trasferimenti ci basiamo su {{TRANSFER_SAFEGUARDS}}. Puoi chiederci una copia delle garanzie scrivendo all'indirizzo indicato nella sezione 15.

---

## English

### 6. Providers that process data on our behalf
We use these providers to run PHYGO. {{PROCESSOR_AGREEMENTS}}
- **Supabase** (Supabase Inc., United States): database, account sign-in and private file storage, in the Frankfurt (Germany) region. It holds account data, clinical records, uploaded files and verification documents. Sign-in and password-reset e-mails are sent through {{AUTH_EMAIL_PROVIDER}}.
- **Vercel** (Vercel Inc., United States): application hosting. Our servers run in {{FUNCTION_REGION}} and receive every request to the site, with the data you send.
- **OpenAI** (OpenAI, L.L.C., United States): AI features. It receives what you send to these features:
  - session transcripts and notes;
  - your questions to Ask PHYGO, with the note of the current session;
  - the images you upload for analysis, for example X-rays, MRI scans or referral letters.

  Under OpenAI's API terms, this data is not used to train its models. {{OPENAI_RETENTION}}
- **Daily** (Daily.co, Inc., United States): video consultations. It carries the audio, video and chat of the call and sees the participants' IP addresses. PHYGO does not record calls.

**Voice dictation.** If you use dictation during a session, the audio is transcribed by your browser's speech service, not by PHYGO: by Google in Chrome, by Apple in Safari, by Microsoft in Edge. That provider processes the audio under its own terms, and PHYGO has no agreement with it. If this is not acceptable for your patients, do not use dictation and type the notes instead.

We use no advertising, traffic-analytics or tracking services.

### 7. Data transfers outside the European Union
Supabase, Vercel, OpenAI and Daily are based in the United States. Some of their services or providers may access data from outside the European Economic Area, and OpenAI and Daily may process it in the United States. For these transfers we rely on {{TRANSFER_SAFEGUARDS}}. You can ask us for a copy of the safeguards at the address in section 15.

---

## Español

### 6. Proveedores que tratan datos por cuenta nuestra
Para hacer funcionar PHYGO usamos estos proveedores. {{PROCESSOR_AGREEMENTS}}
- **Supabase** (Supabase Inc., Estados Unidos): base de datos, acceso a la cuenta y almacenamiento privado de archivos, en la región de Fráncfort (Alemania). Contiene los datos de la cuenta, las historias clínicas, los archivos subidos y los documentos de verificación. Los correos de acceso y de restablecimiento de contraseña se envían a través de {{AUTH_EMAIL_PROVIDER}}.
- **Vercel** (Vercel Inc., Estados Unidos): alojamiento de la aplicación. Nuestros servidores están en {{FUNCTION_REGION}} y reciben cada solicitud al sitio, con los datos que envías.
- **OpenAI** (OpenAI, L.L.C., Estados Unidos): funciones de inteligencia artificial. Recibe lo que envías a estas funciones:
  - transcripciones y notas de las sesiones;
  - tus preguntas a Ask PHYGO, con la nota de la sesión en curso;
  - las imágenes que subes para su análisis, por ejemplo radiografías, resonancias o volantes de derivación.

  Según las condiciones de la API de OpenAI, estos datos no se usan para entrenar sus modelos. {{OPENAI_RETENTION}}
- **Daily** (Daily.co, Inc., Estados Unidos): videoconsultas. Transmite el audio, el vídeo y el chat de la llamada y ve las direcciones IP de los participantes. PHYGO no graba las llamadas.

**Dictado por voz.** Si usas el dictado durante una sesión, el audio lo transcribe el servicio de voz de tu navegador, no PHYGO: Google en Chrome, Apple en Safari, Microsoft en Edge. Ese proveedor trata el audio según sus propias condiciones y PHYGO no tiene un acuerdo con él. Si no es aceptable para tus pacientes, no uses el dictado y escribe las notas a mano.

No usamos servicios de publicidad, de análisis del tráfico ni de seguimiento.

### 7. Transferencias de datos fuera de la Unión Europea
Supabase, Vercel, OpenAI y Daily tienen su sede en Estados Unidos. Algunos de sus servicios o proveedores pueden acceder a los datos desde fuera del Espacio Económico Europeo, y OpenAI y Daily pueden tratarlos en Estados Unidos. Para estas transferencias nos basamos en {{TRANSFER_SAFEGUARDS}}. Puedes pedirnos una copia de las garantías en la dirección indicada en la sección 15.

---

## Français

### 6. Prestataires qui traitent des données pour notre compte
Pour faire fonctionner PHYGO, nous faisons appel à ces prestataires. {{PROCESSOR_AGREEMENTS}}
- **Supabase** (Supabase Inc., États-Unis) : base de données, connexion au compte et stockage privé des fichiers, dans la région de Francfort (Allemagne). Il contient les données du compte, les dossiers cliniques, les fichiers téléversés et les documents de vérification. Les e-mails de connexion et de réinitialisation du mot de passe sont envoyés par {{AUTH_EMAIL_PROVIDER}}.
- **Vercel** (Vercel Inc., États-Unis) : hébergement de l'application. Nos serveurs se trouvent à {{FUNCTION_REGION}} et reçoivent chaque requête adressée au site, avec les données que vous envoyez.
- **OpenAI** (OpenAI, L.L.C., États-Unis) : fonctions d'intelligence artificielle. Il reçoit ce que vous envoyez à ces fonctions :
  - les transcriptions et les notes des séances ;
  - vos questions à Ask PHYGO, avec la note de la séance en cours ;
  - les images que vous téléversez pour analyse, par exemple des radiographies, des IRM ou des prescriptions.

  Selon les conditions de l'API d'OpenAI, ces données ne sont pas utilisées pour entraîner ses modèles. {{OPENAI_RETENTION}}
- **Daily** (Daily.co, Inc., États-Unis) : téléconsultations. Il transmet l'audio, la vidéo et le chat de l'appel et voit les adresses IP des participants. PHYGO n'enregistre pas les appels.

**Dictée vocale.** Si vous utilisez la dictée pendant une séance, l'audio est transcrit par le service vocal de votre navigateur, et non par PHYGO : par Google dans Chrome, par Apple dans Safari, par Microsoft dans Edge. Ce prestataire traite l'audio selon ses propres conditions et PHYGO n'a pas d'accord avec lui. Si ce n'est pas acceptable pour vos patients, n'utilisez pas la dictée et saisissez les notes à la main.

Nous n'utilisons aucun service de publicité, de mesure d'audience ou de suivi.

### 7. Transferts de données hors de l'Union européenne
Supabase, Vercel, OpenAI et Daily ont leur siège aux États-Unis. Certains de leurs services ou prestataires peuvent accéder aux données depuis l'extérieur de l'Espace économique européen, et OpenAI et Daily peuvent les traiter aux États-Unis. Pour ces transferts, nous nous appuyons sur {{TRANSFER_SAFEGUARDS}}. Vous pouvez nous demander une copie des garanties à l'adresse indiquée à la section 15.
