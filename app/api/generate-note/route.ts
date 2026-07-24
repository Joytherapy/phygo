import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { transcript } = await request.json();

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json(
        { error: "Manca il testo trascritto (transcript)." },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Sei un assistente per fisioterapisti. Trasforma un breve appunto vocale trascritto (registrato dall'operatore a fine seduta) in una nota clinica strutturata.

Rispondi SEMPRE e SOLO in JSON valido, con questa struttura esatta:
{
  "subjective": "cosa riferisce il paziente",
  "objective": "osservazioni oggettive del terapeuta",
  "assessment": "valutazione clinica del terapeuta",
  "plan": "piano di trattamento",
  "exercises": ["esercizio 1", "esercizio 2"],
  "summaryForPatient": "breve messaggio semplice da inviare al paziente via WhatsApp"
}

Usa SOLO le informazioni presenti nella trascrizione. Non inventare dettagli clinici che il terapeuta non ha detto. Se un campo non è coperto, lascialo come stringa vuota.`,
        },
        {
          role: "user",
          content: transcript,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json(
        { error: "Nessuna risposta dal modello." },
        { status: 500 }
      );
    }

    const note = JSON.parse(raw);
    return NextResponse.json({ note });
  } catch (err) {
    console.error("Errore generate-note:", err);
    return NextResponse.json(
      { error: "Errore nella generazione della nota." },
      { status: 500 }
    );
  }
}
