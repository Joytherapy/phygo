#!/bin/bash
# Expands the "Cellulare" tab from 2 to 5 concepts (adds Omeostasi e Controllo,
# Metabolismo Energetico as new categories). Replaces
# app/dashboard/physiology/page.tsx in full and patches uiStrings.ts.
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

PAGE=$(newest "physiology_page*.tsx")
PATCHER=$(newest "apply_physiology_cellular_expand*.py")

echo "Using:"
echo "  page    -> $PAGE"
echo "  patcher -> $PATCHER"
echo ""

cp "$PAGE" "$PROJECT/app/dashboard/physiology/page.tsx"
cp "$PATCHER" "$PROJECT/apply_physiology_cellular_expand.py"

echo "Files copied. Running the uiStrings patch..."
cd "$PROJECT"
python3 apply_physiology_cellular_expand.py

echo ""
echo "All done. Now stop the dev server (Ctrl+C) and run: npm run dev"
