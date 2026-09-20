#!/bin/bash
# Finds the just-downloaded apply_physiology_crosslinks.py in ~/Downloads
# (handling a possible "(1)" suffix), copies it into the phygo project root,
# and runs it.
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

SCRIPT=$(newest "apply_physiology_crosslinks*.py")
echo "Using: $SCRIPT"

cp "$SCRIPT" "$PROJECT/apply_physiology_crosslinks.py"

echo "Copied. Running the cross-link patch..."
cd "$PROJECT"
python3 apply_physiology_crosslinks.py

echo ""
echo "All done. Now stop the dev server (Ctrl+C) and run: npm run dev"
