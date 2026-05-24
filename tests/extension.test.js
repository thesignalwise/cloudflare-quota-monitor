const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

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
  assert.equal(manifest.version, '0.3.0');
  assert.equal(packageJson.version, manifest.version);
  assert.equal(manifest.default_locale, 'en');
  assert.equal(manifest.name, '__MSG_extName__');
  assert.equal(manifest.description, '__MSG_extDescription__');
  assert.equal(manifest.action.default_popup, 'popup.html');
  assert.equal(manifest.options_ui.page, 'options.html');
  assert.equal(manifest.background.service_worker, 'background.js');
  assert.deepEqual(manifest.permissions.sort(), ['alarms', 'notifications', 'storage'].sort());
  assert.ok(manifest.host_permissions.includes('https://api.cloudflare.com/*'));

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
      ids: ['content', 'refreshBtn', 'status', 'focusStrip', 'cards', 'dashboardBtn', 'topPercent']
    },
    {
      file: 'dashboard.html',
      ids: ['refreshDashboard', 'dashboardSummary', 'dashboard-content', 'cardViewBtn', 'listViewBtn']
    },
    {
      file: 'options.html',
      ids: ['apiToken', 'accountId', 'saveBtn', 'testApiBtn', 'apiTestSummary', 'apiCapabilityGrid', 'msg']
    },
    {
      file: 'webdav.html',
      ids: ['webdavUrl', 'webdavUsername', 'webdavPassword', 'webdavPath', 'saveBtn', 'backupBtn', 'restoreBtn', 'msg']
    },
    {
      file: 'services.html',
      ids: ['monitored-services']
    },
    {
      file: 'schedule.html',
      ids: ['syncSchedule']
    },
    {
      file: 'about.html',
      ids: ['about-settings', 'language-settings', 'localePreference', 'aboutVersion']
    },
    {
      file: 'release-notes.html',
      ids: ['release-notes']
    }
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
      assert.match(html, /href=["']release-notes\.html["']/, `${page.file} should link to Release Notes`);
      assert.match(html, /href=["']https:\/\/thesignalwise\.com["']/, `${page.file} should link to the official website`);
      assert.match(html, /href=["']https:\/\/github\.com\/thesignalwise\/cloudflare-quota-monitor["']/, `${page.file} should link to GitHub`);
    }
  });

  assert.doesNotMatch(readText('dashboard.html'), /top-nav__link/, 'dashboard should not use the standalone top navigation');
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
  assert.match(source, /message\.action === 'refreshQuotas'/);
  assert.match(source, /chrome\.alarms\.create\('updateQuotas'/);
});

test('options page exposes API validation and capability checks', () => {
  const html = readText('options.html');
  const source = readText('options.js');

  assert.match(html, /id=["']testApiBtn["']/, 'API page should include a test button');
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
