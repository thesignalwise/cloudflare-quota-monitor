import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const outDir = join(process.cwd(), 'dist', 'site');
const files = [
  'assets',
  'index.html',
  'llms.txt',
  'robots.txt',
  'site.css',
  'site.webmanifest',
  'sitemap.xml',
  'terms.html',
  'website-privacy.html',
  'zh-CN',
];

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

for (const file of files) {
  await cp(join(process.cwd(), file), join(outDir, file), { recursive: true });
}

await writeFile(
  join(outDir, '_headers'),
  `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/robots.txt
  Content-Type: text/plain; charset=utf-8

/llms.txt
  Content-Type: text/plain; charset=utf-8

/site.webmanifest
  Content-Type: application/manifest+json; charset=utf-8
`,
);

await writeFile(
  join(outDir, '_redirects'),
  `/privacy /website-privacy.html 301
/zh-CN/privacy.html /zh-CN/privacy.html 200
`,
);
