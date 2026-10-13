// Stand-ins for the verification database functions of
// sql/2026-10_verification_evidence_PROPOSED.sql (verification_submit,
// verification_record_check, verification_decide), for the fake Supabase.
// They follow the same rules on the fake tables so the API can be tested end
// to end. The real functions (including the single-transaction behaviour and
// the history guard) are tested on PostgreSQL by tests/sql/run.sh.
const OPEN = ['pending', 'needs_info'];
const CATEGORIES = ['not_in_register', 'data_mismatch', 'document_unreadable', 'document_not_valid', 'other'];
const same = (a, b) => String(a ?? '').trim().replace(/\s+/g, ' ').toLowerCase() === String(b ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
const refuse = (code) => {
  throw new Error(`verification:${code}`);
};
const now = () => new Date().toISOString();
const t = (state, name) => (state.tables[name] ??= []);
const latestOf = (state, userId) =>
  [...t(state, 'professional_verification_requests')].filter((r) => r.user_id === userId).sort((a, b) => (a.submitted_at < b.submitted_at ? 1 : -1))[0];
const id = () => crypto.randomUUID();

// The id of an account's latest request (null when it has none): what the
// administration page sends as requestId with a decision.
export const latestRequestId = (state, userId) => latestOf(state, userId)?.id ?? null;

export const verificationRpc = {
  verification_submit(a, state) {
    const profile = t(state, 'profiles').find((p) => p.id === a.p_user_id);
    if (!profile) refuse('not_found');
    const lastVerified = t(state, 'professional_verification_requests')
      .filter((r) => r.user_id === a.p_user_id && r.status === 'verified')
      .sort((x, y) => (x.decided_at < y.decided_at ? 1 : -1))[0];
    const keep =
      profile.professional_status === 'verified' &&
      same(profile.registry_country, a.p_registry_country) &&
      same(profile.registry_name, a.p_registry_name) &&
      same(profile.registration_number, a.p_registration_number) &&
      (!lastVerified || (same(lastVerified.legal_first_name, a.p_legal_first_name) && same(lastVerified.legal_last_name, a.p_legal_last_name)));
    const at = now();
    const superseded = [];
    for (const r of t(state, 'professional_verification_requests')) {
      if (r.user_id === a.p_user_id && OPEN.includes(r.status)) {
        Object.assign(r, { status: 'superseded', decided_at: at });
        if (r.document_path) superseded.push(r.document_path);
      }
    }
    t(state, 'professional_verification_requests').push({
      id: a.p_request_id, user_id: a.p_user_id, legal_first_name: a.p_legal_first_name, legal_last_name: a.p_legal_last_name,
      registry_country: a.p_registry_country, registry_name: a.p_registry_name, registration_number: a.p_registration_number,
      document_path: a.p_document_path, document_mime: a.p_document_mime, document_size: a.p_document_size, document_deleted_at: null,
      declaration_version: a.p_declaration_version, declaration_accepted_at: at, submitted_while_verified: keep,
      status: 'pending', submitted_at: at, registry_check: 'not_checked', registry_checked_at: null, registry_checked_by: null,
      decided_at: null, decided_by: null, rejection_category: null, user_message: null,
    });
    if (keep) profile.verification_requested_at = at;
    else
      Object.assign(profile, {
        registry_country: a.p_registry_country, registry_name: a.p_registry_name, registration_number: a.p_registration_number,
        professional_status: 'pending', verification_requested_at: at, verification_reviewed_at: null, verification_reviewed_by: null, verification_message: null,
      });
    return { kept_verified: keep, superseded_paths: superseded };
  },

  verification_record_check(a, state) {
    const r = t(state, 'professional_verification_requests').find((x) => x.id === a.p_request_id);
    if (!r) refuse('not_found');
    if (!OPEN.includes(r.status)) refuse('already_decided');
    const at = now();
    Object.assign(r, { registry_check: a.p_result, registry_checked_at: at, registry_checked_by: a.p_reviewer });
    t(state, 'professional_verification_reviews').push({
      id: id(), user_id: r.user_id, request_id: r.id, action: 'registry_check', registry_check: a.p_result, rejection_category: null,
      internal_note: a.p_note || null, note_redacted_at: null, reviewer: a.p_reviewer, created_at: at,
    });
    return null;
  },

  verification_decide(a, state) {
    const d = a.p_decision;
    if (!['verified', 'needs_info', 'rejected'].includes(d)) refuse('invalid_decision');
    if (d !== 'verified' && !a.p_message) refuse('message_required');
    if (d === 'rejected' && !CATEGORIES.includes(a.p_category)) refuse('category_required');
    const profile = t(state, 'profiles').find((p) => p.id === a.p_user_id);
    if (!profile) refuse('not_found');
    const latest = latestOf(state, a.p_user_id);
    if ((latest?.id ?? null) !== (a.p_expected_request_id ?? null)) refuse('stale');
    const open = !!latest && OPEN.includes(latest.status);
    const wasVerified = profile.professional_status === 'verified';
    if (d === 'verified') {
      if (!open) refuse('no_request');
      if (!latest.document_path) refuse('no_document');
      if (latest.registry_check !== 'match') refuse('registry_not_matched');
      if (!profile.registration_number) refuse('no_registration');
      if (!(same(profile.registry_country, latest.registry_country) && same(profile.registry_name, latest.registry_name) && same(profile.registration_number, latest.registration_number))) refuse('details_changed');
    }
    const status = d === 'needs_info' && wasVerified ? 'verified' : d;
    const action = d === 'verified' && wasVerified ? 'confirmed' : d === 'rejected' && wasVerified ? 'revoked' : d;
    const at = now();
    Object.assign(profile, { professional_status: status, verification_reviewed_at: at, verification_reviewed_by: a.p_reviewer, verification_message: a.p_message || null });
    if (open) Object.assign(latest, { status: d, decided_at: at, decided_by: a.p_reviewer, rejection_category: d === 'rejected' ? a.p_category : null, user_message: a.p_message || null });
    if (d === 'verified') for (const x of t(state, 'professional_evidence_deadlines')) if (x.user_id === a.p_user_id && !x.satisfied_at) x.satisfied_at = at;
    if (d === 'rejected') state.tables.professional_transition_accounts = t(state, 'professional_transition_accounts').filter((x) => x.user_id !== a.p_user_id);
    t(state, 'professional_verification_reviews').push({
      id: id(), user_id: a.p_user_id, request_id: latest?.id ?? null, action, registry_check: null, rejection_category: d === 'rejected' ? a.p_category : null,
      internal_note: a.p_note || null, note_redacted_at: null, reviewer: a.p_reviewer, created_at: at,
    });
    return { status, action, request_id: latest?.id ?? null };
  },
};
