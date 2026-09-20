#!/bin/bash
# Aggiunge il tasto/casella di ricerca alla pagina Fisiologia e alla pagina
# Medicina dello Sport (le prime due sezioni: verificheremo che funzioni bene
# prima di estenderlo alle altre sezioni della Libreria).
set -e

PROJECT="$HOME/Downloads/phygo"
DL="$HOME/Downloads"

if [ ! -d "$PROJECT" ]; then
  echo "ABORT: $PROJECT not found. Adjust PROJECT= at the top of this script."
  exit 1
fi

newest() {
  local f
  f=$(ls -t $DL/$1 2>/dev/null | head -1)
  if [ -z "$f" ]; then
    echo "ABORT: no file matching '$1' found in $DL — did the download finish?"
    exit 1
  fi
  echo "$f"
}

PHYSIO_PAGE=$(newest "physiology_page*.tsx")
SPORTS_PAGE=$(newest "sports_medicine_page*.tsx")
PATCHER=$(newest "apply_library_search*.py")

echo "Using:"
echo "  physiology page     -> $PHYSIO_PAGE"
echo "  sports medicine page -> $SPORTS_PAGE"
echo "  patcher              -> $PATCHER"
echo ""

cp "$PHYSIO_PAGE" "$PROJECT/app/dashboard/physiology/page.tsx"
cp "$SPORTS_PAGE" "$PROJECT/app/dashboard/sports-medicine/page.tsx"
cp "$PATCHER" "$PROJECT/apply_library_search.py"

echo "Files copied. Running the i18n patch..."
cd "$PROJECT"
python3 apply_library_search.py

echo ""
echo "Fatto. Ora ferma il server (Ctrl+C), poi:"
echo "  rm -rf .next"
echo "  npm run dev"
