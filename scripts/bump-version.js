/**
 * Bump extension version across both manifests and package.json.
 *
 * Usage:
 *   node scripts/bump-version.js          # patch: 1.1.0 → 1.1.1
 *   node scripts/bump-version.js patch    # patch: 1.1.0 → 1.1.1
 *   node scripts/bump-version.js minor    # minor: 1.1.0 → 1.2.0
 *   node scripts/bump-version.js major    # major: 1.1.0 → 2.0.0
 *
 * Aborts if the three files disagree on the current version.
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const TARGETS = [
  { label: "manifest.chrome.json", path: join(ROOT, "manifest.chrome.json") },
  { label: "manifest.firefox.json", path: join(ROOT, "manifest.firefox.json") },
  { label: "package.json", path: join(ROOT, "package.json") },
];

const bumpType = process.argv[2] || "patch";

if (!["patch", "minor", "major"].includes(bumpType)) {
  console.error(`Invalid bump type: "${bumpType}". Use patch, minor, or major.`);
  process.exit(1);
}

function bumpVersion(version, type) {
  const parts = version.split(".").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid semver: "${version}"`);
  }
  const [major, minor, patch] = parts;
  switch (type) {
    case "major": return `${major + 1}.0.0`;
    case "minor": return `${major}.${minor + 1}.0`;
    case "patch": return `${major}.${minor}.${patch + 1}`;
  }
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function writeJson(path, content) {
  writeFileSync(path, JSON.stringify(content, null, 2) + "\n");
}

const versions = TARGETS.map((t) => ({ ...t, version: readJson(t.path).version }));

const unique = [...new Set(versions.map((v) => v.version))];
if (unique.length !== 1) {
  console.error("Version drift detected — refusing to bump:");
  for (const v of versions) console.error(`  ${v.label}: ${v.version}`);
  console.error("Reconcile the files manually, then re-run.");
  process.exit(1);
}

const oldVersion = unique[0];
const newVersion = bumpVersion(oldVersion, bumpType);

for (const t of TARGETS) {
  const json = readJson(t.path);
  json.version = newVersion;
  writeJson(t.path, json);
  console.log(`  Updated ${t.label}`);
}

console.log(`${bumpType}: ${oldVersion} → ${newVersion}`);
