// Private Daily video rooms: shared rules for creating rooms, issuing
// meeting tokens and ending calls. Every check runs on the server.
//
// How Daily applies these settings (Daily REST API reference, "rooms" and
// "meeting tokens"):
//   - privacy "private": only participants with a valid meeting token can
//     join (knocking stays off, so there is no other way in);
//   - a token without room_name opens every room of the domain, so room_name
//     is always set;
//   - token exp: after it the token can no longer be used to join; people
//     already in the call stay unless eject_at_token_exp is set. Token-level
//     eject settings override the room's, so none is set on the token and the
//     room's eject_at_room_exp ends the call for everyone at the room's expiry;
//   - Daily has no single-use tokens: a token can be used again until it
//     expires. Hence a short exp, max_participants 2, a new token for every
//     join, and no token once the call has ended (the room is also deleted).
import { createHmac } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

// DAILY_API_BASE_URL is only for tests (a local stand-in); leave it unset.
export const DAILY_API = (process.env.DAILY_API_BASE_URL || "https://api.daily.co/v1").replace(/\/$/, "");
export const ROOM_TTL_SECONDS = 60 * 60; // a call can last up to one hour, as before
export const TOKEN_TTL_SECONDS = 10 * 60; // time to enter the call with one token
export const MAX_PARTICIPANTS = 2; // the clinician and the patient
/** Names created by /api/video-call/create-room (roomNameFor): nothing about the patient. */
export const ROOM_NAME = /^phygo-[0-9a-f]{32}$/;

/**
 * The room name of a call, derived from the call's id with a keyed hash
 * (HMAC-SHA256, keyed with the server's Daily API key). Clinicians can still
 * write video_calls rows from the browser (RLS), so a row's room_name alone
 * cannot be trusted: a row that names someone else's room does not match its
 * own id, and gets no token. The call id is random; Daily learns nothing about
 * the patient from the name.
 */
export function roomNameFor(callId: string): string {
  const key = process.env.DAILY_API_KEY;
  if (!key) throw new Error("DAILY_API_KEY is not set");
  return `phygo-${createHmac("sha256", key).update(`phygo-room:${callId}`).digest("hex").slice(0, 32)}`;
}

/** The call's own room, as created by the server (name and URL), or false. */
export function isServerRoom(call: { id: string; room_name: string | null; room_url: string | null }): boolean {
  if (!process.env.DAILY_API_KEY || !call.room_name || call.room_name !== roomNameFor(call.id)) return false;
  try {
    const url = new URL(call.room_url ?? "");
    return url.protocol === "https:" && url.pathname === `/${call.room_name}`;
  } catch {
    return false;
  }
}
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const roomProperties = (now = Date.now()) => ({
  privacy: "private" as const,
  properties: {
    exp: Math.floor(now / 1000) + ROOM_TTL_SECONDS,
    eject_at_room_exp: true,
    max_participants: MAX_PARTICIPANTS,
    enable_knocking: false,
    enable_chat: true,
    enable_screenshare: true,
  },
});

export type CallRole = "clinician" | "patient";

export type CallAccess =
  | { ok: true; role: CallRole; call: { id: string; room_name: string; room_url: string; patient_id: string; status: string } }
  | { ok: false; status: 404 | 410 | 503; error: string };

/**
 * Which role the signed-in user has on this call, if any. Read with the
 * service role, so it never depends on what the browser can see; the same
 * answer (404) for "does not exist" and "not yours", so ids cannot be probed.
 */
export async function callAccess(
  db: SupabaseClient,
  userId: string,
  callId: string,
  now = Date.now(),
  // Ending a call: the clinician may always close their own call, even an
  // expired or an old public one, so a stale row never blocks a new call, and
  // an ended one, so closing its Daily room can be tried again.
  { toEnd = false }: { toEnd?: boolean } = {},
): Promise<CallAccess> {
  const { data: call, error } = await db
    .from("video_calls")
    .select("id, patient_id, room_name, room_url, status, created_at")
    .eq("id", callId)
    .maybeSingle();
  if (error) return { ok: false, status: 503, error: "Service unavailable" };
  if (!call) return { ok: false, status: 404, error: "Call not found" };
  const { data: patient, error: patientError } = await db
    .from("patients")
    .select("user_id, patient_user_id")
    .eq("id", call.patient_id)
    .maybeSingle();
  if (patientError) return { ok: false, status: 503, error: "Service unavailable" };
  const role: CallRole | null = patient?.user_id === userId ? "clinician" : patient?.patient_user_id === userId ? "patient" : null;
  if (!role) return { ok: false, status: 404, error: "Call not found" };
  if (toEnd) return { ok: true, role, call };
  if (call.status !== "active") return { ok: false, status: 410, error: "This call has ended" };
  const started = Date.parse(call.created_at);
  if (!Number.isFinite(started) || now - started > ROOM_TTL_SECONDS * 1000) return { ok: false, status: 410, error: "This call has ended" };
  // Calls created before private rooms (public rooms), and rows whose room is
  // not the one the server created for this call id, get no token.
  if (!isServerRoom(call)) return { ok: false, status: 410, error: "Start a new call" };
  return { ok: true, role, call };
}

const LABELS: Record<string, Record<CallRole, string>> = {
  it: { clinician: "Fisioterapista", patient: "Paziente" },
  en: { clinician: "Physiotherapist", patient: "Patient" },
  es: { clinician: "Fisioterapeuta", patient: "Paciente" },
  fr: { clinician: "Kinésithérapeute", patient: "Patient" },
};

/** The properties of the meeting token: one room, a short time to join, the role's rights. */
export function tokenProperties(roomName: string, role: CallRole, lang: unknown, now = Date.now()) {
  return {
    room_name: roomName,
    nbf: Math.floor(now / 1000) - 30,
    exp: Math.floor(now / 1000) + TOKEN_TTL_SECONDS,
    is_owner: role === "clinician",
    // A role, never a name or an id: the label is all Daily receives about the person.
    user_name: (LABELS[typeof lang === "string" ? lang : ""] ?? LABELS.it)[role],
  };
}

/**
 * Deletes a Daily room, which disconnects everyone in it and makes every token
 * issued for it useless. Tried twice; a room Daily no longer has (404) counts
 * as closed. Returns the last status Daily gave when it could not be deleted.
 */
export async function deleteRoom(roomName: string): Promise<{ ok: true } | { ok: false; status: number | "network error" }> {
  let status: number | "network error" = "network error";
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(`${DAILY_API}/rooms/${encodeURIComponent(roomName)}`, { method: "DELETE", headers: dailyHeaders() }).catch(() => null);
    if (res && (res.ok || res.status === 404)) return { ok: true };
    status = res?.status ?? "network error";
  }
  return { ok: false, status };
}

export const dailyHeaders = () => ({
  Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
  "Content-Type": "application/json",
});
