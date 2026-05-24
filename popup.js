// popup.js
// Renders a dense quota cockpit in the extension popup.

document.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.getElementById('status');
  const cardsEl = document.getElementById('cards');
  const focusStripEl = document.getElementById('focusStrip');
  const refreshBtn = document.getElementById('refreshBtn');
  const dashboardBtn = document.getElementById('dashboardBtn');
  const summaryBadge = document.getElementById('summaryBadge');
  const topPercentEl = document.getElementById('topPercent');
  const topLabelEl = document.getElementById('topLabel');
  const criticalCountEl = document.getElementById('criticalCount');
  const watchCountEl = document.getElementById('watchCount');
  const trackedCountEl = document.getElementById('trackedCount');
  const hasChromeRuntime = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage;

  const DEMO_QUOTAS = {
    workers: { used: 85420, limit: 100000, percent: 0.8542, unit: 'requests', period: 'daily' },
    pages: { used: 210, limit: 500, percent: 0.42, unit: 'builds', period: 'monthly' },
    kv: { reads: 1215000, writes: 680, deletes: 120, lists: 48, readsLimit: 100000, writesLimit: 1000, deletesLimit: 1000, listsLimit: 1000, readsPercent: 0.1215, writesPercent: 0.68, deletesPercent: 0.12, listsPercent: 0.048 },
    d1: { reads: 3800000, writes: 94000, readsLimit: 5000000, writesLimit: 100000, readsPercent: 0.76, writesPercent: 0.94 },
    r2: { storage: 7.5 * 1024 * 1024 * 1024, classA: 640000, classB: 1800000, storageLimit: 10 * 1024 * 1024 * 1024, classALimit: 1000000, classBLimit: 10000000, storagePercent: 0.75, classAPercent: 0.64, classBPercent: 0.18 },
    queues: { used: 3600, limit: 10000, percent: 0.36, unit: 'ops' },
    hyperdrive: { used: 48000, limit: 100000, percent: 0.48, unit: 'queries' },
    browser: { used: 6.2, limit: 10, percent: 0.62, unit: 'minutes' },
    logs: { used: null, supported: false, billableBytes: 3.2 * 1024 * 1024, limit: 200000, percent: null, unit: 'events' },
    analytics: { writes: 72000, reads: null, readsSupported: false, writesLimit: 100000, readsLimit: 10000, writesPercent: 0.72, readsPercent: null, unit: { writes: 'points', reads: 'queries' } },
    workflows: { used: 49000, limit: 100000, percent: 0.49, unit: 'invocations' },
    ai: { used: 8200, limit: 10000, percent: 0.82, unit: 'neurons' },
    durableObjects: { requests: 18200, duration: 420, rowsRead: 620000, rowsWritten: 24000, sqlStorage: 1.4 * 1024 * 1024 * 1024, requestsLimit: 100000, durationLimit: 13000, rowsReadLimit: 5000000, rowsWrittenLimit: 100000, sqlStorageLimit: 5 * 1024 * 1024 * 1024, requestsPercent: 0.182, durationPercent: 0.032, rowsReadPercent: 0.124, rowsWrittenPercent: 0.24, sqlStoragePercent: 0.28 }
  };

  const ICONS = {
    workers: '<svg class="icon" viewBox="0 0 24 24" fill="none"><path d="M7 8h10M7 12h6M7 16h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="2"/></svg>',
    pages: '<svg class="icon" viewBox="0 0 24 24" fill="none"><path d="M4 5h16v14H4V5Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M4 9h16M8 5v14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    data: '<svg class="icon" viewBox="0 0 24 24" fill="none"><path d="M5 7c0-1.66 3.13-3 7-3s7 1.34 7 3-3.13 3-7 3-7-1.34-7-3Z" stroke="currentColor" stroke-width="2"/><path d="M5 7v5c0 1.66 3.13 3 7 3s7-1.34 7-3V7M5 12v5c0 1.66 3.13 3 7 3s7-1.34 7-3v-5" stroke="currentColor" stroke-width="2"/></svg>',
    storage: '<svg class="icon" viewBox="0 0 24 24" fill="none"><path d="M4 8.5 12 4l8 4.5V18l-8 4-8-4V8.5Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="m4.5 9 7.5 4 7.5-4M12 13v8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    queue: '<svg class="icon" viewBox="0 0 24 24" fill="none"><path d="M5 7h14M5 12h14M5 17h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M8 4v16M16 4v16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    graph: '<svg class="icon" viewBox="0 0 24 24" fill="none"><path d="M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    durable: '<svg class="icon" viewBox="0 0 24 24" fill="none"><path d="M7 8.5c0-1.38 2.24-2.5 5-2.5s5 1.12 5 2.5S14.76 11 12 11 7 9.88 7 8.5Z" stroke="currentColor" stroke-width="2"/><path d="M7 8.5v7c0 1.38 2.24 2.5 5 2.5s5-1.12 5-2.5v-7M7 12c0 1.38 2.24 2.5 5 2.5s5-1.12 5-2.5" stroke="currentColor" stroke-width="2"/></svg>',
    ai: '<svg class="icon" viewBox="0 0 24 24" fill="none"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.64 5.64l2.12 2.12M16.24 16.24l2.12 2.12M18.36 5.64l-2.12 2.12M7.76 16.24l-2.12 2.12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0Z" stroke="currentColor" stroke-width="2"/></svg>'
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

  function safeNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function hasMetricValue(value) {
    return value !== null && value !== undefined && Number.isFinite(Number(value));
  }

  function formatNumber(value) {
    const number = safeNumber(value);
    return number % 1 === 0 ? number.toLocaleString() : number.toLocaleString(undefined, { maximumFractionDigits: 1 });
  }

  function formatBytes(bytes) {
    const value = safeNumber(bytes);
    const GB = 1024 * 1024 * 1024;
    const MB = 1024 * 1024;
    if (value >= GB) return `${(value / GB).toFixed(1)} GB`;
    if (value >= MB) return `${(value / MB).toFixed(1)} MB`;
    return `${formatNumber(value)} B`;
  }

  function displayPercent(value) {
    if (!hasMetricValue(value)) return null;
    return Math.max(0, Math.round(Number(value) * 100));
  }

  function progressPercent(value) {
    const percent = displayPercent(value);
    return percent === null ? 0 : Math.min(100, percent);
  }

  function isVisibleMetric(item) {
    const percent = displayPercent(item.percent);
    return percent !== null && percent > 0;
  }

  function statusForPercent(percent) {
    if (!hasMetricValue(percent)) return { level: 'info', label: 'Info' };
    const value = Number(percent);
    if (value >= 0.95) return { level: 'danger', label: 'Critical' };
    if (value >= 0.8) return { level: 'warning', label: 'Watch' };
    return { level: 'good', label: 'OK' };
  }

  function metric(service, label, source, options = {}) {
    return {
      service,
      label,
      title: `${service} ${label}`,
      icon: options.icon || 'graph',
      period: options.period || 'Daily',
      used: source?.used,
      limit: source?.limit,
      percent: source?.percent,
      unit: source?.unit,
      format: options.format || 'number',
      unavailable: options.unavailable || false
    };
  }

  function buildMetrics(q = {}) {
    return [
      metric('Workers', 'Requests', q.workers, { icon: 'workers' }),
      metric('Pages', 'Builds', q.pages, { icon: 'pages', period: 'Monthly' }),
      metric('KV', 'Reads', { used: q.kv?.reads, limit: q.kv?.readsLimit, percent: q.kv?.readsPercent, unit: 'reads' }, { icon: 'data' }),
      metric('KV', 'Writes', { used: q.kv?.writes, limit: q.kv?.writesLimit, percent: q.kv?.writesPercent, unit: 'writes' }, { icon: 'data' }),
      metric('KV', 'Deletes', { used: q.kv?.deletes, limit: q.kv?.deletesLimit, percent: q.kv?.deletesPercent, unit: 'deletes' }, { icon: 'data' }),
      metric('KV', 'Lists', { used: q.kv?.lists, limit: q.kv?.listsLimit, percent: q.kv?.listsPercent, unit: 'lists' }, { icon: 'data' }),
      metric('D1', 'Reads', { used: q.d1?.reads, limit: q.d1?.readsLimit, percent: q.d1?.readsPercent, unit: 'rows' }, { icon: 'data' }),
      metric('D1', 'Writes', { used: q.d1?.writes, limit: q.d1?.writesLimit, percent: q.d1?.writesPercent, unit: 'rows' }, { icon: 'data' }),
      metric('R2', 'Storage', { used: q.r2?.storage, limit: q.r2?.storageLimit, percent: q.r2?.storagePercent }, { icon: 'storage', period: 'Monthly', format: 'bytes' }),
      metric('R2', 'Class A', { used: q.r2?.classA, limit: q.r2?.classALimit, percent: q.r2?.classAPercent, unit: 'ops' }, { icon: 'storage', period: 'Monthly' }),
      metric('R2', 'Class B', { used: q.r2?.classB, limit: q.r2?.classBLimit, percent: q.r2?.classBPercent, unit: 'ops' }, { icon: 'storage', period: 'Monthly' }),
      metric('Queues', 'Ops', q.queues, { icon: 'queue' }),
      metric('Hyperdrive', 'Queries', q.hyperdrive, { icon: 'data' }),
      metric('Browser Run', 'Minutes', q.browser, { icon: 'graph' }),
      metric('Workers Logs', 'Events', q.logs, { icon: 'graph', unavailable: q.logs?.supported === false }),
      metric('Logs', 'Ingested', { used: q.logs?.billableBytes, limit: null, percent: null, unit: '' }, { icon: 'graph', format: 'bytes' }),
      metric('Analytics', 'Points', { used: q.analytics?.writes, limit: q.analytics?.writesLimit, percent: q.analytics?.writesPercent, unit: q.analytics?.unit?.writes }, { icon: 'graph' }),
      metric('Analytics', 'Queries', { used: q.analytics?.reads, limit: q.analytics?.readsLimit, percent: q.analytics?.readsPercent, unit: q.analytics?.unit?.reads }, { icon: 'graph', unavailable: q.analytics?.readsSupported === false }),
      metric('Workflows', 'Invocations', q.workflows, { icon: 'queue' }),
      metric('Workers AI', 'Neurons', q.ai, { icon: 'ai' }),
      metric('DO', 'Requests', { used: q.durableObjects?.requests, limit: q.durableObjects?.requestsLimit, percent: q.durableObjects?.requestsPercent, unit: 'requests' }, { icon: 'durable' }),
      metric('DO', 'Duration', { used: q.durableObjects?.duration, limit: q.durableObjects?.durationLimit, percent: q.durableObjects?.durationPercent, unit: 'GB-s' }, { icon: 'durable' }),
      metric('DO', 'Rows Read', { used: q.durableObjects?.rowsRead, limit: q.durableObjects?.rowsReadLimit, percent: q.durableObjects?.rowsReadPercent, unit: 'rows' }, { icon: 'durable' }),
      metric('DO', 'Rows Written', { used: q.durableObjects?.rowsWritten, limit: q.durableObjects?.rowsWrittenLimit, percent: q.durableObjects?.rowsWrittenPercent, unit: 'rows' }, { icon: 'durable' }),
      metric('DO', 'SQL Storage', { used: q.durableObjects?.sqlStorage, limit: q.durableObjects?.sqlStorageLimit, percent: q.durableObjects?.sqlStoragePercent }, { icon: 'durable', period: 'Total', format: 'bytes' })
    ];
  }

  function valueText(item) {
    if (item.unavailable || !hasMetricValue(item.used)) return 'N/A';
    return item.format === 'bytes' ? formatBytes(item.used) : formatNumber(item.used);
  }

  function limitText(item) {
    if (item.unavailable) return item.limit ? `${formatNumber(item.limit)} ${item.unit || ''}`.trim() : 'API metric';
    if (!hasMetricValue(item.limit)) return item.unit || 'tracked';
    const limit = item.format === 'bytes' ? formatBytes(item.limit) : formatNumber(item.limit);
    return `${limit}${item.unit ? ` ${item.unit}` : ''}`;
  }

  function sortByAttention(metrics) {
    return [...metrics].sort((a, b) => {
      const aPercent = hasMetricValue(a.percent) ? Number(a.percent) : -1;
      const bPercent = hasMetricValue(b.percent) ? Number(b.percent) : -1;
      if (bPercent !== aPercent) return bPercent - aPercent;
      return a.title.localeCompare(b.title);
    });
  }

  function renderFocusItem(item) {
    const status = statusForPercent(item.percent);
    const percent = displayPercent(item.percent);
    return `
      <article class="attention-item is-${status.level}">
        <div>
          <strong>${escapeHtml(percent === null ? 'Info' : `${percent}%`)}</strong>
          <span>${escapeHtml(item.title)}</span>
        </div>
        <em>${escapeHtml(valueText(item))}</em>
      </article>
    `;
  }

  function renderMiniCard(item) {
    const status = statusForPercent(item.percent);
    const percent = displayPercent(item.percent);
    const progress = progressPercent(item.percent);
    return `
      <article class="mini-card is-${status.level}">
        <div class="mini-card__top">
          <div class="mini-icon" aria-hidden="true">${ICONS[item.icon] || ICONS.graph}</div>
          <span>${escapeHtml(percent === null ? status.label : `${percent}%`)}</span>
        </div>
        <h3>${escapeHtml(item.service)}</h3>
        <p>${escapeHtml(item.label)}</p>
        <strong>${escapeHtml(valueText(item))}</strong>
        <small>/${escapeHtml(limitText(item))}</small>
        <div class="progress" aria-label="${escapeHtml(item.title)} usage ${progress}%">
          <div class="progress-inner" style="--progress: ${progress}%"></div>
        </div>
      </article>
    `;
  }

  function setStatus(message, type = '') {
    statusEl.textContent = message;
    statusEl.className = type ? `state-panel ${type}` : 'state-panel';
  }

  function updateSummary(metrics) {
    const ranked = sortByAttention(metrics).filter(item => hasMetricValue(item.percent));
    const top = ranked[0];
    const critical = metrics.filter(item => hasMetricValue(item.percent) && Number(item.percent) >= 0.95).length;
    const watch = metrics.filter(item => hasMetricValue(item.percent) && Number(item.percent) >= 0.8 && Number(item.percent) < 0.95).length;

    criticalCountEl.textContent = String(critical);
    watchCountEl.textContent = String(watch);
    trackedCountEl.textContent = String(metrics.length);
    if (summaryBadge) summaryBadge.textContent = critical ? 'Critical' : watch ? 'Watch' : 'Healthy';
    topPercentEl.textContent = top ? `${displayPercent(top.percent)}%` : '--';
    topLabelEl.textContent = top ? top.title : 'No quota data';
  }

  function renderQuotas(quotas) {
    cardsEl.innerHTML = '';
    focusStripEl.innerHTML = '';
    if (!quotas) {
      setStatus('Add a Cloudflare API token and account ID in Settings.', 'is-error');
      cardsEl.hidden = true;
      focusStripEl.hidden = true;
      if (summaryBadge) summaryBadge.textContent = 'Setup';
      topPercentEl.textContent = '--';
      topLabelEl.textContent = 'Not configured';
      criticalCountEl.textContent = '0';
      watchCountEl.textContent = '0';
      trackedCountEl.textContent = '0';
      return;
    }

    setStatus('');
    const metrics = buildMetrics(quotas).filter(isVisibleMetric);
    const ranked = sortByAttention(metrics);
    updateSummary(metrics);

    if (!ranked.length) {
      setStatus('No non-zero quota usage in the latest sample.');
      focusStripEl.hidden = true;
      cardsEl.hidden = true;
      return;
    }

    focusStripEl.hidden = false;
    cardsEl.hidden = false;
    focusStripEl.innerHTML = ranked.slice(0, 3).map(renderFocusItem).join('');
    cardsEl.innerHTML = ranked.map(renderMiniCard).join('');
  }

  function loadData() {
    if (!hasChromeRuntime) {
      if (summaryBadge) summaryBadge.textContent = 'Demo';
      renderQuotas(DEMO_QUOTAS);
      return;
    }

    chrome.runtime.sendMessage({ action: 'getQuotas' }, response => {
      renderQuotas(response ? response.data : null);
    });
  }

  refreshBtn.addEventListener('click', () => {
    if (!hasChromeRuntime) {
      if (summaryBadge) summaryBadge.textContent = 'Demo';
      renderQuotas(DEMO_QUOTAS);
      return;
    }

    refreshBtn.disabled = true;
    setStatus('Refreshing quota data...');
    chrome.runtime.sendMessage({ action: 'refreshQuotas' }, response => {
      refreshBtn.disabled = false;
      renderQuotas(response ? response.data : null);
    });
  });

  dashboardBtn.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.runtime) {
      chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
      return;
    }

    window.location.href = 'dashboard.html';
  });

  loadData();
});
