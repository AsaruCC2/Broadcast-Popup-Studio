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

echo "Timed text path: press Return for input/timed-text.txt, or drag an .srt/.vtt/.txt file here."
read -r INPUT_PATH
INPUT_PATH="$(clean_path "$INPUT_PATH")"

echo
echo "CSV output path: press Return for input/script.csv."
read -r OUTPUT_PATH
OUTPUT_PATH="$(clean_path "$OUTPUT_PATH")"

if [[ -z "$INPUT_PATH" ]]; then
  INPUT_PATH="input/timed-text.txt"
fi

if [[ -z "$OUTPUT_PATH" ]]; then
  OUTPUT_PATH="input/script.csv"
fi

npm run convert -- "$INPUT_PATH" "$OUTPUT_PATH"
echo
echo "Done. Press Return to close."
read
