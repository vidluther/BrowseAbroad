#!/usr/bin/env node
/**
 * Build script for BrowseAbroad extensions.
 * Copies src/ and icons/ into dist/<platform>/ with the correct manifest.
 *
 * Usage:
 *   node scripts/build.js chrome|firefox|all [--watch]
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const args = process.argv.slice(2);
const platform = args[0] || 'all';
const watch = args.includes('--watch');
const doZip = args.includes('--zip');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function build(platform) {
  const outDir = path.join(DIST, platform);
  console.log(`Building ${platform} extension → ${outDir}`);

  // Clean output
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  // Copy manifest
  const manifestSrc = path.join(ROOT, `manifest.${platform}.json`);
  if (!fs.existsSync(manifestSrc)) {
    console.error(`Error: ${manifestSrc} not found`);
    process.exit(1);
  }
  fs.copyFileSync(manifestSrc, path.join(outDir, 'manifest.json'));

  // Copy source
  copyDir(path.join(ROOT, 'src'), path.join(outDir, 'src'));

  // Copy icons
  copyDir(path.join(ROOT, 'icons'), path.join(outDir, 'icons'));

  console.log(`  Done: ${outDir}`);
}

function zip(platform) {
  const outDir = path.join(DIST, platform);
  const ext = platform === 'firefox' ? 'xpi' : 'zip';
  const zipFile = path.join(DIST, `browseabroad-${platform}.${ext}`);

  console.log(`Packaging ${platform} → ${zipFile}`);
  execSync(`cd "${outDir}" && zip -r "${zipFile}" ./`, { stdio: 'pipe' });
  console.log(`  Done: ${zipFile}`);
}

if (watch) {
  console.log(`Watching for changes (${platform === 'all' ? 'chrome + firefox' : platform})...`);

  const buildAll = () => {
    if (platform === 'all') {
      build('chrome');
      build('firefox');
    } else {
      build(platform);
    }
  };

  buildAll();

  const dirsToWatch = [path.join(ROOT, 'src'), path.join(ROOT, 'icons')];
  if (platform === 'all') {
    dirsToWatch.push(path.join(ROOT, 'manifest.chrome.json'), path.join(ROOT, 'manifest.firefox.json'));
  } else {
    dirsToWatch.push(path.join(ROOT, `manifest.${platform}.json`));
  }

  for (const dir of dirsToWatch) {
    fs.watch(dir, { recursive: true }, () => {
      console.log(`\nChange detected, rebuilding...`);
      buildAll();
    });
  }
  console.log('Press Ctrl+C to stop.');
} else {
  if (platform === 'all') {
    build('chrome');
    build('firefox');
    if (doZip) {
      zip('chrome');
      zip('firefox');
    }
  } else {
    build(platform);
    if (doZip) {
      zip(platform);
    }
  }
}
