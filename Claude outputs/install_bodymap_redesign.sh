#!/bin/bash
set -e
PROJECT="$HOME/Downloads/phygo"
DL="$HOME/Downloads"
if [ ! -d "$PROJECT" ]; then
  echo "ABORT: $PROJECT not found."
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
SCRIPT_FILE=$(newest "apply_bodymap_hero_redesign*.py")
echo "Using: $SCRIPT_FILE"
cp "$SCRIPT_FILE" "$PROJECT/apply_bodymap_hero_redesign.py"
cd "$PROJECT"
python3 apply_bodymap_hero_redesign.py
echo ""
echo "All done. Now stop the dev server (Ctrl+C) and run: npm run dev"
