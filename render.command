#!/bin/zsh
cd "$(dirname "$0")"

clean_path() {
  local raw="$1"
  raw="${raw#"${raw%%[![:space:]]*}"}"
  raw="${raw%"${raw##*[![:space:]]}"}"
  raw="${raw#\"}"
  raw="${raw%\"}"
  raw="${raw#\'}"
  raw="${raw%\'}"
  raw="${raw//\\ / }"
  print -r -- "$raw"
}

echo "CSV path: press Return for input/script.csv, or drag a CSV file here."
read -r CSV_PATH
CSV_PATH="$(clean_path "$CSV_PATH")"

echo
echo "Audio path: press Return for input/audio.m4a, or drag an audio file here."
read -r AUDIO_PATH
AUDIO_PATH="$(clean_path "$AUDIO_PATH")"

echo
echo "Output path: press Return for output/broadcast-popup.mp4."
read -r OUTPUT_PATH
OUTPUT_PATH="$(clean_path "$OUTPUT_PATH")"

if [[ -z "$CSV_PATH" ]]; then
  CSV_PATH="input/script.csv"
fi

if [[ -z "$AUDIO_PATH" ]]; then
  AUDIO_PATH="input/audio.m4a"
fi

if [[ -z "$OUTPUT_PATH" ]]; then
  OUTPUT_PATH="output/broadcast-popup.mp4"
fi

npm run render -- "$CSV_PATH" "$AUDIO_PATH" "$OUTPUT_PATH"
echo
echo "Done. Press Return to close."
read
