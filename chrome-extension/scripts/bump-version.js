/**
 * Bump extension version in manifest.json (source of truth) and sync to package.json.
 *
 * Usage:
 *   node scripts/bump-version.js          # patch: 1.1.0 → 1.1.1
 *   node scripts/bump-version.js patch    # patch: 1.1.0 → 1.1.1
 *   node scripts/bump-version.js minor    # minor: 1.1.0 → 1.2.0
 *   node scripts/bump-version.js major    # major: 1.1.0 → 2.0.0
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const MANIFEST_PATH = join(ROOT, "manifest.json");
const PACKAGE_PATH = join(ROOT, "package.json");

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

function updateJsonFile(filePath, newVersion) {
  const content = JSON.parse(readFileSync(filePath, "utf-8"));
  const oldVersion = content.version;
  content.version = newVersion;
  writeFileSync(filePath, JSON.stringify(content, null, 2) + "\n");
  return oldVersion;
}

// Read current version from manifest.json
const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf-8"));
const oldVersion = manifest.version;
const newVersion = bumpVersion(oldVersion, bumpType);

// Update both files
updateJsonFile(MANIFEST_PATH, newVersion);
updateJsonFile(PACKAGE_PATH, newVersion);

console.log(`${bumpType}: ${oldVersion} → ${newVersion}`);
console.log(`  Updated manifest.json`);
console.log(`  Updated package.json`);
