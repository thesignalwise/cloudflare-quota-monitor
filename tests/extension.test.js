const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const rootDir = path.resolve(__dirname, '..');
const env = loadEnv(path.join(rootDir, '.env'));

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return fs.readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .reduce((values, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        return values;
      }

      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) {
        return values;
      }

      const [, key, rawValue] = match;
      values[key] = rawValue.replace(/^['"]|['"]$/g, '');
      return values;
    }, {});
}

function readJson(fileName) {
  return JSON.parse(fs.readFileSync(path.join(rootDir, fileName), 'utf8'));
}

function readText(fileName) {
  return fs.readFileSync(path.join(rootDir, fileName), 'utf8');
}

function extractRuntimeDictionaries() {
  const source = readText('i18n.js');
  const start = source.indexOf('const DICTIONARIES = ');
  const open = source.indexOf('{', start);
  let depth = 0;
  let quote = null;
  let escape = false;

  for (let i = open; i < source.length; i += 1) {
    const char = source[i];
    if (quote) {
      if (escape) {
        escape = false;
      } else if (char === '\\') {
        escape = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }

    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return Function(`return (${source.slice(open, i + 1)});`)();
      }
    }
  }

  throw new Error('Could not extract runtime dictionaries');
}

function decodeHtmlText(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function collectLocalizableHtmlText(files) {
  const stableNativeLabels = /^(简体中文|繁體中文|English|日本語|한국어)$/;
  const properNouns = new Set([
    'Workers',
    'GraphQL',
    'Pages',
    'REST',
    'KV',
    'D1',
    'R2',
    'Queues',
    'Hyperdrive',
    'Browser Run',
    'Workers Logs',
    'Analytics Engine',
    'Workflows',
    'Workers AI',
    'Durable Objects',
    'MV3',
    'Account Analytics: Read',
    'User Details: Read · Memberships: Read',
    'Cloudflare Pages: Read · Workers Scripts: Read · Workers KV Storage: Read · Workers R2 Storage: Read · D1: Read · Queues: Read · Hyperdrive: Read · Workers AI: Read · Zero Trust: Read'
  ]);
  const texts = new Map();
  const addText = (rawValue, source) => {
    const text = decodeHtmlText(rawValue.replace(/\s+/g, ' '));
    if (!text || /^v?\d+\.\d+\.\d+$/.test(text) || /^\d+$/.test(text)) return;
    if (!/[A-Za-z]/.test(text) || stableNativeLabels.test(text) || properNouns.has(text)) return;
    if (!texts.has(text)) texts.set(text, new Set());
    texts.get(text).add(source);
  };

  files.forEach(file => {
    const html = readText(file)
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<svg[\s\S]*?<\/svg>/gi, '');

    [...html.matchAll(/<title>([^<>]+)<\/title>|>([^<>]+)</g)].forEach(match => {
      addText(match[1] || match[2], file);
    });

    ['placeholder', 'aria-label', 'title'].forEach(attribute => {
      const regex = new RegExp(`${attribute}=["']([^"']+)["']`, 'gi');
      [...html.matchAll(regex)].forEach(match => addText(match[1], `${file}@${attribute}`));
    });
  });

  return texts;
}

function assertFile(fileName) {
  assert.equal(fs.existsSync(path.join(rootDir, fileName)), true, `${fileName} should exist`);
}

function requiredEnv(name) {
  return process.env[name] || env[name] || '';
}

async function cloudflareGraphql(token, query, variables) {
  const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, variables })
  });
  const body = await response.json();
  assert.equal(response.ok, true, JSON.stringify(body.errors || body));
  assert.equal(Array.isArray(body.errors), false, JSON.stringify(body.errors || []));
  return body.data;
}

