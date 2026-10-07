#!/usr/bin/env bash
# Lighthouse, 3 runs per page, median performance score kept as lighthouse/<name>.json.
# Uses installed Google Chrome (CHROME_PATH to override). Server must be running (npm start).
#   bash scripts/lighthouse.sh [base-url]        ONLY=desktop / ONLY=mobile-home to filter, RUNS=n
set -uo pipefail
cd "$(dirname "$0")/.."
BASE=${1:-http://localhost:3000}
export CHROME_PATH=${CHROME_PATH:-"C:/Program Files/Google/Chrome/Application/chrome.exe"}
RUNS=${RUNS:-3}
mkdir -p lighthouse
for spec in "mobile-home|/|" "mobile-service|/services/real-estate|" "desktop-home|/|--preset=desktop" "desktop-service|/services/real-estate|--preset=desktop"; do
  [[ -n "${ONLY:-}" && "$spec" != ${ONLY}* ]] && continue
  IFS='|' read -r name path extra <<< "$spec"
  for i in $(seq 1 "$RUNS"); do
    npx --yes lighthouse@12 "$BASE$path" $extra --quiet --chrome-flags="--headless=new" \
      --output=json --output-path="lighthouse/$name.run$i.json" >/dev/null 2>&1 || echo "$name run $i failed"
  done
  node -e '
    const fs=require("fs");const [name,runs]=process.argv.slice(1);
    const rs=[];for(let i=1;i<=+runs;i++){const f=`lighthouse/${name}.run${i}.json`;if(fs.existsSync(f)){rs.push({f,r:JSON.parse(fs.readFileSync(f))});}}
    rs.sort((a,b)=>a.r.categories.performance.score-b.r.categories.performance.score);
    const m=rs[rs.length>>1];fs.copyFileSync(m.f,`lighthouse/${name}.json`);rs.forEach(x=>fs.unlinkSync(x.f));
    const a=m.r.audits,c=m.r.categories;
    console.log(name.padEnd(16),"perf runs",rs.map(x=>Math.round(x.r.categories.performance.score*100)).join("/"),
      "| median: perf",Math.round(c.performance.score*100),"a11y",Math.round(c.accessibility.score*100),"bp",Math.round(c["best-practices"].score*100),"seo",Math.round(c.seo.score*100),
      "| FCP",a["first-contentful-paint"].displayValue,"LCP",a["largest-contentful-paint"].displayValue,"TBT",a["total-blocking-time"].displayValue,"CLS",a["cumulative-layout-shift"].displayValue,"SI",a["speed-index"].displayValue);
  ' "$name" "$RUNS"
done
