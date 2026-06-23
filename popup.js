// popup.js
// Renders a compact multi-account quota cockpit in the extension popup.

document.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.getElementById('status');
  const cardsEl = document.getElementById('cards');
  const focusStripEl = document.getElementById('focusStrip');
  const refreshBtn = document.getElementById('refreshBtn');
  const dashboardBtn = document.getElementById('dashboardBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const topPercentEl = document.getElementById('topPercent');
  const topLabelEl = document.getElementById('topLabel');
  const criticalCountEl = document.getElementById('criticalCount');
  const watchCountEl = document.getElementById('watchCount');
  const trackedCountEl = document.getElementById('trackedCount');
  const hasChromeRuntime = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage;
  let lastOverview = null;

  const DEMO_OVERVIEW = {
    activeProfileId: 'profile-production',
    summary: {
      total: 5,
      criticalCount: 1,
      watchCount: 2,
      errorCount: 1,
      lastUpdated: Date.now() - 120000,
      topAccount: {
        profileId: 'profile-production',
        label: 'Production',
        topMetric: 'D1 Rows Written',
        topPercent: 0.94
      }
    },
    accounts: [
      { profileId: 'profile-production', label: 'Production', accountId: '01a91f', topMetric: 'D1 Rows Written', topPercent: 0.94, criticalCount: 1, watchCount: 0, status: 'critical', lastUpdated: Date.now() - 30000 },
      { profileId: 'profile-ai-lab', label: 'AI Lab', accountId: '4e88c4', topMetric: 'Workers AI Neurons', topPercent: 0.88, criticalCount: 0, watchCount: 1, status: 'watch', lastUpdated: Date.now() - 120000 },
      { profileId: 'profile-client-pages', label: 'Client Pages', accountId: '21b672', topMetric: 'Pages Builds', topPercent: 0.76, criticalCount: 0, watchCount: 1, status: 'watch', lastUpdated: Date.now() - 300000 },
      { profileId: 'profile-dev', label: 'Dev Sandbox', accountId: 'aa42d0', topMetric: 'Workers Requests', topPercent: 0.43, criticalCount: 0, watchCount: 0, status: 'ok', lastUpdated: Date.now() - 480000 },
      { profileId: 'profile-archive', label: 'Archive', accountId: 'be19ab', topMetric: 'Sync failed', topPercent: null, criticalCount: 0, watchCount: 0, status: 'error', lastError: 'Token expired', lastUpdated: Date.now() - 600000 }
    ]
  };

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));
  }

  function hasMetricValue(value) {
    return value !== null && value !== undefined && Number.isFinite(Number(value));
  }

  function displayPercent(value) {
    if (!hasMetricValue(value)) return null;
    return Math.max(0, Math.round(Number(value) * 100));
  }

  function t(value) {
    return window.quotaI18n?.t ? window.quotaI18n.t(value) : value;
  }

  function statusLabel(status) {
    const label = {
      critical: 'Critical',
      watch: 'Watch',
      ok: 'OK',
      error: 'Error',
      info: 'Info'
    }[status] || 'Info';
    return t(label);
  }

  function statusClass(status) {
    return {
      critical: 'danger',
      watch: 'warning',
      ok: 'good',
      error: 'danger',
      info: 'info'
    }[status] || 'info';
  }

  function accountSuffix(accountId) {
    const value = String(accountId || '').trim();
    return value ? `...${value.slice(-5)}` : t('No account ID');
  }

  function formatRelativeTime(timestamp) {
    const value = Number(timestamp);
    if (!Number.isFinite(value) || value <= 0) return t('No sync');
    const seconds = Math.max(0, Math.round((Date.now() - value) / 1000));
    if (seconds < 45) return t('Just now');
    const locale = window.quotaI18n?.locale || document.documentElement.lang || navigator.language || 'en';
    const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    if (seconds < 3600) return formatter.format(-Math.round(seconds / 60), 'minute');
    if (seconds < 86400) return formatter.format(-Math.round(seconds / 3600), 'hour');
    return formatter.format(-Math.round(seconds / 86400), 'day');
  }

  function rankedAccounts(overview) {
    return [...(overview?.accounts || [])]
      .filter(account => account.enabled !== false)
      .sort((a, b) => {
        const statusRank = { error: 4, critical: 3, watch: 2, ok: 1, info: 0 };
        const statusDelta = (statusRank[b.status] || 0) - (statusRank[a.status] || 0);
        if (statusDelta) return statusDelta;
        return (Number(b.topPercent) || -1) - (Number(a.topPercent) || -1);
      });
  }

  function renderAccountRow(account, index) {
    const percent = displayPercent(account.topPercent);
    const status = account.status || 'info';
    const statusLevel = statusClass(status);
    const href = `dashboard.html?profile=${encodeURIComponent(account.profileId)}`;
    return `
      <a class="account-risk-row is-${statusLevel}" href="${escapeHtml(href)}" data-profile-id="${escapeHtml(account.profileId)}">
        <span class="account-risk-row__rank">${index + 1}</span>
        <span class="account-risk-row__main">
          <strong>${escapeHtml(account.label || t('Cloudflare account'))}</strong>
          <small>${escapeHtml(accountSuffix(account.accountId))}</small>
        </span>
        <span class="account-risk-row__metric">${escapeHtml(account.lastError || account.topMetric || t('No usage data'))}</span>
        <span class="account-risk-row__percent">${escapeHtml(percent === null ? t('Error') : `${percent}%`)}</span>
        <span class="account-risk-row__status">${escapeHtml(statusLabel(status))}</span>
        <span class="account-risk-row__sync">${escapeHtml(formatRelativeTime(account.lastUpdated))}</span>
      </a>
    `;
  }

  function renderFocusItem(account) {
    const percent = displayPercent(account.topPercent);
    const statusLevel = statusClass(account.status);
    return `
      <article class="attention-item is-${statusLevel}">
        <div>
          <strong>${escapeHtml(percent === null ? statusLabel(account.status) : `${percent}%`)}</strong>
          <span>${escapeHtml(account.label || t('Cloudflare account'))}</span>
        </div>
        <em>${escapeHtml(account.lastError || account.topMetric || t('No usage data'))}</em>
      </article>
    `;
  }

  function setStatus(message, type = '') {
    statusEl.textContent = message;
    statusEl.className = type ? `state-panel ${type}` : 'state-panel';
  }

  function renderOverview(overview) {
    lastOverview = overview;
    const accounts = rankedAccounts(overview);
    const summary = overview?.summary || {};
    const topAccount = summary.topAccount || accounts.find(account => hasMetricValue(account.topPercent));
    const topPercent = displayPercent(topAccount?.topPercent);

    criticalCountEl.textContent = String(summary.criticalCount || 0);
    watchCountEl.textContent = String(summary.watchCount || 0);
    trackedCountEl.textContent = String(summary.total || accounts.length || 0);
    topPercentEl.textContent = topPercent === null ? '--' : `${topPercent}%`;
    topLabelEl.textContent = topAccount
      ? `${topAccount.label} · ${topAccount.topMetric}`
      : t('No account data');

    cardsEl.innerHTML = '';
    focusStripEl.innerHTML = '';

    if (!accounts.length) {
      setStatus(t('Add at least one Cloudflare account in API Settings.'), 'is-error');
      cardsEl.hidden = true;
      focusStripEl.hidden = true;
      return;
    }

    setStatus('');
    focusStripEl.hidden = false;
    cardsEl.hidden = false;
    cardsEl.className = 'account-risk-list';
    focusStripEl.innerHTML = accounts.slice(0, 3).map(renderFocusItem).join('');
    cardsEl.innerHTML = accounts.slice(0, 5).map(renderAccountRow).join('');
  }

  function loadData() {
    if (!hasChromeRuntime) {
      renderOverview(DEMO_OVERVIEW);
      return;
    }

    chrome.runtime.sendMessage({ action: 'getAccountOverview' }, response => {
      renderOverview(response ? response.data : null);
    });
  }

  refreshBtn.addEventListener('click', () => {
    if (!hasChromeRuntime) {
      renderOverview(DEMO_OVERVIEW);
      return;
    }

    refreshBtn.disabled = true;
    refreshBtn.classList.add('is-syncing');
    refreshBtn.setAttribute('aria-busy', 'true');
    chrome.runtime.sendMessage({ action: 'refreshQuotas', source: 'popup' }, () => {
      refreshBtn.disabled = false;
      refreshBtn.classList.remove('is-syncing');
      refreshBtn.removeAttribute('aria-busy');
      loadData();
    });
  });

  cardsEl.addEventListener('click', event => {
    const target = event.target.closest('[data-profile-id]');
    if (!target) return;
    event.preventDefault();
    const url = target.getAttribute('href');
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.runtime) {
      chrome.tabs.create({ url: chrome.runtime.getURL(url) });
      return;
    }
    window.location.href = url;
  });

  settingsBtn.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      if (chrome.tabs) {
        chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
        return;
      }
    }

    window.location.href = 'options.html';
  });

  dashboardBtn.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.runtime) {
      chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
      return;
    }

    window.location.href = 'dashboard.html';
  });

  window.addEventListener('quota-i18n-ready', () => {
    if (lastOverview) renderOverview(lastOverview);
  });

  loadData();
});
