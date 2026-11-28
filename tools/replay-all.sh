#!/bin/bash
# Прогон записанных поз (e2e-runs/*/pose.jsonl) через движок для всех упражнений теста.
# VISKS="1 0.6" — второй прогон имитирует тёмную одежду (видимость таза, колен, щиколоток × 0.6).
cd "$(dirname "$0")/.."
RUNS=(e2e-runs/iphone-wi-2026-11-26T16-46-50 e2e-runs/iphone-wi-2026-11-26T17-13-28 e2e-runs/iphone-wi-2026-11-26T17-55-05 e2e-runs/iphone-wi-2026-11-26T21-07-13 e2e-runs/iphone-wi-2026-11-26T21-25-09)
for k in balance_r:15 balance_l:15 high_knees:15 squats:20 jumping_jack:20; do
  K=${k%:*}; C=${k#*:}
  for v in ${VISKS:-1 0.6}; do
    printf "%-13s VISK=%-4s " "$K" "$v"
    KEY=$K CAP=$C AGE=12-15 VISK=$v node tools/replay-pose.mjs "${RUNS[@]}" 2>&1 | awk '{printf "%s ", ($4==""?"-":$4)}'
    echo
  done
done
