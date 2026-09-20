#!/bin/bash
# Adds the third "Cellulare" tab to the Fisiologia section (membrane
# transport + chemical messenger signal transduction — cap.4/5 di Stanfield).
# Replaces app/api/physiology/route.ts and app/dashboard/physiology/page.tsx
# in full, then patches lib/i18n/uiStrings.ts for the new tab + translations.
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

ROUTE=$(newest "physiology_route*.ts")
PAGE=$(newest "physiology_page*.tsx")
PATCHER=$(newest "apply_physiology_cellular_ui*.py")

echo "Using:"
echo "  api     -> $ROUTE"
echo "  page    -> $PAGE"
echo "  patcher -> $PATCHER"
echo ""

cp "$ROUTE" "$PROJECT/app/api/physiology/route.ts"
cp "$PAGE" "$PROJECT/app/dashboard/physiology/page.tsx"
cp "$PATCHER" "$PROJECT/apply_physiology_cellular_ui.py"

echo "Files copied. Running the uiStrings patch..."
cd "$PROJECT"
python3 apply_physiology_cellular_ui.py

echo ""
echo "All done. Now stop the dev server (Ctrl+C) and run: npm run dev"
