// options.js
// Handles loading, saving, testing, and local config import/export.

document.addEventListener('DOMContentLoaded', () => {
  const profileSelect = document.getElementById('profileSelect');
  const profileLabelInput = document.getElementById('profileLabel');
  const apiTokenInput = document.getElementById('apiToken');
  const accountIdInput = document.getElementById('accountId');
  const saveBtn = document.getElementById('saveBtn');
  const testApiBtn = document.getElementById('testApiBtn');
  const newProfileBtn = document.getElementById('newProfileBtn');
  const deleteProfileBtn = document.getElementById('deleteProfileBtn');
  const accountProfileListEl = document.getElementById('accountProfileList');
  const exportConfigBtn = document.getElementById('exportConfigBtn');
  const importConfigBtn = document.getElementById('importConfigBtn');
  const configFileInput = document.getElementById('configFileInput');
  const msgEl = document.getElementById('msg');
  const apiTestPanelEl = document.getElementById('apiTestPanel');
  const apiTestPanelStateEl = document.getElementById('apiTestPanelState');
  const apiTestSummaryEl = document.getElementById('apiTestSummary');
  const apiCapabilityGridEl = document.getElementById('apiCapabilityGrid');
  const syncLogListEl = document.getElementById('syncLogList');
  const syncLogEmptyEl = document.getElementById('syncLogEmpty');
  const syncLogRefreshBtn = document.getElementById('syncLogRefreshBtn');
  const hasChromeStorage = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
  const hasChromeRuntime = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage;
  const manifest = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest ? chrome.runtime.getManifest() : { version: '0.4.0' };
  let accountProfiles = [];
  let activeProfileId = '';

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

  function profileIdFor(accountId, index = 0) {
    const normalized = String(accountId || 'account')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 28) || 'account';
    return `profile-${normalized}${index ? `-${index}` : ''}`;
  }

  function sanitizeProfile(profile = {}, index = 0) {
    const accountId = typeof profile.accountId === 'string' ? profile.accountId.trim() : '';
    const apiToken = typeof profile.apiToken === 'string' ? profile.apiToken.trim() : '';
    const id = typeof profile.id === 'string' && profile.id.trim()
      ? profile.id.trim()
      : profileIdFor(accountId, index);
    const label = typeof profile.label === 'string' && profile.label.trim()
      ? profile.label.trim()
      : `Cloudflare ${accountId ? accountId.slice(-6) : index + 1}`;

    return {
      id,
      label,
      apiToken,
      accountId,
      enabled: profile.enabled !== false,
      createdAt: Number.isFinite(Number(profile.createdAt)) ? Number(profile.createdAt) : Date.now(),
      updatedAt: Number.isFinite(Number(profile.updatedAt)) ? Number(profile.updatedAt) : Date.now()
    };
  }

  function normalizeSettings(settings = {}) {
    const profiles = Array.isArray(settings.profiles)
      ? settings.profiles.map(sanitizeProfile).filter(profile => profile.apiToken || profile.accountId || profile.label)
      : [];

    if (!profiles.length && (settings.apiToken || settings.accountId)) {
      profiles.push(sanitizeProfile({
        id: profileIdFor(settings.accountId),
        label: 'Default account',
        apiToken: settings.apiToken || '',
        accountId: settings.accountId || '',
        enabled: true
      }));
    }

    let activeId = typeof settings.activeProfileId === 'string' ? settings.activeProfileId : '';
    if (!profiles.some(profile => profile.id === activeId)) {
      activeId = profiles[0]?.id || '';
    }
    const activeProfile = profiles.find(profile => profile.id === activeId) || profiles[0] || {};
    return {
      schemaVersion: 3,
      profiles,
      activeProfileId: activeId,
      apiToken: activeProfile.apiToken || settings.apiToken || '',
      accountId: activeProfile.accountId || settings.accountId || ''
    };
  }

  function ensureEditableProfile() {
    if (!accountProfiles.length) {
      const profile = sanitizeProfile({
        id: `profile-${Date.now()}`,
        label: 'New account',
        enabled: true
      });
      accountProfiles = [profile];
      activeProfileId = profile.id;
    }
  }

  function activeProfile() {
    return accountProfiles.find(profile => profile.id === activeProfileId) || accountProfiles[0] || null;
  }

  function t(value) {
    return window.quotaI18n?.t ? window.quotaI18n.t(value) : value;
  }

  function displayProfileLabel(profile) {
    const label = profile?.label || 'Cloudflare account';
    return ['New account', 'Default account', 'Cloudflare account'].includes(label) ? t(label) : label;
  }

  function currentSettings(existing = {}) {
    const base = normalizeSettings(existing);
    if (!accountProfiles.length) {
      accountProfiles = base.profiles;
      activeProfileId = base.activeProfileId;
    }
    ensureEditableProfile();
    const selected = activeProfile();
    const updatedProfile = Object.assign({}, selected, {
      label: getInputValue(profileLabelInput, selected?.label || 'Cloudflare account'),
      apiToken: getInputValue(apiTokenInput, selected?.apiToken || ''),
      accountId: getInputValue(accountIdInput, selected?.accountId || ''),
      enabled: true,
      updatedAt: Date.now()
    });
    accountProfiles = accountProfiles.map(profile => profile.id === updatedProfile.id ? updatedProfile : profile);
    return {
      schemaVersion: 3,
      activeProfileId: updatedProfile.id,
      profiles: accountProfiles,
      apiToken: updatedProfile.apiToken,
      accountId: updatedProfile.accountId
    };
  }

  function renderProfileList() {
    if (profileSelect) {
      profileSelect.innerHTML = accountProfiles.map(profile => `
        <option value="${escapeHtml(profile.id)}"${profile.id === activeProfileId ? ' selected' : ''}>${escapeHtml(displayProfileLabel(profile) || profile.accountId || t('Cloudflare account'))}</option>
      `).join('');
    }

    if (accountProfileListEl) {
      accountProfileListEl.innerHTML = accountProfiles.map(profile => `
        <article class="account-profile-chip${profile.id === activeProfileId ? ' is-active' : ''}" data-profile-id="${escapeHtml(profile.id)}">
          <strong>${escapeHtml(displayProfileLabel(profile))}</strong>
          <span>${escapeHtml(profile.accountId ? `...${profile.accountId.slice(-6)}` : t('No account ID'))}</span>
        </article>
      `).join('');
    }
    if (deleteProfileBtn) deleteProfileBtn.disabled = accountProfiles.length <= 1;
  }

  function applySettings(settings) {
    const data = normalizeSettings(settings || {});
    accountProfiles = data.profiles;
    activeProfileId = data.activeProfileId;
    ensureEditableProfile();
    const profile = activeProfile();
    if (profileLabelInput) profileLabelInput.value = profile?.label || '';
    if (apiTokenInput) apiTokenInput.value = profile?.apiToken || '';
    if (accountIdInput) accountIdInput.value = profile?.accountId || '';
    renderProfileList();
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
    return normalizeSettings(settings);
  }

  function safeJsonParse(value, fallback) {
    if (value === null || value === undefined || value === '') {
      return fallback;
    }

    try {
      return JSON.parse(value);
    } catch (err) {
      return fallback;
    }
  }

  function sanitizeHistory(history) {
    if (!Array.isArray(history)) {
      return [];
    }

    return history
      .filter(entry => entry && entry.quotas && Number.isFinite(Number(entry.timestamp)))
      .map(entry => ({
        timestamp: Number(entry.timestamp),
        quotas: entry.quotas
      }))
      .slice(-200);
  }

  function sanitizeMonitoringData(data = {}) {
    return {
      quotas: data.quotas || null,
      history: sanitizeHistory(data.history),
      quotaCacheByProfile: data.quotaCacheByProfile && typeof data.quotaCacheByProfile === 'object' ? data.quotaCacheByProfile : {},
      historyByProfile: data.historyByProfile && typeof data.historyByProfile === 'object' ? data.historyByProfile : {},
      lastUpdated: Number.isFinite(Number(data.lastUpdated)) ? Number(data.lastUpdated) : null,
      syncLogs: sanitizeSyncLogs(data.syncLogs)
    };
  }

  function sanitizeSyncLogs(logs) {
    if (!Array.isArray(logs)) {
      return [];
    }

    return logs
      .filter(log => log && Number.isFinite(Number(log.timestamp)) && typeof log.status === 'string')
      .map(log => ({
        timestamp: Number(log.timestamp),
        source: typeof log.source === 'string' ? log.source : 'manual',
        status: log.status,
        message: typeof log.message === 'string' ? log.message : '',
        durationMs: Number.isFinite(Number(log.durationMs)) ? Number(log.durationMs) : undefined
      }))
      .slice(-100);
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
          result.settings = safeJsonParse(localStorage.getItem('quotaMonitorSettings'), {});
        } else if (['quotas', 'history', 'syncLogs', 'quotaCacheByProfile', 'historyByProfile'].includes(key)) {
          result[key] = safeJsonParse(localStorage.getItem(key), key === 'quotas' ? null : (key.endsWith('ByProfile') ? {} : []));
        } else if (key === 'lastUpdated') {
          const value = Number(localStorage.getItem(key));
          result.lastUpdated = Number.isFinite(value) ? value : null;
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
        } else if (['quotas', 'history', 'syncLogs', 'quotaCacheByProfile', 'historyByProfile'].includes(key)) {
          localStorage.setItem(key, JSON.stringify(value));
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
    const result = await storageGet(['settings', 'localePreference', 'quotas', 'history', 'quotaCacheByProfile', 'historyByProfile', 'lastUpdated', 'syncLogs']);
    const monitoringData = sanitizeMonitoringData({
      quotas: result.quotas,
      history: result.history,
      quotaCacheByProfile: result.quotaCacheByProfile,
      historyByProfile: result.historyByProfile,
      lastUpdated: result.lastUpdated,
      syncLogs: result.syncLogs
    });
    const payload = {
      schemaVersion: 3,
      app: 'cloudflare-quota-monitor',
      exportedAt: new Date().toISOString(),
      settings: sanitizeSettings(result.settings || {}),
      localePreference: result.localePreference || 'auto',
      monitoringData
    };
    downloadJson(`cloudflare-quota-monitor-config-${new Date().toISOString().slice(0, 10)}.json`, payload);
  }

  function parseConfigPayload(text) {
    const payload = JSON.parse(text);
    const settings = sanitizeSettings(payload.settings || payload);
    const localePreference = payload.localePreference || 'auto';
    const hasMonitoringData = Boolean(payload.monitoringData)
      || Object.prototype.hasOwnProperty.call(payload, 'quotas')
      || Object.prototype.hasOwnProperty.call(payload, 'history')
      || Object.prototype.hasOwnProperty.call(payload, 'quotaCacheByProfile')
      || Object.prototype.hasOwnProperty.call(payload, 'historyByProfile')
      || Object.prototype.hasOwnProperty.call(payload, 'lastUpdated')
      || Object.prototype.hasOwnProperty.call(payload, 'syncLogs');
    const monitoringData = sanitizeMonitoringData(payload.monitoringData || {
      quotas: payload.quotas,
      history: payload.history,
      quotaCacheByProfile: payload.quotaCacheByProfile,
      historyByProfile: payload.historyByProfile,
      lastUpdated: payload.lastUpdated,
      syncLogs: payload.syncLogs
    });
    if (!settings.apiToken && !settings.accountId) {
      throw new Error('This file does not contain Cloudflare Quota Monitor settings.');
    }
    return { settings, localePreference, monitoringData, hasMonitoringData };
  }

  async function importConfig(file) {
    if (!file) {
      throw new Error('Choose a JSON configuration file first.');
    }

    const text = await file.text();
    const { settings, localePreference, monitoringData, hasMonitoringData } = parseConfigPayload(text);
    const values = { settings, localePreference };
    if (hasMonitoringData) {
      values.quotas = monitoringData.quotas;
      values.history = monitoringData.history;
      values.quotaCacheByProfile = monitoringData.quotaCacheByProfile;
      values.historyByProfile = monitoringData.historyByProfile;
      values.lastUpdated = monitoringData.lastUpdated;
      values.syncLogs = monitoringData.syncLogs;
    }
    await storageSet(values);
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
      error: 'Blocked',
      started: 'Started',
      skipped: 'Skipped',
      success: 'Success',
      scheduled: 'Scheduled'
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

  function formatLogTime(timestamp) {
    const date = new Date(Number(timestamp));
    if (Number.isNaN(date.getTime())) return 'Unknown time';
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatDuration(durationMs) {
    const value = Number(durationMs);
    if (!Number.isFinite(value)) return '';
    if (value < 1000) return `${Math.round(value)} ms`;
    return `${(value / 1000).toFixed(1)} s`;
  }

  function renderSyncLogs(logs) {
    if (!syncLogListEl) return;
    const entries = sanitizeSyncLogs(logs).slice().reverse();
    syncLogListEl.innerHTML = '';
    if (syncLogEmptyEl) syncLogEmptyEl.hidden = entries.length > 0;

    entries.forEach(log => {
      const item = document.createElement('article');
      item.className = `sync-log-item is-${log.status}`;
      const duration = formatDuration(log.durationMs);
      item.innerHTML = `
        <span class="sync-log-dot" aria-hidden="true"></span>
        <div class="sync-log-main">
          <strong>${escapeHtml(log.message || statusText(log.status))}</strong>
          <span>${escapeHtml(formatLogTime(log.timestamp))} · ${escapeHtml(log.source)}${duration ? ` · ${escapeHtml(duration)}` : ''}</span>
        </div>
        <em>${escapeHtml(statusText(log.status))}</em>
      `;
      syncLogListEl.appendChild(item);
    });
  }

  async function loadSyncLogs() {
    if (!syncLogListEl) return;
    const result = await storageGet(['syncLogs']);
    renderSyncLogs(result.syncLogs || []);
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

  if (profileSelect) {
    profileSelect.addEventListener('change', () => {
      const current = currentSettings({ profiles: accountProfiles, activeProfileId });
      accountProfiles = current.profiles;
      activeProfileId = profileSelect.value;
      applySettings({ profiles: accountProfiles, activeProfileId });
    });
  }

  if (newProfileBtn) {
    newProfileBtn.addEventListener('click', () => {
      const current = currentSettings({ profiles: accountProfiles, activeProfileId });
      accountProfiles = current.profiles;
      const profile = sanitizeProfile({
        id: `profile-${Date.now()}`,
        label: `Account ${accountProfiles.length + 1}`,
        enabled: true
      }, accountProfiles.length);
      accountProfiles = accountProfiles.concat(profile);
      activeProfileId = profile.id;
      applySettings({ profiles: accountProfiles, activeProfileId });
      showMessage('New account profile ready. Add its token and Account ID, then save.');
    });
  }

  if (deleteProfileBtn) {
    deleteProfileBtn.addEventListener('click', () => {
      if (accountProfiles.length <= 1) return;
      accountProfiles = accountProfiles.filter(profile => profile.id !== activeProfileId);
      activeProfileId = accountProfiles[0]?.id || '';
      applySettings({ profiles: accountProfiles, activeProfileId });
      showMessage('Account profile removed locally. Save to confirm.', 'is-success');
    });
  }

  if (accountProfileListEl) {
    accountProfileListEl.addEventListener('click', event => {
      const target = event.target.closest('[data-profile-id]');
      if (!target) return;
      const current = currentSettings({ profiles: accountProfiles, activeProfileId });
      accountProfiles = current.profiles;
      activeProfileId = target.dataset.profileId;
      applySettings({ profiles: accountProfiles, activeProfileId });
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
  loadSyncLogs();
  if (syncLogRefreshBtn) {
    syncLogRefreshBtn.addEventListener('click', () => {
      syncLogRefreshBtn.disabled = true;
      loadSyncLogs().finally(() => {
        syncLogRefreshBtn.disabled = false;
      });
    });
  }
  loadSettings();
});
