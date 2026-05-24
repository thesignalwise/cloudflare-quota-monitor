import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));
const distDir = join(root, 'dist');
const packageName = `cloudflare-quota-monitor-${manifest.version}.zip`;
const packagePath = join(distDir, packageName);

const entries = [
  'manifest.json',
  'popup.html',
  'popup.js',
  'dashboard.html',
  'dashboard.js',
  'options.html',
  'webdav.html',
  'services.html',
  'schedule.html',
  'about.html',
  'privacy.html',
  'release-notes.html',
  'i18n.js',
  'options.js',
  'background.js',
  'style.css',
  'icons',
  '_locales'
];

mkdirSync(distDir, { recursive: true });
if (existsSync(packagePath)) {
  rmSync(packagePath);
}

execFileSync('zip', ['-X', '-r', packagePath, ...entries], {
  cwd: root,
  stdio: 'inherit'
});

console.log(`Created ${packagePath}`);
