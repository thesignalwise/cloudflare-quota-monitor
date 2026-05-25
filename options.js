// options.js
// Handles loading, saving, testing, and local config import/export.

document.addEventListener('DOMContentLoaded', () => {
  const apiTokenInput = document.getElementById('apiToken');
  const accountIdInput = document.getElementById('accountId');
  const saveBtn = document.getElementById('saveBtn');
  const testApiBtn = document.getElementById('testApiBtn');
  const exportConfigBtn = document.getElementById('exportConfigBtn');
  const importConfigBtn = document.getElementById('importConfigBtn');
  const configFileInput = document.getElementById('configFileInput');
  const msgEl = document.getElementById('msg');
  const apiTestPanelEl = document.getElementById('apiTestPanel');
  const apiTestPanelStateEl = document.getElementById('apiTestPanelState');
  const apiTestSummaryEl = document.getElementById('apiTestSummary');
  const apiCapabilityGridEl = document.getElementById('apiCapabilityGrid');
  const hasChromeStorage = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
  const hasChromeRuntime = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage;
  const manifest = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest ? chrome.runtime.getManifest() : { version: '0.3.4' };

  const API_CAPABILITIES = [
    {
      id: 'workers',
      service: 'Workers',
      metric: 'Requests',
      kind: 'graphql',
      period: 'Daily',
      query: `query($accountTag: String!, $start: DateTime!, $end: DateTime!) {
        viewer {
          accounts(filter: {accountTag: $accountTag}) {
            workersInvocationsAdaptive(limit: 1, filter: { datetime_geq: $start, datetime_leq: $end }) {
              sum { requests }
            }
          }
        }
      }`
    },
    {
      id: 'pages',
      service: 'Pages',
      metric: 'Builds',
      kind: 'rest',
      period: 'Monthly'
    },
    {
      id: 'kv',
      service: 'Workers KV',
      metric: 'Reads, writes, deletes, lists',
      kind: 'graphql',
      period: 'Daily',
      query: `query($accountTag: String!, $start: DateTime!, $end: DateTime!) {
        viewer {
          accounts(filter: {accountTag: $accountTag}) {
            kvOperationsAdaptiveGroups(limit: 1, filter: { datetime_geq: $start, datetime_leq: $end }) {
              dimensions { actionType }
              sum { requests }
            }
          }
        }
      }`
    },
    {
      id: 'd1',
      service: 'D1',
      metric: 'Rows read, rows written',
      kind: 'graphql',
      period: 'Daily',
      query: `query($accountTag: String!, $start: DateTime!, $end: DateTime!) {
        viewer {
          accounts(filter: {accountTag: $accountTag}) {
            d1AnalyticsAdaptiveGroups(limit: 1, filter: { datetime_geq: $start, datetime_leq: $end }) {
              sum { rowsRead rowsWritten }
            }
          }
        }
      }`
    },
    {
      id: 'r2',
      service: 'R2',
      metric: 'Storage, Class A, Class B',
      kind: 'graphql',
      period: 'Monthly',
      range: 'month',
      query: `query($accountTag: String!, $start: DateTime!, $end: DateTime!) {
        viewer {
          accounts(filter: {accountTag: $accountTag}) {
            r2StorageAdaptiveGroups(limit: 1, filter: { datetime_geq: $start, datetime_leq: $end }) {
              max { payloadSize metadataSize }
            }
            r2OperationsAdaptiveGroups(limit: 1, filter: { datetime_geq: $start, datetime_leq: $end }) {
              sum { requests }
            }
          }
        }
      }`
    },
    {
      id: 'queues',
      service: 'Queues',
      metric: 'Billable operations',
      kind: 'graphql',
      period: 'Daily',
      query: `query($accountTag: String!, $start: DateTime!, $end: DateTime!) {
        viewer {
          accounts(filter: {accountTag: $accountTag}) {
            queueMessageOperationsAdaptiveGroups(limit: 1, filter: { datetime_geq: $start, datetime_leq: $end }) {
              sum { billableOperations }
            }
          }
        }
      }`
    },
    {
      id: 'hyperdrive',
      service: 'Hyperdrive',
      metric: 'Queries',
      kind: 'graphql',
      period: 'Daily',
      query: `query($accountTag: String!, $start: DateTime!, $end: DateTime!) {
        viewer {
          accounts(filter: {accountTag: $accountTag}) {
            hyperdriveQueriesAdaptiveGroups(limit: 1, filter: { datetime_geq: $start, datetime_leq: $end }) {
              count
            }
          }
        }
      }`
    },
    {
      id: 'browser',
      service: 'Browser Run',
      metric: 'Rendering minutes',
      kind: 'graphql',
      period: 'Daily',
      query: `query($accountTag: String!, $start: DateTime!, $end: DateTime!) {
        viewer {
          accounts(filter: {accountTag: $accountTag}) {
            browserRenderingBrowserTimeUsageAdaptiveGroups(limit: 1, filter: { datetime_geq: $start, datetime_leq: $end }) {
              sum { totalSessionDurationMs }
            }
          }
        }
      }`
    },
    {
      id: 'logsBytes',
      service: 'Workers Logs',
      metric: 'Ingestion bytes',
      kind: 'graphql',
      period: 'Daily',
      query: `query($accountTag: String!, $start: DateTime!, $end: DateTime!) {
        viewer {
          accounts(filter: {accountTag: $accountTag}) {
            logExplorerIngestionAdaptiveGroups(limit: 1, filter: { datetime_geq: $start, datetime_leq: $end }) {
              sum { billableBytes totalBytes }
            }
          }
        }
      }`
    },
    {
      id: 'logsEvents',
      service: 'Workers Logs',
      metric: 'Exact event quota',
      kind: 'known-gap',
      period: 'Daily',
      note: 'Cloudflare API does not expose this exact quota counter.'
    },
    {
      id: 'analyticsWrites',
      service: 'Analytics Engine',
      metric: 'Data points written',
      kind: 'graphql',
      period: 'Daily',
      query: `query($accountTag: String!, $start: DateTime!, $end: DateTime!) {
        viewer {
          accounts(filter: {accountTag: $accountTag}) {
            workersAnalyticsEngineAdaptiveGroups(limit: 1, filter: { datetime_geq: $start, datetime_leq: $end }) {
              count
            }
          }
        }
      }`
    },
    {
      id: 'analyticsReads',
      service: 'Analytics Engine',
      metric: 'Read queries',
      kind: 'known-gap',
      period: 'Daily',
      note: 'Cloudflare API does not expose read-query usage.'
    },
    {
      id: 'workflows',
      service: 'Workflows',
      metric: 'Invocations',
      kind: 'graphql',
      period: 'Daily',
      query: `query($accountTag: String!, $start: DateTime!, $end: DateTime!) {
        viewer {
          accounts(filter: {accountTag: $accountTag}) {
            workflowsAdaptiveGroups(limit: 1, filter: { datetime_geq: $start, datetime_leq: $end }) {
              count
            }
          }
        }
      }`
    },
    {
      id: 'ai',
      service: 'Workers AI',
      metric: 'Neurons',
      kind: 'graphql',
      period: 'Daily',
      query: `query($accountTag: String!, $start: DateTime!, $end: DateTime!) {
        viewer {
          accounts(filter: {accountTag: $accountTag}) {
            aiInferenceAdaptiveGroups(limit: 1, filter: { datetime_geq: $start, datetime_leq: $end }) {
              sum { totalNeurons }
            }
          }
        }
      }`
    },
    {
      id: 'durableObjects',
      service: 'Durable Objects',
      metric: 'Requests, GB-s, SQLite rows/storage',
      kind: 'graphql-durable',
      period: 'Daily + total',
      query: `query($accountTag: String!, $start: DateTime!, $end: DateTime!, $monthStart: DateTime!, $monthEnd: DateTime!) {
        viewer {
          accounts(filter: {accountTag: $accountTag}) {
            durableObjectsInvocationsAdaptiveGroups(limit: 1, filter: { datetime_geq: $start, datetime_leq: $end }) {
              sum { requests }
            }
            durableObjectsPeriodicGroups(limit: 1, filter: { datetime_geq: $start, datetime_leq: $end }) {
              sum { duration rowsRead rowsWritten }
            }
            durableObjectsSqlStorageGroups(limit: 1, filter: { datetime_geq: $monthStart, datetime_leq: $monthEnd }) {
              max { storedBytes }
            }
          }
        }
      }`
    }
  ];

  ['sidebarVersion', 'headerVersion', 'aboutVersion'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = `v${manifest.version}`;
  });

  function showMessage(text, type = '') {
    if (!msgEl) return;
    msgEl.textContent = text;
    msgEl.className = type ? `message ${type}` : 'message';
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));
  }

  function getInputValue(input, fallback = '') {
    return input ? input.value.trim() : fallback;
  }

  function getSecretValue(input, fallback = '') {
    return input ? input.value : fallback;
  }

  function currentSettings(existing = {}) {
    return {
      apiToken: getInputValue(apiTokenInput, existing.apiToken || ''),
      accountId: getInputValue(accountIdInput, existing.accountId || '')
    };
  }

  function applySettings(settings) {
    const data = settings || {};
    if (apiTokenInput) apiTokenInput.value = data.apiToken || '';
    if (accountIdInput) accountIdInput.value = data.accountId || '';
  }

  function loadStoredSettings(callback) {
    if (hasChromeStorage) {
      chrome.storage.local.get(['settings'], result => callback(result.settings || {}));
      return;
    }

    try {
      callback(JSON.parse(localStorage.getItem('quotaMonitorSettings') || '{}'));
    } catch (err) {
      callback({});
    }
  }

  function saveStoredSettings(settings, callback) {
    if (hasChromeStorage) {
      chrome.storage.local.set({ settings }, callback);
      return;
    }

    localStorage.setItem('quotaMonitorSettings', JSON.stringify(settings));
    callback();
  }

  function loadSettings() {
    loadStoredSettings(settings => applySettings(settings));
  }

  function sanitizeSettings(settings = {}) {
    return {
      apiToken: typeof settings.apiToken === 'string' ? settings.apiToken : '',
      accountId: typeof settings.accountId === 'string' ? settings.accountId : ''
    };
  }

  function storageGet(keys) {
    return new Promise(resolve => {
      if (hasChromeStorage) {
        chrome.storage.local.get(keys, resolve);
        return;
      }

      const result = {};
      keys.forEach(key => {
        if (key === 'settings') {
          try {
            result.settings = JSON.parse(localStorage.getItem('quotaMonitorSettings') || '{}');
          } catch (err) {
            result.settings = {};
          }
        } else {
          result[key] = localStorage.getItem(key) || undefined;
        }
      });
      resolve(result);
    });
  }

  function storageSet(values) {
    return new Promise(resolve => {
      if (hasChromeStorage) {
        chrome.storage.local.set(values, resolve);
        return;
      }

      Object.entries(values).forEach(([key, value]) => {
        if (key === 'settings') {
          localStorage.setItem('quotaMonitorSettings', JSON.stringify(value));
        } else if (value === undefined || value === null) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, String(value));
        }
      });
      resolve();
    });
  }

  function downloadJson(fileName, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.rel = 'noopener';
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function exportConfig() {
    const result = await storageGet(['settings', 'localePreference']);
    const payload = {
      schemaVersion: 1,
      app: 'cloudflare-quota-monitor',
      exportedAt: new Date().toISOString(),
      settings: sanitizeSettings(result.settings || {}),
      localePreference: result.localePreference || 'auto'
    };
    downloadJson(`cloudflare-quota-monitor-config-${new Date().toISOString().slice(0, 10)}.json`, payload);
  }

  function parseConfigPayload(text) {
    const payload = JSON.parse(text);
    const settings = sanitizeSettings(payload.settings || payload);
    const localePreference = payload.localePreference || 'auto';
    if (!settings.apiToken && !settings.accountId) {
      throw new Error('This file does not contain Cloudflare Quota Monitor settings.');
    }
    return { settings, localePreference };
  }

  async function importConfig(file) {
    if (!file) {
      throw new Error('Choose a JSON configuration file first.');
    }

    const text = await file.text();
    const { settings, localePreference } = parseConfigPayload(text);
    await storageSet({ settings, localePreference });
    applySettings(settings);
    if (hasChromeRuntime) {
      chrome.runtime.sendMessage({ action: 'refreshQuotas' });
    }
  }

  function getUtcDayRange() {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59));
    return { start: start.toISOString(), end: end.toISOString() };
  }

  function getUtcMonthRange() {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
    const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));
    const end = new Date(nextMonth.getTime() - 1000);
    return { start: start.toISOString(), end: end.toISOString() };
  }

  function apiErrorMessage(body, fallback) {
    if (Array.isArray(body?.errors) && body.errors.length) {
      return body.errors.map(error => error.message || error.code || JSON.stringify(error)).join('; ');
    }
    if (Array.isArray(body?.messages) && body.messages.length) {
      return body.messages.map(message => message.message || JSON.stringify(message)).join('; ');
    }
    return fallback;
  }

  async function fetchCloudflareJson(url, options) {
    const response = await fetch(url, options);
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body.success === false || (Array.isArray(body.errors) && body.errors.length)) {
      throw new Error(apiErrorMessage(body, `Cloudflare API error ${response.status}`));
    }
    return body;
  }

  async function testCloudflareApi(token, path) {
    return fetchCloudflareJson(`https://api.cloudflare.com/client/v4${path}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  async function testCloudflareGraphql(token, query, variables) {
    const body = await fetchCloudflareJson('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query, variables })
    });
    return body.data;
  }

  async function verifyToken(token) {
    const body = await testCloudflareApi(token, '/user/tokens/verify');
    if (body.result?.status && body.result.status !== 'active') {
      throw new Error(`Token status is ${body.result.status}.`);
    }
    return body.result || {};
  }

  async function verifyAccountAccess(token, accountId) {
    const data = await testCloudflareGraphql(token, `query($accountTag: String!) {
      viewer {
        accounts(filter: { accountTag: $accountTag }) {
          accountTag
        }
      }
    }`, { accountTag: accountId });
    const account = data.viewer?.accounts?.[0];
    if (!account) {
      throw new Error('Token verified, but this account ID is not visible to the token.');
    }
    return account;
  }

  function buildCapabilityVariables(capability, accountId) {
    const day = getUtcDayRange();
    const month = getUtcMonthRange();
    if (capability.kind === 'graphql-durable') {
      return {
        accountTag: accountId,
        start: day.start,
        end: day.end,
        monthStart: month.start,
        monthEnd: month.end
      };
    }

    const range = capability.range === 'month' ? month : day;
    return {
      accountTag: accountId,
      start: range.start,
      end: range.end
    };
  }

  function initialCapabilityResults(status = 'idle') {
    return API_CAPABILITIES.map(capability => ({
      id: capability.id,
      service: capability.service,
      metric: capability.metric,
      period: capability.period,
      status,
      detail: status === 'idle' ? 'Not tested' : 'Checking'
    }));
  }

  function statusText(status) {
    return {
      idle: 'Not tested',
      pending: 'Checking',
      supported: 'Supported',
      unsupported: 'Limited',
      error: 'Blocked'
    }[status] || status;
  }

  function renderApiTestSummary(status, title, detail) {
    if (!apiTestSummaryEl) return;
    if (apiTestPanelStateEl) {
      apiTestPanelStateEl.textContent = title;
    }
    apiTestSummaryEl.className = `api-test-summary is-${status}`;
    apiTestSummaryEl.innerHTML = `
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(detail)}</span>
    `;
  }

  function renderCapabilityGrid(results) {
    if (!apiCapabilityGridEl) return;
    apiCapabilityGridEl.innerHTML = results.map(result => `
      <article class="api-capability is-${escapeHtml(result.status)}">
        <div>
          <strong>${escapeHtml(result.service)}</strong>
          <span>${escapeHtml(result.metric)}</span>
        </div>
        <em>${escapeHtml(statusText(result.status))}</em>
        <small>${escapeHtml(result.detail || result.period || '')}</small>
      </article>
    `).join('');
  }

  async function testCapability(capability, token, accountId) {
    if (capability.kind === 'known-gap') {
      return {
        id: capability.id,
        service: capability.service,
        metric: capability.metric,
        period: capability.period,
        status: 'unsupported',
        detail: capability.note
      };
    }

    try {
      if (capability.kind === 'rest') {
        await testCloudflareApi(token, `/accounts/${accountId}/pages/projects?page=1&per_page=1`);
      } else {
        await testCloudflareGraphql(token, capability.query, buildCapabilityVariables(capability, accountId));
      }
      return {
        id: capability.id,
        service: capability.service,
        metric: capability.metric,
        period: capability.period,
        status: 'supported',
        detail: capability.period
      };
    } catch (err) {
      return {
        id: capability.id,
        service: capability.service,
        metric: capability.metric,
        period: capability.period,
        status: 'error',
        detail: err.message || 'Permission or API surface unavailable'
      };
    }
  }

  async function runApiTest() {
    const token = getSecretValue(apiTokenInput).trim();
    const accountId = getInputValue(accountIdInput);
    if (apiTestPanelEl) apiTestPanelEl.open = true;

    if (!token || !accountId) {
      renderApiTestSummary('error', 'Missing credentials', 'Enter both Cloudflare API token and account ID before testing.');
      renderCapabilityGrid(initialCapabilityResults());
      return;
    }

    if (testApiBtn) testApiBtn.disabled = true;
    renderApiTestSummary('pending', 'Testing API access', 'Checking token status, account visibility, and telemetry surfaces.');
    renderCapabilityGrid(initialCapabilityResults('pending'));

    try {
      await verifyToken(token);
      await verifyAccountAccess(token, accountId);
      const results = await Promise.all(API_CAPABILITIES.map(capability => testCapability(capability, token, accountId)));
      const supported = results.filter(result => result.status === 'supported').length;
      const limited = results.filter(result => result.status === 'unsupported').length;
      const blocked = results.filter(result => result.status === 'error').length;
      const summaryState = blocked ? 'warning' : 'success';
      const title = blocked ? 'API usable with limited telemetry' : 'API ready';
      const detail = `${supported}/${results.length} monitored metric surfaces are supported. ${limited} known API gaps. ${blocked} blocked by permission or API availability.`;
      renderApiTestSummary(summaryState, title, detail);
      renderCapabilityGrid(results);
      showMessage('API test completed.', blocked ? 'is-error' : 'is-success');
    } catch (err) {
      renderApiTestSummary('error', 'API test failed', err.message || 'Cloudflare rejected the token or account ID.');
      renderCapabilityGrid(initialCapabilityResults());
      showMessage(err.message || 'API test failed.', 'is-error');
    } finally {
      if (testApiBtn) testApiBtn.disabled = false;
    }
  }

  function saveSettings() {
    if (saveBtn) saveBtn.disabled = true;
    loadStoredSettings(existing => {
      const settings = currentSettings(existing);
      saveStoredSettings(settings, () => {
        if (saveBtn) saveBtn.disabled = false;
        showMessage('Settings saved.', 'is-success');
        if (hasChromeRuntime) {
          chrome.runtime.sendMessage({ action: 'refreshQuotas' });
        }
      });
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      try {
        saveSettings();
      } catch (err) {
        saveBtn.disabled = false;
        showMessage(err.message, 'is-error');
      }
    });
  }

  if (testApiBtn) {
    testApiBtn.addEventListener('click', () => {
      runApiTest();
    });
  }

  if (exportConfigBtn) {
    exportConfigBtn.addEventListener('click', () => {
      exportConfigBtn.disabled = true;
      showMessage('Exporting configuration...');
      exportConfig().then(() => {
        showMessage('Configuration exported.', 'is-success');
      }).catch(err => {
        showMessage(err.message, 'is-error');
      }).finally(() => {
        exportConfigBtn.disabled = false;
      });
    });
  }

  if (importConfigBtn && configFileInput) {
    importConfigBtn.addEventListener('click', () => {
      configFileInput.click();
    });

    configFileInput.addEventListener('change', () => {
      const [file] = configFileInput.files || [];
      importConfigBtn.disabled = true;
      showMessage('Importing configuration...');
      importConfig(file).then(() => {
        showMessage('Configuration imported.', 'is-success');
      }).catch(err => {
        showMessage(err.message, 'is-error');
      }).finally(() => {
        importConfigBtn.disabled = false;
        configFileInput.value = '';
      });
    });
  }

  renderCapabilityGrid(initialCapabilityResults());
  loadSettings();
});
