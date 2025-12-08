// scripts/dns-diff.js
import fs from "node:fs"

const baseline = JSON.parse(fs.readFileSync("dns-config/industry-subdomains.json", "utf-8"))
const expected = new Set(baseline.records.map(r => `${r.subdomain}.${baseline.domain}`))

// 模拟从控制台导出 CSV 后转为数组
const actual = new Set([
  // 在此填入你当前线上真实域名清单
  "agr.0379.world",
  "fb.0379.world"
  // ...
])

const missing = [...expected].filter(d => !actual.has(d))
const extra = [...actual].filter(d => !expected.has(d))

console.log("Missing records:", missing)
console.log("Extra records:", extra)
process.exit(missing.length === 0 && extra.length === 0 ? 0 : 1)
