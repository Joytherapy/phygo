#!/bin/bash
# Installs the new "Medicina dello Sport" / "Sports Medicine" Library section:
# lib/sportsMedicineFields.ts, app/api/sports-medicine/route.ts,
# app/dashboard/sports-medicine/page.tsx, patches uiStrings.ts + Navbar.tsx,
# and replaces app/api/search/route.ts (adds sports medicine + physiology
# cellular tab to search, which was previously missing).
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

FIELDS=$(newest "sportsMedicineFields*.ts")
ROUTE=$(newest "sports_medicine_route*.ts")
PAGE=$(newest "sports_medicine_page*.tsx")
PATCHER=$(newest "apply_sports_medicine_ui*.py")
SEARCH=$(newest "route*.ts")

echo "Using:"
echo "  fields  -> $FIELDS"
echo "  api     -> $ROUTE"
echo "  page    -> $PAGE"
echo "  patcher -> $PATCHER"
echo "  search  -> $SEARCH"
echo ""

mkdir -p "$PROJECT/lib"
mkdir -p "$PROJECT/app/api/sports-medicine"
mkdir -p "$PROJECT/app/dashboard/sports-medicine"
mkdir -p "$PROJECT/app/api/search"

cp "$FIELDS" "$PROJECT/lib/sportsMedicineFields.ts"
cp "$ROUTE" "$PROJECT/app/api/sports-medicine/route.ts"
cp "$PAGE" "$PROJECT/app/dashboard/sports-medicine/page.tsx"
cp "$SEARCH" "$PROJECT/app/api/search/route.ts"
cp "$PATCHER" "$PROJECT/apply_sports_medicine_ui.py"

echo "Files copied. Running the i18n/navbar patch..."
cd "$PROJECT"
python3 apply_sports_medicine_ui.py

echo ""
echo "All done. Now stop the dev server (Ctrl+C) and run: npm run dev"
