#!/bin/bash
# Diagnostic script: queries Supabase's REST API directly, bypassing Next.js
# entirely, to check whether the stale "Endopelvic Fascia" value is coming
# from Supabase itself or from something in the Next.js process.
set -e
cd "$(dirname "$0")"

if [ ! -f .env.local ]; then
  echo "ERRORE: .env.local non trovato in questa cartella."
  exit 1
fi

URL=$(grep '^NEXT_PUBLIC_SUPABASE_URL=' .env.local | cut -d= -f2)
KEY=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' .env.local | cut -d= -f2)

echo "Interrogo Supabase direttamente (bypassando Next.js)..."
echo ""

curl -s "$URL/rest/v1/pelvic_floor_structures?id=eq.77832897-f4c3-46ce-b158-42a46671027b&select=id,slug,name" \
  -H "apikey: $KEY" \
  -H "Authorization: Bearer $KEY"

echo ""
echo ""
echo "Se sopra vedi TEST DEBUG 123 -> il problema e' nel processo Next.js (server zombie)."
echo "Se sopra vedi ancora Endopelvic Fascia -> il problema e' a monte, in Supabase stesso."
