#!/bin/sh
# Завантажує ассети з Figma MCP.  fetch.sh <prefix> out/path.svg:hash ...
P="$1"; shift
for a in "$@"; do out="${a%:*}"; h="${a##*:}"; mkdir -p "$(dirname "$out")"
  curl -sL -o "$out" "$P/$h"; printf "%8s  %s\n" "$(wc -c <"$out" | tr -d ' ')" "$out"; done
