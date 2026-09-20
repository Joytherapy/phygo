#!/bin/bash
# Deepens the "Medicina dello Sport" section:
# - overwrites app/dashboard/sports-medicine/page.tsx (adds the new
#   "rehabilitation_programming" category to the display order)
# - patches lib/i18n/uiStrings.ts to add that category's label in 4 languages
#
# IMPORTANT: run install_sports_medicine.sh FIRST if you haven't already —
# this script assumes the Sports Medicine section already exists.
#
# The new database content (8 new concepts: cervical spine clearance,
# stinger/seizure management, maxillofacial/dental/eye trauma, compartment
# syndrome, and 3 new "rehabilitation programming" concepts on phased
# rehab / load management / plyometric progression) has ALREADY been added
# directly to the database — this script only updates the app's code.
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

PAGE=$(newest "sports_medicine_page*.tsx")
PATCHER=$(newest "apply_sports_medicine_rehab_expansion*.py")

echo "Using:"
echo "  page    -> $PAGE"
echo "  patcher -> $PATCHER"
echo ""

cp "$PAGE" "$PROJECT/app/dashboard/sports-medicine/page.tsx"
cp "$PATCHER" "$PROJECT/apply_sports_medicine_rehab_expansion.py"

echo "Files copied. Running the i18n patch..."
cd "$PROJECT"
python3 apply_sports_medicine_rehab_expansion.py

echo ""
echo "All done. Now stop the dev server (Ctrl+C) and run: npm run dev"
