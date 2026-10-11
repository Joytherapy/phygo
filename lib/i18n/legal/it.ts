import type { LegalDict } from './types';

// Faithful Italian translation of the English legal pages (lib/i18n/legal/en.ts).
export const it: LegalDict = {
  contents: 'In questa pagina',
  privacy: {
    metaTitle: 'Informativa sulla privacy — PHYGO',
    metaDescription:
      'Come PHYGO tratta i dati personali e clinici: ruoli, dati sanitari, sub-responsabili, conservazione, sicurezza e i tuoi diritti.',
    eyebrow: 'Note legali',
    title: 'Informativa sulla privacy',
    updated:
      'Ultimo aggiornamento: [data] — Bozza in attesa di revisione legale da parte di un professionista qualificato in materia di protezione dei dati.',
    sections: [
      {
        title: '1. Chi siamo e ambito di applicazione',
        blocks: [
          'Phygo («noi», «ci», «il Servizio») fornisce strumenti di documentazione clinica assistita dall’AI per fisioterapisti. La presente informativa spiega quali dati personali trattiamo, su quale base giuridica e quali diritti hai. Si applica ai professionisti che utilizzano Phygo direttamente e, indirettamente, ai pazienti i cui dati clinici vengono inseriti nel Servizio dai professionisti.',
        ],
      },
      {
        title: '2. Ruoli: titolare e responsabile del trattamento',
        blocks: [
          'Per i dati dell’account e di fatturazione, Phygo agisce in qualità di titolare del trattamento. Per i dati clinici e dei pazienti inseriti da un professionista, il professionista è il titolare del trattamento e Phygo agisce in qualità di responsabile del trattamento, trattando tali dati esclusivamente su istruzioni documentate del professionista e al fine di fornire il Servizio.',
        ],
      },
      {
        title: '3. Categorie particolari di dati (dati sanitari)',
        blocks: [
          'Le note cliniche, le valutazioni e i piani di trattamento costituiscono dati relativi alla salute ai sensi dell’articolo 9 del GDPR. Tali dati sono trattati sulla base della base giuridica propria del professionista per il trattamento del paziente (tipicamente la necessità per finalità di assistenza sanitaria, oppure il consenso esplicito raccolto dal professionista). Phygo non determina autonomamente la base giuridica del trattamento dei dati dei pazienti: questa responsabilità spetta al professionista in qualità di titolare.',
        ],
      },
      {
        title: '4. Dati che raccogliamo',
        blocks: [
          '**Dati dell’account:** nome, email, password (in forma hash), informazioni sullo studio.',
          '**Dati clinici:** note SOAP, piani di esercizi e qualsiasi altro contenuto che il professionista salva durante una seduta. Il testo della seduta (dettato o scritto) e le eventuali immagini di documenti diagnostici caricate dal professionista vengono inviati all’elaborazione AI per generare una bozza di nota o un riassunto scritto; Phygo non conserva la trascrizione della seduta né le immagini caricate.',
          '**Dati di utilizzo:** dati di log, informazioni sul dispositivo e dati di interazione necessari per far funzionare e proteggere il Servizio.',
        ],
      },
      {
        title: '5. Come utilizziamo i dati',
        blocks: [
          'Per generare documentazione clinica assistita dall’AI, fornire il Servizio e le sue funzionalità (Clinical Insights, Rehab Protocol, Phygo Science), mantenere la sicurezza e comunicare aggiornamenti essenziali sul servizio. Non utilizziamo i dati clinici per addestrare modelli di AI di terze parti e non vendiamo dati personali o clinici a terzi.',
        ],
      },
      {
        title: '6. Sub-responsabili del trattamento',
        blocks: [
          'Per far funzionare il Servizio ci avvaliamo dei seguenti sub-responsabili del trattamento, ciascuno vincolato da un accordo sul trattamento dei dati (Data Processing Agreement):',
          {
            list: [
              'Supabase (database e autenticazione, regione UE)',
              'OpenAI (generazione delle note assistita dall’AI tramite API — in base ai termini delle API, i dati non vengono utilizzati per addestrare i modelli di OpenAI)',
              'Vercel (hosting dell’applicazione)',
              'Resend (invio di email transazionali)',
            ],
          },
          'Un elenco aggiornato dei sub-responsabili è disponibile su richiesta.',
        ],
      },
      {
        title: '7. Trasferimenti internazionali di dati',
        blocks: [
          'Qualora un sub-responsabile si trovi al di fuori dello Spazio economico europeo, i trasferimenti sono disciplinati dalle Clausole contrattuali standard della Commissione europea o da un meccanismo di adeguatezza equivalente.',
        ],
      },
      {
        title: '8. Minimizzazione dei dati inviati all’elaborazione AI',
        blocks: [
          'Ove tecnicamente possibile, cerchiamo di limitare gli identificativi diretti del paziente (ad es. nome e cognome completi) inviati agli endpoint di elaborazione AI, mantenendoli solo quando necessari per la funzionalità richiesta.',
        ],
      },
      {
        title: '9. Conservazione dei dati',
        blocks: [
          'I dati clinici sono conservati finché l’account del professionista è attivo, oppure per il periodo richiesto dagli obblighi applicabili di conservazione della documentazione sanitaria, se più lungo. Alla chiusura dell’account, i dati vengono cancellati o anonimizzati entro un periodo ragionevole, fatti salvi gli obblighi legali di conservazione.',
        ],
      },
      {
        title: '10. Misure di sicurezza',
        blocks: [
          'Applichiamo la cifratura in transito e a riposo, controlli di accesso basati sui ruoli, la Row Level Security sulle tabelle dei dati clinici e il solo accesso autenticato. Nessun sistema è completamente sicuro; manteniamo procedure di risposta agli incidenti per gestire eventuali violazioni.',
        ],
      },
      {
        title: '11. Notifica delle violazioni dei dati',
        blocks: [
          'In caso di violazione dei dati personali che possa comportare un rischio per le persone, informeremo l’autorità di controllo competente entro 72 ore ove richiesto e avviseremo senza ingiustificato ritardo i professionisti interessati.',
        ],
      },
      {
        title: '12. I tuoi diritti',
        blocks: [
          'Nei limiti della legge applicabile, tu (oppure, per i dati dei pazienti, il professionista che agisce per conto del paziente) puoi chiedere l’accesso, la rettifica, la cancellazione, la limitazione del trattamento, la portabilità dei dati oppure opporti al trattamento. Le richieste possono essere inviate al contatto indicato di seguito. Risponderemo entro i termini previsti dalla legge applicabile.',
        ],
      },
      {
        title: '13. Processi decisionali automatizzati',
        blocks: [
          'Phygo genera suggerimenti assistiti dall’AI (note cliniche, raccomandazioni di esercizi) che vengono sempre rivisti e approvati dal professionista prima dell’uso. Phygo non prende decisioni cliniche autonome sui pazienti.',
        ],
      },
      {
        title: '14. Modifiche alla presente informativa',
        blocks: [
          'Potremmo aggiornare periodicamente la presente informativa. Le modifiche sostanziali saranno comunicate in anticipo ai titolari degli account, ove possibile.',
        ],
      },
      {
        title: '15. Contatti e reclami',
        blocks: [
          'Per domande o richieste relative alla presente informativa: hello@phygo.app. Hai inoltre il diritto di proporre reclamo all’autorità nazionale di controllo per la protezione dei dati.',
        ],
      },
    ],
  },
  terms: {
    metaTitle: 'Termini di servizio — PHYGO',
    metaDescription:
      'Le condizioni che si applicano all’uso di PHYGO: natura del Servizio, requisiti, responsabilità, titolarità dei dati e limitazioni di responsabilità.',
    eyebrow: 'Note legali',
    title: 'Termini di servizio',
    updated: 'Ultimo aggiornamento: [data] — Bozza in attesa di revisione legale da parte di un professionista qualificato.',
    sections: [
      {
        title: '1. Accettazione dei termini',
        blocks: [
          'Creando un account o utilizzando Phygo, accetti i presenti Termini di servizio e la nostra Informativa sulla privacy. Se non li accetti, non utilizzare il Servizio.',
        ],
      },
      {
        title: '2. Natura del Servizio',
        blocks: [
          'Phygo è uno strumento di supporto alle decisioni cliniche che genera documentazione assistita dall’AI, suggerimenti basati sulle evidenze e raccomandazioni di esercizi. Phygo non fornisce diagnosi mediche e non sostituisce il giudizio clinico professionale. Il professionista che utilizza Phygo mantiene la piena ed esclusiva responsabilità di rivedere, modificare e approvare tutti i contenuti generati dall’AI prima che vengano utilizzati, salvati o condivisi con un paziente.',
        ],
      },
      {
        title: '3. Requisiti',
        blocks: [
          'Il Servizio è destinato all’uso da parte di professionisti della fisioterapia abilitati o qualificati che agiscono nell’ambito della propria attività professionale. Dichiari di essere autorizzato a esercitare la fisioterapia o una professione riconosciuta equivalente nella tua giurisdizione.',
        ],
      },
      {
        title: '4. Il tuo account e le tue responsabilità',
        blocks: [
          'Sei responsabile della riservatezza delle tue credenziali di accesso e di tutte le attività svolte con il tuo account. Sei responsabile di ottenere l’eventuale consenso necessario dei pazienti per la raccolta e il trattamento dei dati clinici tramite il Servizio, in conformità con la normativa sanitaria e sulla protezione dei dati applicabile nella tua giurisdizione.',
        ],
      },
      {
        title: '5. Titolarità dei dati',
        blocks: [
          'Tu (o il tuo studio) mantieni la titolarità di tutti i dati clinici inseriti nel Servizio. Phygo tratta tali dati esclusivamente per fornire il Servizio, come descritto nell’Informativa sulla privacy, e non rivendica alcuna titolarità sulla tua documentazione clinica.',
        ],
      },
      {
        title: '6. Uso consentito',
        blocks: [
          'Ti impegni a non utilizzare il Servizio per conservare o trattare dati che non sei legalmente autorizzato a gestire, a non tentare di eludere le misure di sicurezza e a non utilizzare il Servizio in modo da poter compromettere la sicurezza dei pazienti affidandoti a contenuti generati dall’AI senza revisione clinica.',
        ],
      },
      {
        title: '7. Abbonamento e fatturazione',
        blocks: [
          'I piani a pagamento, ove previsti, sono fatturati come indicato al momento dell’acquisto. Prezzi e funzionalità possono cambiare con un ragionevole preavviso agli abbonati attivi.',
        ],
      },
      {
        title: '8. Disponibilità del Servizio',
        blocks: [
          'Ci impegniamo a fornire un Servizio affidabile, ma non garantiamo una disponibilità ininterrotta. Non siamo responsabili per danni derivanti da manutenzione programmata o da fattori al di fuori del nostro ragionevole controllo.',
        ],
      },
      {
        title: '9. Limitazione di responsabilità',
        blocks: [
          'Il Servizio è fornito «così com’è», senza garanzie di alcun tipo. Nella misura massima consentita dalla legge, Phygo non è responsabile per esiti clinici, decisioni o azioni intraprese da un professionista sulla base di suggerimenti generati dall’AI. Nessuna disposizione dei presenti termini limita la responsabilità che non può essere limitata ai sensi della legge applicabile.',
        ],
      },
      {
        title: '10. Cessazione',
        blocks: [
          'Puoi chiudere il tuo account in qualsiasi momento. Possiamo sospendere o chiudere gli account che violano i presenti termini, con preavviso ove ragionevolmente possibile. In caso di cessazione, i dati saranno gestiti come descritto nella nostra Informativa sulla privacy.',
        ],
      },
      {
        title: '11. Modifiche ai presenti termini',
        blocks: [
          'Potremmo aggiornare periodicamente i presenti Termini. L’uso continuato del Servizio dopo l’entrata in vigore delle modifiche costituisce accettazione dei Termini aggiornati.',
        ],
      },
      {
        title: '12. Legge applicabile',
        blocks: [
          'I presenti Termini sono regolati dalle leggi di [giurisdizione da confermare], senza riguardo ai principi in materia di conflitto di leggi.',
        ],
      },
      { title: '13. Contatti', blocks: ['Per domande sui presenti Termini: hello@phygo.app'] },
    ],
  },
  contact: {
    metaTitle: 'Contatti — PHYGO',
    metaDescription: 'Domande su PHYGO, feedback o richiesta di una demo: scrivi a hello@phygo.app.',
    eyebrow: 'Contattaci',
    title: 'Contatti',
    text: 'Hai domande su Phygo, vuoi lasciarci un feedback o richiedere una demo? Scrivici un’email e ti risponderemo.',
    emailLabel: 'Scrivici',
  },
};
