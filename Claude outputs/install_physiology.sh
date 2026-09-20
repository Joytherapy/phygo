#!/bin/bash
# Moves the 5 just-downloaded Physiology files into place inside ~/Downloads/phygo
# and runs the patch script. Picks the MOST RECENTLY downloaded file matching
# each name (handles "(1)" suffixes Chrome/Safari add on duplicate filenames)
# so you don't have to hunt for the right file yourself.
set -e

PROJECT="$HOME/Downloads/phygo"
DL="$HOME/Downloads"

if [ ! -d "$PROJECT" ]; then
  echo "ABORT: $PROJECT not found. Adjust PROJECT= at the top of this script."
  exit 1
fi

newest() {
  # $1 = glob pattern (relative to $DL)
  local f
  f=$(ls -t $DL/$1 2>/dev/null | head -1)
  if [ -z "$f" ]; then
    echo "ABORT: no file matching '$1' found in $DL — did the download finish?"
    exit 1
  fi
  echo "$f"
}

FIELDS=$(newest "physiologyFields*.ts")
ROUTE=$(newest "physiology_route*.ts")
PAGE=$(newest "physiology_page*.tsx")
PATCHER=$(newest "apply_physiology_ui*.py")
SEARCH=$(newest "route*.ts")

echo "Using:"
echo "  fields  -> $FIELDS"
echo "  api     -> $ROUTE"
echo "  page    -> $PAGE"
echo "  patcher -> $PATCHER"
echo "  search  -> $SEARCH"
echo ""

mkdir -p "$PROJECT/lib"
mkdir -p "$PROJECT/app/api/physiology"
mkdir -p "$PROJECT/app/dashboard/physiology"
mkdir -p "$PROJECT/app/api/search"

cp "$FIELDS" "$PROJECT/lib/physiologyFields.ts"
cp "$ROUTE" "$PROJECT/app/api/physiology/route.ts"
cp "$PAGE" "$PROJECT/app/dashboard/physiology/page.tsx"
cp "$SEARCH" "$PROJECT/app/api/search/route.ts"
cp "$PATCHER" "$PROJECT/apply_physiology_ui.py"

echo "Files copied. Running the i18n/navbar patch..."
cd "$PROJECT"
python3 apply_physiology_ui.py

echo ""
echo "All done. Now stop the dev server (Ctrl+C) and run: npm run dev"