async function cloudflareApi(token, pathName) {
  const response = await fetch(`https://api.cloudflare.com/client/v4${pathName}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const body = await response.json();
  assert.equal(response.ok, true, JSON.stringify(body.errors || body));
  assert.equal(body.success, true, JSON.stringify(body.errors || body));
  return body;
}

function sumGroups(groups, reader) {
  return (groups || []).reduce((total, group) => {
    const value = Number(reader(group));
    return total + (Number.isFinite(value) ? value : 0);
  }, 0);
}

test('manifest exposes the expected Chrome extension contract', () => {
  const manifest = readJson('manifest.json');
  const packageJson = readJson('package.json');

  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.version, '0.4.0');
  assert.equal(packageJson.version, manifest.version);
  assert.equal(manifest.default_locale, 'en');
  assert.equal(manifest.name, '__MSG_extName__');
  assert.equal(manifest.description, '__MSG_extDescription__');
  assert.equal(manifest.action.default_popup, 'popup.html');
  assert.equal(manifest.options_ui.page, 'options.html');
  assert.equal(manifest.background.service_worker, 'background.js');
  assert.deepEqual(manifest.permissions.sort(), ['alarms', 'notifications', 'storage'].sort());
  assert.deepEqual(manifest.host_permissions, ['https://api.cloudflare.com/*']);
  assert.equal(manifest.optional_host_permissions, undefined);

  [
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
    'icons/icon16.png',
    'icons/icon48.png',
    'icons/icon128.png',
    '_locales/en/messages.json',
    '_locales/zh_CN/messages.json',
    '_locales/zh_TW/messages.json',
    '_locales/ja/messages.json',
    '_locales/ko/messages.json'
  ].forEach(assertFile);
});

test('HTML pages use local assets and keep required extension mount points', () => {
  const pages = [
    {
      file: 'popup.html',
      ids: ['content', 'refreshBtn', 'status', 'focusStrip', 'cards', 'settingsBtn', 'dashboardBtn', 'topPercent']
    },
    {
      file: 'dashboard.html',
      ids: ['dashboardTitle', 'dashboardSubtitle', 'dashboardAccountContext', 'refreshDashboard', 'dashboardSummary', 'dashboard-content', 'cardViewBtn', 'listViewBtn', 'dashboardRefreshStatus', 'dashboardRefreshTitle', 'dashboardRefreshDetail', 'dashboardRefreshProgress', 'chartModal', 'chartModalCanvas', 'chartModalClose']
    },
    {
      file: 'options.html',
      ids: ['profileSelect', 'profileLabel', 'accountProfileList', 'newProfileBtn', 'deleteProfileBtn', 'apiToken', 'accountId', 'saveBtn', 'testApiBtn', 'apiTestPanel', 'apiTestPanelState', 'apiTestSummary', 'apiCapabilityGrid', 'msg']
    },
    {
      file: 'webdav.html',
      ids: ['config-file-settings', 'configFileInput', 'exportConfigBtn', 'importConfigBtn', 'msg']
    },
    {
      file: 'services.html',
      ids: ['monitored-services']
    },
    {
      file: 'schedule.html',
      ids: ['syncSchedule', 'sync-log-settings', 'syncLogList', 'syncLogRefreshBtn']
    },
    {
      file: 'about.html',
      ids: ['about-settings', 'aboutVersion']
    },
    {
      file: 'privacy.html',
      ids: ['headerVersion']
    },
    {
      file: 'release-notes.html',
      ids: ['release-notes']
    }
  ];
  const expectedSidebarOrder = [
    'dashboard.html',
    'options.html',
    'services.html',
    'schedule.html',
    'webdav.html',
    'release-notes.html',
    'privacy.html',
    'about.html'
  ];

  pages.forEach(page => {
    const html = readText(page.file);
    const remoteScriptsOrStyles = [...html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)=["']([^"']+)["']/gi)]
      .map(match => match[1])
      .filter(asset => /^https?:\/\//i.test(asset));

    assert.deepEqual(remoteScriptsOrStyles, [], `${page.file} should not load remote scripts or styles`);
    page.ids.forEach(id => assert.match(html, new RegExp(`id=["']${id}["']`), `${page.file} should include #${id}`));
    assert.match(html, /<script src=["']i18n\.js["']><\/script>/, `${page.file} should load i18n.js`);

    if (page.file !== 'popup.html') {
      assert.match(html, /class=["'][^"']*settings-nav-item/, `${page.file} should use the shared sidebar navigation`);
      const sidebarLinks = [...html.matchAll(/<a\s+class=["'][^"']*\bsettings-nav-item\b[^"']*["']\s+href=["']([^"']+)["']/g)]
        .map(match => match[1]);
      const activeLinks = [...html.matchAll(/<a\s+class=["'][^"']*\bsettings-nav-item\b[^"']*\bis-active\b[^"']*["']\s+href=["']([^"']+)["']/g)]
        .map(match => match[1]);

      assert.deepEqual(sidebarLinks, expectedSidebarOrder, `${page.file} should keep the sidebar order`);
      assert.deepEqual(activeLinks, [page.file], `${page.file} should mark only its own sidebar link active`);
      assert.match(html, /href=["']privacy\.html["']/, `${page.file} should link to Privacy Policy`);
      assert.match(html, /href=["']release-notes\.html["']/, `${page.file} should link to Release Notes`);
      assert.match(html, /href=["']https:\/\/cloudflare-quota-monitor\.thesignalwise\.com\/["']/, `${page.file} should link to the official website`);
      assert.match(html, /href=["']https:\/\/github\.com\/thesignalwise\/cloudflare-quota-monitor["']/, `${page.file} should link to GitHub`);
      assert.match(html, /class=["'][^"']*\bnav-locale\b[^"']*["'][^>]*id=["']language-settings["']/, `${page.file} should move language settings into the sidebar footer`);
      assert.match(html, /id=["']localeMenuBtn["'][^>]*aria-haspopup=["']menu["'][^>]*aria-expanded=["']false["']/, `${page.file} should use a compact language menu button`);
      const localeMenuButton = html.match(/<button\s+id=["']localeMenuBtn["'][\s\S]*?<\/button>/)?.[0] || '';
      assert.match(localeMenuButton, /locale-trigger-code/, `${page.file} should show a language abbreviation button`);
      assert.doesNotMatch(localeMenuButton, /<svg\b/, `${page.file} should not use a globe icon for the language button`);
      assert.equal([...html.matchAll(/data-locale-option=/g)].length, 6, `${page.file} should include all locale options in the menu`);
      assert.match(html, /class=["'][^"']*\bnav-footer-link--site\b/, `${page.file} should style the website footer link separately`);
      const siteFooterLink = html.match(/<a\s+class=["'][^"']*\bnav-footer-link--site\b[\s\S]*?<\/a>/)?.[0] || '';
      assert.match(siteFooterLink, /nav-footer-icon--home/, `${page.file} should use an icon-font home website icon`);
      assert.doesNotMatch(siteFooterLink, /<svg\b/, `${page.file} should not use SVG for the website icon`);
      assert.match(html, /class=["'][^"']*\bnav-footer-link--github\b/, `${page.file} should style the GitHub footer link separately`);
    }
  });

  assert.doesNotMatch(readText('dashboard.html'), /top-nav__link/, 'dashboard should not use the standalone top navigation');

  const dashboardHtml = readText('dashboard.html');
  [
    ['auto', '🌐', 'Follow browser'],
    ['zh-CN', '🇨🇳', '简体中文'],
    ['zh-TW', '🇭🇰', '繁體中文'],
    ['en', '🇺🇸', 'English'],
    ['ja', '🇯🇵', '日本語'],
    ['ko', '🇰🇷', '한국어']
  ].forEach(([value, flag, label]) => {
    assert.match(
      dashboardHtml,
      new RegExp(`data-locale-option=["']${value}["'][^>]*>${flag} <span>${label}</span></button>`),
      `language menu should include ${flag} ${label}`
    );
  });
  assert.doesNotMatch(readText('about.html'), /id=["']language-settings["'][\s\S]*<h3>Language<\/h3>/, 'about page should not keep a separate language settings card');
});

test('JavaScript files pass syntax checks', () => {
  ['background.js', 'popup.js', 'dashboard.js', 'options.js', 'i18n.js'].forEach(file => {
    execFileSync(process.execPath, ['--check', path.join(rootDir, file)], { stdio: 'pipe' });
  });
});

test('i18n supports the required locales', () => {
  const source = readText('i18n.js');
  ['en', 'zh-CN', 'zh-TW', 'ja', 'ko'].forEach(locale => {
    assert.match(source, new RegExp(`['"]${locale}['"]`), `missing runtime locale ${locale}`);
  });

  ['en', 'zh_CN', 'zh_TW', 'ja', 'ko'].forEach(locale => {
    const messages = readJson(`_locales/${locale}/messages.json`);
    assert.equal(typeof messages.extName.message, 'string');
    assert.equal(typeof messages.extDescription.message, 'string');
  });
});

test('runtime i18n dictionaries cover localizable HTML text', () => {
  const dictionaries = extractRuntimeDictionaries();
  const localizableText = collectLocalizableHtmlText([
    'popup.html',
    'dashboard.html',
    'options.html',
    'webdav.html',
    'services.html',
    'schedule.html',
    'about.html',
    'privacy.html',
    'release-notes.html'
  ]);

  ['zh-CN', 'zh-TW', 'ja', 'ko'].forEach(locale => {
    const missing = [...localizableText.entries()]
      .filter(([text]) => !Object.hasOwn(dictionaries[locale], text))
      .map(([text, sources]) => `${text} (${[...sources].join(', ')})`);

    assert.deepEqual(missing, [], `${locale} should translate localizable HTML text`);
  });
});

test('runtime i18n dictionaries cover multi-account dynamic labels', () => {
  const dictionaries = extractRuntimeDictionaries();
  const dynamicLabels = [
    'Critical',
    'Watch',
    'Error',
    'Healthy',
    'Cloudflare account',
    'New account',
    'Default account',
    'No account data',
    'No usage data',
    'No sync',
    'Just now',
    'Critical accounts',
    'Watch accounts',
    'Sync errors',
    'Monitored accounts',
    'Needs attention',
    'Account health',
    'View details',
    'Open account details',
    'Account overview',
    'Account details',
    'Service-level quota details',
    'Viewing account',
    'Back to overview',
    'Setup needed',
    'Compute & Runtime',
    'Storage & Databases',
    'Messaging & Data Plane',
    'Analytics & Logs',
    'tracked metrics',
    'Used',
    'Not available',
    'API metric',
    'Monthly',
    'Total'
  ];

  ['zh-CN', 'zh-TW', 'ja', 'ko'].forEach(locale => {
    const missing = dynamicLabels.filter(label => !Object.hasOwn(dictionaries[locale], label));
    assert.deepEqual(missing, [], `${locale} should translate multi-account dynamic labels`);
  });

  assert.match(readText('popup.js'), /Intl\.RelativeTimeFormat/, 'popup should localize relative sync times');
  assert.match(readText('dashboard.js'), /Intl\.RelativeTimeFormat/, 'dashboard should localize relative sync times');
  assert.match(readText('popup.js'), /quota-i18n-ready/, 'popup should re-render after runtime i18n is ready');
  assert.match(readText('dashboard.js'), /quota-i18n-ready/, 'dashboard should re-render after runtime i18n is ready');
});

test('background worker defines the expected quota and message surface', () => {
  const source = readText('background.js');
  const quotaKeys = [
    'workers',
    'pages',
    'd1Reads',
    'd1Writes',
    'kvReads',
    'kvWrites',
    'kvDeletes',
    'kvLists',
    'r2Storage',
    'r2AOps',
    'r2BOps',
    'queues',
    'hyperdrive',
    'browser',
    'logs',
    'analyticsWrites',
    'analyticsReads',
    'workflows',
    'ai',
    'durableObjectsRequests',
    'durableObjectsDuration',
    'durableObjectsRowsRead',
    'durableObjectsRowsWritten',
    'durableObjectsSqlStorage'
  ];

  quotaKeys.forEach(key => assert.match(source, new RegExp(`${key}:\\s*\\{`), `missing quota key ${key}`));
  assert.match(source, /message\.action === 'getQuotas'/);
  assert.match(source, /message\.action === 'getAccountOverview'/);
  assert.match(source, /message\.action === 'refreshQuotas'/);
  assert.match(source, /quotaCacheByProfile/);
  assert.match(source, /historyByProfile/);
  assert.match(source, /migrateLegacyMonitoringData/);
  assert.match(source, /chrome\.alarms\.create\('updateQuotas'/);
  assert.match(source, /chrome\.runtime\.onStartup\.addListener/);
  assert.match(source, /function ensureUpdateAlarm/);
  assert.match(source, /function recordSyncLog/);
  assert.match(source, /syncLogs/);
  assert.match(source, /updateQuotas\('scheduled'\)/);
  assert.match(source, /function upsertHistorySnapshot/, 'manual refresh should upsert today history instead of appending duplicate samples');
  assert.match(source, /await upsertHistorySnapshot\(result, now\)/, 'refresh response should wait for history cache writes');
  assert.match(source, /lastUpdated: now/, 'latest refresh timestamp should be cached with quota data');
});

test('background settings migration preserves legacy single-account cache data', async () => {
  const source = readText('background.js');
  const storageState = {
    settings: {
      apiToken: 'legacy-token',
      accountId: 'legacy-account'
    },
    quotas: {
      workers: { used: 123, limit: 100000, percent: 0.00123 }
    },
    history: [
      { timestamp: 1710000000000, quotas: { workers: { used: 100 } } }
    ],
    lastUpdated: 1710000000000
  };
  const context = {
    console,
    Date,
    Promise,
    Number,
    String,
    Boolean,
    Array,
    Object,
    Math,
    JSON,
    setTimeout,
    clearTimeout,
    fetch: async () => ({ json: async () => ({}), ok: true }),
    chrome: {
      storage: {
        local: {
          get(keys, callback) {
            if (Array.isArray(keys)) {
              callback(keys.reduce((result, key) => Object.assign(result, { [key]: storageState[key] }), {}));
              return;
            }
            if (keys && typeof keys === 'object') {
              callback(Object.keys(keys).reduce((result, key) => {
                result[key] = Object.prototype.hasOwnProperty.call(storageState, key) ? storageState[key] : keys[key];
                return result;
              }, {}));
              return;
            }
            callback({});
          },
          set(values, callback = () => {}) {
            Object.assign(storageState, values);
            callback();
          }
        }
      },
      alarms: {
        create() {},
        onAlarm: { addListener() {} }
      },
      runtime: {
        onInstalled: { addListener() {} },
        onStartup: { addListener() {} },
        onMessage: { addListener() {} }
      }
    }
  };

  vm.runInNewContext(source, context, { filename: 'background.js' });
  const settings = await context.loadSettings();
  const [profile] = settings.profiles;

  assert.equal(settings.schemaVersion, 3);
  assert.equal(profile.apiToken, 'legacy-token');
  assert.equal(profile.accountId, 'legacy-account');
  assert.equal(storageState.settings.schemaVersion, 3);
  assert.deepEqual(storageState.quotaCacheByProfile[profile.id].quotas, storageState.quotas);
  assert.deepEqual(storageState.historyByProfile[profile.id], storageState.history);
  assert.equal(storageState.quotaCacheByProfile[profile.id].lastUpdated, 1710000000000);
});

test('options page exposes API validation and capability checks', () => {
  const html = readText('options.html');
  const source = readText('options.js');
  const popupSource = readText('popup.js');

  assert.match(html, /id=["']testApiBtn["']/, 'API page should include a test button');
  assert.match(html, /id=["']profileSelect["']/, 'API page should expose account profile selection');
  assert.match(html, /id=["']newProfileBtn["']/, 'API page should allow adding account profiles');
  assert.match(html, /id=["']deleteProfileBtn["']/, 'API page should allow deleting account profiles');
  assert.match(source, /function normalizeSettings/, 'options should normalize legacy single-account settings into profiles');
  assert.match(source, /activeProfileId/, 'options should persist the active account profile');
  assert.match(html, /<details id=["']apiTestPanel["'] class=["']api-test-panel["']>/, 'API test results should be collapsed by default');
  assert.match(source, /apiTestPanelEl\.open = true/, 'API test results should expand after running a test');
  assert.match(popupSource, /chrome\.tabs\.create\(\{\s*url:\s*chrome\.runtime\.getURL\('options\.html'\)\s*\}\)/, 'popup API settings should open the full options page in a tab');
  assert.doesNotMatch(popupSource, /openOptionsPage/, 'popup API settings should not use the modal options surface');
  assert.match(source, /verifyToken/);
  assert.match(source, /verifyAccountAccess/);
  [
    'workersInvocationsAdaptive',
    'kvOperationsAdaptiveGroups',
    'd1AnalyticsAdaptiveGroups',
    'r2StorageAdaptiveGroups',
    'queueMessageOperationsAdaptiveGroups',
    'durableObjectsInvocationsAdaptiveGroups'
  ].forEach(dataset => assert.match(source, new RegExp(dataset), `missing API test for ${dataset}`));
});

test('privacy and release packaging surfaces are present', () => {
  const manifest = readJson('manifest.json');
  const packageJson = readJson('package.json');
  const privacyHtml = readText('privacy.html');
  const privacyMd = readText('PRIVACY.md');
  const packageScript = readText('scripts/package-extension.mjs');

  assert.equal(manifest.version, '0.4.0');
  assert.equal(packageJson.scripts.package, 'node scripts/package-extension.mjs');
  assert.match(privacyHtml, /Limited Use disclosure/);
  assert.match(privacyMd, /Chrome Web Store User Data Policy/);
  assert.match(readText('release-notes.html'), /<h3>v0\.4\.0<\/h3>/);
  assert.match(readText('release-notes.html'), /Released 2026-06-23/);
  assert.match(readText('release-notes.html'), /Multi-account monitoring/);
  assert.match(readText('release-notes.html'), /Account-level overview/);
  assert.match(readText('release-notes.html'), /Profile drilldown/);
  assert.match(readText('release-notes.html'), /<h3>v0\.3\.9<\/h3>/);
  assert.match(readText('release-notes.html'), /Released 2026-06-10/);
  assert.match(readText('release-notes.html'), /Cloudflare-aligned UI polish/);
  assert.match(readText('release-notes.html'), /Popup workflow cleanup/);
  assert.match(readText('release-notes.html'), /Sidebar language control/);
  assert.match(readText('release-notes.html'), /<h3>v0\.3\.8<\/h3>/);
  assert.match(readText('release-notes.html'), /Internationalization audit/);
  assert.match(readText('release-notes.html'), /Translation coverage guard/);
  assert.match(readText('release-notes.html'), /<h3>v0\.3\.7<\/h3>/);
  assert.match(readText('release-notes.html'), /Released 2026-06-07/);
  assert.match(readText('release-notes.html'), /Native language selector/);
  assert.match(readText('release-notes.html'), /Sidebar navigation order/);
  assert.match(readText('release-notes.html'), /Released 2026-06-01/);
  assert.match(readText('release-notes.html'), /Scheduled sync observability/);
  assert.match(packageScript, /privacy\.html/);
  assert.doesNotMatch(packageScript, /\.env/);
  assert.doesNotMatch(packageScript, /google-stitch/);
});

test('configuration import/export stays local and avoids broad host permissions', () => {
  const manifest = readJson('manifest.json');
  const source = readText('options.js');
  const html = readText('webdav.html');

  assert.equal(manifest.optional_host_permissions, undefined);
  assert.match(html, /Exported files include sensitive settings/);
  assert.match(html, /No network permission/);
  assert.match(source, /exportConfig/);
  assert.match(source, /importConfig/);
  assert.match(source, /downloadJson/);
  assert.match(source, /schemaVersion:\s*3/);
  assert.match(source, /profiles/);
  assert.match(source, /activeProfileId/);
  assert.match(source, /quotaCacheByProfile/);
  assert.match(source, /historyByProfile/);
  assert.match(source, /monitoringData/);
  assert.match(source, /quotas/);
  assert.match(source, /history/);
  assert.match(source, /lastUpdated/);
  assert.match(source, /syncLogs/);
  assert.match(source, /sanitizeSyncLogs/);
  assert.match(source, /sanitizeHistory/);
  assert.match(html, /dashboard history/);
  assert.doesNotMatch(source, /chrome\.permissions/);
  assert.doesNotMatch(source, /ensureWebdavHostPermission/);
  assert.doesNotMatch(source, /method:\s*'PUT'/);
  assert.doesNotMatch(source, /Basic \$\{btoa/);
});

test('usage dashboard uses percentage-based risk colors', () => {
  const source = readText('dashboard.js');
  const css = readText('style.css');

  assert.match(source, /function riskColorForPercent/, 'dashboard should map usage percentage to a risk color');
  assert.match(source, /--risk-color:\s*\$\{escapeHtml\(riskColor\)\}/, 'dashboard progress bars should receive metric-specific colors');
  ['--risk-low', '--risk-ready', '--risk-watch', '--risk-elevated', '--risk-high', '--risk-critical'].forEach(token => {
    assert.match(css, new RegExp(token), `missing CSS risk token ${token}`);
  });
});

test('dashboard manual refresh exposes progress feedback', () => {
  const html = readText('dashboard.html');
  const source = readText('dashboard.js');
  const css = readText('style.css');

  assert.match(html, /id=["']dashboardRefreshStatus["']/, 'dashboard should include a refresh status region');
  assert.match(html, /aria-live=["']polite["']/, 'refresh status should be announced politely');
  assert.match(source, /function startRefreshProgress/, 'refresh should start visible progress immediately');
  assert.match(source, /Connecting to Cloudflare/);
  assert.match(source, /Updating local cache/);
  assert.match(source, /finishRefreshProgress/);
  assert.match(css, /\.dashboard-refresh-status/);
  assert.match(css, /@keyframes spin/);
  assert.match(css, /@keyframes pulse-ring/);
});

test('dashboard charts can be expanded and use adaptive trend scaling', () => {
  const html = readText('dashboard.html');
  const source = readText('dashboard.js');
  const css = readText('style.css');

  assert.match(html, /id=["']chartModal["']/, 'dashboard should include an enlarged chart modal');
  assert.match(source, /function chartScale/, 'dashboard should calculate chart scale separately');
  assert.match(source, /adaptiveScale:\s*true/, 'mini and modal charts should use adaptive trend scale');
  assert.match(source, /function openChartModal/, 'dashboard should open a chart modal');
  assert.match(source, /data-chart-key/, 'metric cards should expose clickable chart targets');
  assert.match(css, /\.chart-modal/);
  assert.match(css, /cursor:\s*zoom-in/);
});

test('dashboard supports account overview drilldown and switching', () => {
  const html = readText('dashboard.html');
  const source = readText('dashboard.js');
  const css = readText('style.css');

  assert.match(html, /id=["']dashboardAccountContext["']/, 'dashboard should include an account context region');
  assert.match(source, /dashboardAccountSelect/, 'account detail view should render a profile switcher');
  assert.match(source, /dashboard\.html\?profile=/, 'account rows should drill into profile-specific detail URLs');
  assert.match(source, /getAccountOverview/, 'detail view should load account overview data for switching');
  assert.match(css, /\.dashboard-account-context/, 'account switcher should have dashboard styling');
});

test('sync schedule exposes background job logs', () => {
  const html = readText('schedule.html');
  const source = readText('options.js');
  const css = readText('style.css');

  assert.match(html, /id=["']sync-log-settings["']/, 'schedule page should include sync log settings');
  assert.match(html, /id=["']syncLogList["']/, 'schedule page should include a sync log list');
  assert.match(source, /function renderSyncLogs/, 'options controller should render sync logs');
  assert.match(source, /storageGet\(\['syncLogs'\]\)/, 'schedule page should read stored sync logs');
  assert.match(css, /\.sync-log-item/);
});

test('Cloudflare token verifies and can see the configured account', async t => {
  const token = requiredEnv('CLOUDFLARE_API_TOKEN');
  const accountId = requiredEnv('CLOUDFLARE_ACCOUNT_ID');

  if (!token || !accountId) {
    t.skip('CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID are required for integration checks');
    return;
  }

  const verifyResponse = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const verifyBody = await verifyResponse.json();

  assert.equal(verifyResponse.ok, true, JSON.stringify(verifyBody.errors || verifyBody));
  assert.equal(verifyBody.success, true, JSON.stringify(verifyBody.errors || verifyBody));
  assert.equal(verifyBody.result.status, 'active');

  const query = `query($accountTag: String!) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        accountTag
      }
    }
  }`;

  const graphData = await cloudflareGraphql(token, query, { accountTag: accountId });

  assert.equal(graphData.viewer.accounts.some(account => account.accountTag === accountId), true);
});

test('Cloudflare R2 telemetry query returns current storage data', async t => {
  const token = requiredEnv('CLOUDFLARE_API_TOKEN');
  const accountId = requiredEnv('CLOUDFLARE_ACCOUNT_ID');

  if (!token || !accountId) {
    t.skip('CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID are required for R2 telemetry checks');
    return;
  }

  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0)).toISOString();
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, -1)).toISOString();
  const query = `query($accountTag: String!, $start: DateTime!, $end: DateTime!) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        r2StorageAdaptiveGroups(
          limit: 1000
          filter: { datetime_geq: $start, datetime_leq: $end }
        ) {
          max {
            payloadSize
            metadataSize
          }
        }
        r2OperationsAdaptiveGroups(
          limit: 1000
          filter: { datetime_geq: $start, datetime_leq: $end }
        ) {
          dimensions {
            actionType
          }
          sum {
            requests
          }
        }
      }
    }
  }`;

  const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query,
      variables: { accountTag: accountId, start, end }
    })
  });
  const body = await response.json();
  const account = body.data?.viewer?.accounts?.[0];
  const storage = (account?.r2StorageAdaptiveGroups || []).reduce((total, group) => {
    return total + (group.max?.payloadSize || 0) + (group.max?.metadataSize || 0);
  }, 0);

  assert.equal(response.ok, true, JSON.stringify(body.errors || body));
  assert.equal(Array.isArray(body.errors), false, JSON.stringify(body.errors || []));
  assert.ok(account, 'configured account should be returned');
  assert.ok(storage > 0, 'configured account should currently report non-zero R2 storage');
});

test('Cloudflare telemetry queries validate every tracked metric surface', async t => {
  const token = requiredEnv('CLOUDFLARE_API_TOKEN');
  const accountId = requiredEnv('CLOUDFLARE_ACCOUNT_ID');

  if (!token || !accountId) {
    t.skip('CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID are required for telemetry checks');
    return;
  }

  const now = new Date();
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0)).toISOString();
  const dayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59)).toISOString();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0)).toISOString();
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, -1)).toISOString();

  const query = `query($accountTag: String!, $dayStart: DateTime!, $dayEnd: DateTime!, $monthStart: DateTime!, $monthEnd: DateTime!) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        workersInvocationsAdaptive(limit: 1000, filter: { datetime_geq: $dayStart, datetime_leq: $dayEnd }) {
          sum { requests }
        }
        kvOperationsAdaptiveGroups(limit: 1000, filter: { datetime_geq: $dayStart, datetime_leq: $dayEnd }) {
          dimensions { actionType }
          sum { requests }
        }
        d1AnalyticsAdaptiveGroups(limit: 1000, filter: { datetime_geq: $dayStart, datetime_leq: $dayEnd }) {
          sum { rowsRead rowsWritten }
        }
        r2StorageAdaptiveGroups(limit: 1000, filter: { datetime_geq: $monthStart, datetime_leq: $monthEnd }) {
          max { payloadSize metadataSize }
        }
        r2OperationsAdaptiveGroups(limit: 1000, filter: { datetime_geq: $monthStart, datetime_leq: $monthEnd }) {
          dimensions { actionType }
          sum { requests }
        }
        queueMessageOperationsAdaptiveGroups(limit: 1000, filter: { datetime_geq: $dayStart, datetime_leq: $dayEnd }) {
          sum { billableOperations }
        }
        hyperdriveQueriesAdaptiveGroups(limit: 1000, filter: { datetime_geq: $dayStart, datetime_leq: $dayEnd }) {
          count
        }
        browserRenderingBrowserTimeUsageAdaptiveGroups(limit: 1000, filter: { datetime_geq: $dayStart, datetime_leq: $dayEnd }) {
          sum { totalSessionDurationMs }
        }
        logExplorerIngestionAdaptiveGroups(limit: 1000, filter: { datetime_geq: $dayStart, datetime_leq: $dayEnd }) {
          sum { billableBytes totalBytes }
        }
        workersAnalyticsEngineAdaptiveGroups(limit: 1000, filter: { datetime_geq: $dayStart, datetime_leq: $dayEnd }) {
          count
        }
        workflowsAdaptiveGroups(limit: 1000, filter: { datetime_geq: $dayStart, datetime_leq: $dayEnd }) {
          count
        }
        aiInferenceAdaptiveGroups(limit: 1000, filter: { datetime_geq: $dayStart, datetime_leq: $dayEnd }) {
          sum { totalNeurons }
        }
        durableObjectsInvocationsAdaptiveGroups(limit: 1000, filter: { datetime_geq: $dayStart, datetime_leq: $dayEnd }) {
          sum { requests }
        }
        durableObjectsPeriodicGroups(limit: 1000, filter: { datetime_geq: $dayStart, datetime_leq: $dayEnd }) {
          sum { duration rowsRead rowsWritten }
        }
        durableObjectsSqlStorageGroups(limit: 1000, filter: { datetime_geq: $monthStart, datetime_leq: $monthEnd }) {
          max { storedBytes }
        }
      }
    }
  }`;

  const data = await cloudflareGraphql(token, query, {
    accountTag: accountId,
    dayStart,
    dayEnd,
    monthStart,
    monthEnd
  });
  const account = data.viewer.accounts[0];
  assert.ok(account, 'configured account should be returned');

  const values = {
    workers: sumGroups(account.workersInvocationsAdaptive, group => group.sum.requests),
    kv: sumGroups(account.kvOperationsAdaptiveGroups, group => group.sum.requests),
    d1RowsRead: sumGroups(account.d1AnalyticsAdaptiveGroups, group => group.sum.rowsRead),
    d1RowsWritten: sumGroups(account.d1AnalyticsAdaptiveGroups, group => group.sum.rowsWritten),
    r2Storage: sumGroups(account.r2StorageAdaptiveGroups, group => group.max.payloadSize + group.max.metadataSize),
    r2Ops: sumGroups(account.r2OperationsAdaptiveGroups, group => group.sum.requests),
    queues: sumGroups(account.queueMessageOperationsAdaptiveGroups, group => group.sum.billableOperations),
    hyperdrive: sumGroups(account.hyperdriveQueriesAdaptiveGroups, group => group.count),
    browserMinutes: sumGroups(account.browserRenderingBrowserTimeUsageAdaptiveGroups, group => group.sum.totalSessionDurationMs) / 60000,
    logIngestionBytes: sumGroups(account.logExplorerIngestionAdaptiveGroups, group => group.sum.billableBytes),
    analyticsWrites: sumGroups(account.workersAnalyticsEngineAdaptiveGroups, group => group.count),
    workflows: sumGroups(account.workflowsAdaptiveGroups, group => group.count),
    aiNeurons: sumGroups(account.aiInferenceAdaptiveGroups, group => group.sum.totalNeurons),
    durableObjectRequests: sumGroups(account.durableObjectsInvocationsAdaptiveGroups, group => group.sum.requests),
    durableObjectDuration: sumGroups(account.durableObjectsPeriodicGroups, group => group.sum.duration),
    durableObjectRowsRead: sumGroups(account.durableObjectsPeriodicGroups, group => group.sum.rowsRead),
    durableObjectRowsWritten: sumGroups(account.durableObjectsPeriodicGroups, group => group.sum.rowsWritten),
    durableObjectSqlStorage: sumGroups(account.durableObjectsSqlStorageGroups, group => group.max.storedBytes)
  };

  Object.entries(values).forEach(([name, value]) => {
    assert.equal(Number.isFinite(value), true, `${name} should be numeric`);
    assert.ok(value >= 0, `${name} should be non-negative`);
  });
  assert.ok(values.r2Storage > 0, 'configured account should currently report non-zero R2 storage');
  assert.ok(values.durableObjectSqlStorage > 0, 'configured account should currently report Durable Objects SQL storage');

  const projectsBody = await cloudflareApi(token, `/accounts/${accountId}/pages/projects?page=1&per_page=10`);
  assert.equal(Array.isArray(projectsBody.result), true, 'Pages projects endpoint should return a list');
});
