#!/usr/bin/env bash
# Plain-language gate for prose in src/content/docs and release notes (rules: CLAUDE.md "Plain language").
# Tier 1 must be empty; lines containing an entry from .style-allow are skipped.
# `--review` also prints Tier 2: phrases a person checks and keeps only if literal.
set -euo pipefail
cd "$(dirname "$0")/.."

# Release-wide notes (src/releases/<sprint>/<rc>/notes.md) are in scope; the
# per-repo fragments under components/ are exempt, like api/.
prose=$({ find src/content/docs -name '*.md*' -not -path '*/api/*' -print0
  find src/releases -path 'src/releases/*/rc*/notes.md' -print0; } |
  xargs -0 awk '/^[[:space:]]*```/{c=!c;next} !c && !/^import /{print FILENAME":"FNR": "$0}')

tier1='\bdigital(ly)?[ -]dark(ness)?\b|\brails?\b|\bfluidic\b|economic engine|\bclos(e|es|ing) the gap\b|\bunlock(s|ed|ing)?\b|\bleverag(e|es|ed|ing)\b|\bisn.t just\b|\bnot just\b|\bcrisis\b|\binvisib(le|ility)\b|\bstark\b|\bthrottled\b|structurally, not|proof is concrete|not a theoretical|\bheart of\b|at (its|the) (core|heart)|\bjourney\b|Blue[- ]Dott(ed|ing)|\bsolved\b|\bseamless|\bempower|\bharness|game.?chang|load-bearing|non-negotiable|by construction'
tier2='\bnot [a-z ]{1,40}(—|–)|— not\b|\bnot only\b|\bnot [a-z ]+, but\b|\bby design\b|\bdeliberate(ly)?\b|\bfoundation(al)?\b|\becosystem\b|\bsurfac(e|es|ed|ing)\b|\bat scale\b|\bmeaningful\b|\bdensity\b'

hits=$(grep -iE "$tier1" <<<"$prose" | grep -vFf <(grep -v '^#' .style-allow | sed '/^$/d') || true)

if [[ "${1:-}" == "--review" ]]; then
  echo "== Tier 2 (review each) =="
  grep -iE "$tier2" <<<"$prose" || true
fi

if [[ -n "$hits" ]]; then
  echo "== Tier 1 (must fix): $(wc -l <<<"$hits" | tr -d ' ') lines =="
  echo "$hits"
  exit 1
fi
echo "check:style: Tier 1 clean"
