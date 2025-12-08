// scripts/to-csv.js
import fs from "node:fs"

const b = JSON.parse(fs.readFileSync("dns-config/industry-subdomains.json", "utf-8"))
const lines = ["Host,Type,Value,TTL"]
for (const r of b.records) {
  const host = r.subdomain === "@" ? "@" : r.subdomain
  lines.push(`${host},A,${b.ip},${b.ttl}`)
}
fs.writeFileSync("dns-config/industry-subdomains.csv", lines.join("\n"))
console.log("CSV written: dns-config/industry-subdomains.csv")
