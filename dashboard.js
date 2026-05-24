// dashboard.js
// Renders grouped quota dashboard cards and dense list rows.

document.addEventListener('DOMContentLoaded', () => {
  const contentEl = document.getElementById('dashboard-content');
  const refreshBtn = document.getElementById('refreshDashboard');
  const refreshLabel = refreshBtn.querySelector('[data-label]') || refreshBtn.querySelector('span');
  const cardViewBtn = document.getElementById('cardViewBtn');
  const listViewBtn = document.getElementById('listViewBtn');
  const dashboardSummary = document.getElementById('dashboardSummary');
  const hasChromeStorage = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
  const hasChromeRuntime = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage;

  let currentView = localStorage.getItem('quotaDashboardView') || 'cards';
  let lastQuotas = null;
  let lastHistory = [];

  const GROUPS = [
    { id: 'compute', title: 'Compute & Runtime' },
    { id: 'storage', title: 'Storage & Databases' },
    { id: 'messaging', title: 'Messaging & Data Plane' },
    { id: 'insights', title: 'Analytics & Logs' }
  ];

  const DEMO_QUOTAS = {
    workers: { used: 85420, limit: 100000, percent: 0.8542, unit: 'requests', period: 'daily' },
    pages: { used: 210, limit: 500, percent: 0.42, unit: 'builds', period: 'monthly' },
    kv: { reads: 1215000, writes: 680, deletes: 120, lists: 48, readsLimit: 100000, writesLimit: 1000, deletesLimit: 1000, listsLimit: 1000, readsPercent: 0.1215, writesPercent: 0.68, deletesPercent: 0.12, listsPercent: 0.048, period: 'daily' },
    d1: { reads: 3800000, writes: 94000, readsLimit: 5000000, writesLimit: 100000, readsPercent: 0.76, writesPercent: 0.94, period: 'daily' },
    r2: { storage: 7.5 * 1024 * 1024 * 1024, classA: 640000, classB: 1800000, storageLimit: 10 * 1024 * 1024 * 1024, classALimit: 1000000, classBLimit: 10000000, storagePercent: 0.75, classAPercent: 0.64, classBPercent: 0.18, period: { storage: 'monthly', ops: 'monthly' } },
    queues: { used: 3600, limit: 10000, percent: 0.36, unit: 'ops', period: 'daily' },
    hyperdrive: { used: 48000, limit: 100000, percent: 0.48, unit: 'queries', period: 'daily' },
    browser: { used: 6.2, limit: 10, percent: 0.62, unit: 'minutes', period: 'daily' },
    logs: { used: null, supported: false, billableBytes: 3.2 * 1024 * 1024, limit: 200000, percent: null, unit: 'events', period: 'daily' },
    analytics: { writes: 72000, reads: null, readsSupported: false, writesLimit: 100000, readsLimit: 10000, writesPercent: 0.72, readsPercent: null, unit: { writes: 'points', reads: 'queries' }, period: { writes: 'daily', reads: 'daily' } },
    workflows: { used: 49000, limit: 100000, percent: 0.49, unit: 'invocations', period: 'daily' },
    ai: { used: 8200, limit: 10000, percent: 0.82, unit: 'neurons', period: 'daily' },
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

  function statusForPercent(percent) {
    if (!hasMetricValue(percent)) return { level: 'good', label: 'Info' };
    const value = Number(percent);
    if (value >= 0.95) return { level: 'danger', label: 'Action' };
    if (value >= 0.8) return { level: 'warning', label: 'Watch' };
    return { level: 'good', label: 'Healthy' };
  }

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function drawLineChart(canvas, values, maxValue, statusLevel) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const width = rect.width;
    const height = rect.height;
    const series = Array.isArray(values) ? values.map(safeNumber) : [];
    const maxSeries = Math.max(...series, 0);
    const ceiling = Math.max(safeNumber(maxValue), maxSeries, 1);
    const lineColor = statusLevel === 'danger' ? cssVar('--danger') : statusLevel === 'warning' ? cssVar('--primary') : cssVar('--primary-hot');

    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = cssVar('--outline');
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    [0.35, 0.7].forEach(position => {
      const y = Math.round(height * position) + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    if (!series.length) return;

    const points = series.map((value, index) => {
      const x = series.length === 1 ? width / 2 : (index / (series.length - 1)) * width;
      const y = height - 5 - (value / ceiling) * (height - 12);
      return { x, y };
    });

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(243, 128, 32, 0.18)');
    gradient.addColorStop(1, 'rgba(243, 128, 32, 0)');

    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.lineTo(points[points.length - 1].x, height);
    ctx.lineTo(points[0].x, height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    const latest = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(latest.x, latest.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = lineColor;
    ctx.fill();
  }

  function buildMetricDefinitions(quotas) {
    const q = quotas || {};
    return [
      { key: 'workers', group: 'compute', title: 'Workers Requests', icon: 'workers', period: 'Daily', used: q.workers?.used, limit: q.workers?.limit, percent: q.workers?.percent, unit: q.workers?.unit },
      { key: 'pages', group: 'compute', title: 'Pages Builds', icon: 'pages', period: 'Monthly', used: q.pages?.used, limit: q.pages?.limit, percent: q.pages?.percent, unit: q.pages?.unit },
      { key: 'browser', group: 'compute', title: 'Browser Run Minutes', icon: 'graph', period: 'Daily', used: q.browser?.used, limit: q.browser?.limit, percent: q.browser?.percent, unit: q.browser?.unit },
      { key: 'workflows', group: 'compute', title: 'Workflows Invocations', icon: 'queue', period: 'Daily', used: q.workflows?.used, limit: q.workflows?.limit, percent: q.workflows?.percent, unit: q.workflows?.unit },
      { key: 'ai', group: 'compute', title: 'Workers AI Neurons', icon: 'ai', period: 'Daily', used: q.ai?.used, limit: q.ai?.limit, percent: q.ai?.percent, unit: q.ai?.unit },
      { key: 'kvReads', group: 'storage', title: 'KV Reads', icon: 'data', period: 'Daily', used: q.kv?.reads, limit: q.kv?.readsLimit, percent: q.kv?.readsPercent, unit: 'reads' },
      { key: 'kvWrites', group: 'storage', title: 'KV Writes', icon: 'data', period: 'Daily', used: q.kv?.writes, limit: q.kv?.writesLimit, percent: q.kv?.writesPercent, unit: 'writes' },
      { key: 'kvDeletes', group: 'storage', title: 'KV Deletes', icon: 'data', period: 'Daily', used: q.kv?.deletes, limit: q.kv?.deletesLimit, percent: q.kv?.deletesPercent, unit: 'deletes' },
      { key: 'kvLists', group: 'storage', title: 'KV Lists', icon: 'data', period: 'Daily', used: q.kv?.lists, limit: q.kv?.listsLimit, percent: q.kv?.listsPercent, unit: 'lists' },
      { key: 'd1Reads', group: 'storage', title: 'D1 Rows Read', icon: 'data', period: 'Daily', used: q.d1?.reads, limit: q.d1?.readsLimit, percent: q.d1?.readsPercent, unit: 'rows' },
      { key: 'd1Writes', group: 'storage', title: 'D1 Rows Written', icon: 'data', period: 'Daily', used: q.d1?.writes, limit: q.d1?.writesLimit, percent: q.d1?.writesPercent, unit: 'rows' },
      { key: 'r2Storage', group: 'storage', title: 'R2 Storage', icon: 'storage', period: 'Monthly', used: q.r2?.storage, limit: q.r2?.storageLimit, percent: q.r2?.storagePercent, format: 'bytes' },
      { key: 'doRequests', group: 'storage', title: 'DO Requests', icon: 'durable', period: 'Daily', used: q.durableObjects?.requests, limit: q.durableObjects?.requestsLimit, percent: q.durableObjects?.requestsPercent, unit: 'requests' },
      { key: 'doDuration', group: 'storage', title: 'DO Duration', icon: 'durable', period: 'Daily', used: q.durableObjects?.duration, limit: q.durableObjects?.durationLimit, percent: q.durableObjects?.durationPercent, unit: 'GB-s' },
      { key: 'doRowsRead', group: 'storage', title: 'DO Rows Read', icon: 'durable', period: 'Daily', used: q.durableObjects?.rowsRead, limit: q.durableObjects?.rowsReadLimit, percent: q.durableObjects?.rowsReadPercent, unit: 'rows' },
      { key: 'doRowsWritten', group: 'storage', title: 'DO Rows Written', icon: 'durable', period: 'Daily', used: q.durableObjects?.rowsWritten, limit: q.durableObjects?.rowsWrittenLimit, percent: q.durableObjects?.rowsWrittenPercent, unit: 'rows' },
      { key: 'doSqlStorage', group: 'storage', title: 'DO SQL Storage', icon: 'durable', period: 'Total', used: q.durableObjects?.sqlStorage, limit: q.durableObjects?.sqlStorageLimit, percent: q.durableObjects?.sqlStoragePercent, format: 'bytes' },
      { key: 'r2ClassA', group: 'messaging', title: 'R2 Class A Ops', icon: 'storage', period: 'Monthly', used: q.r2?.classA, limit: q.r2?.classALimit, percent: q.r2?.classAPercent, unit: 'ops' },
      { key: 'r2ClassB', group: 'messaging', title: 'R2 Class B Ops', icon: 'storage', period: 'Monthly', used: q.r2?.classB, limit: q.r2?.classBLimit, percent: q.r2?.classBPercent, unit: 'ops' },
      { key: 'queues', group: 'messaging', title: 'Queues Operations', icon: 'queue', period: 'Daily', used: q.queues?.used, limit: q.queues?.limit, percent: q.queues?.percent, unit: q.queues?.unit },
      { key: 'hyperdrive', group: 'messaging', title: 'Hyperdrive Queries', icon: 'data', period: 'Daily', used: q.hyperdrive?.used, limit: q.hyperdrive?.limit, percent: q.hyperdrive?.percent, unit: q.hyperdrive?.unit },
      { key: 'logs', group: 'insights', title: 'Workers Logs Events', icon: 'graph', period: 'Daily', used: q.logs?.used, limit: q.logs?.limit, percent: q.logs?.percent, unit: q.logs?.unit, unavailable: q.logs?.supported === false },
      { key: 'logsBytes', group: 'insights', title: 'Log Ingestion Bytes', icon: 'graph', period: 'Daily', used: q.logs?.billableBytes, limit: null, percent: null, format: 'bytes' },
      { key: 'analyticsWrites', group: 'insights', title: 'Analytics Points', icon: 'graph', period: 'Daily', used: q.analytics?.writes, limit: q.analytics?.writesLimit, percent: q.analytics?.writesPercent, unit: q.analytics?.unit?.writes },
      { key: 'analyticsReads', group: 'insights', title: 'Analytics Queries', icon: 'graph', period: 'Daily', used: q.analytics?.reads, limit: q.analytics?.readsLimit, percent: q.analytics?.readsPercent, unit: q.analytics?.unit?.reads, unavailable: q.analytics?.readsSupported === false }
    ];
  }

  function buildHistorySeries(history) {
    const series = {};
    buildMetricDefinitions(DEMO_QUOTAS).forEach(metric => {
      series[metric.key] = [];
    });

    if (Array.isArray(history)) {
      history.forEach(entry => {
        buildMetricDefinitions(entry.quotas || {}).forEach(metric => {
          series[metric.key].push(safeNumber(metric.used));
        });
      });
    }

    Object.keys(series).forEach(key => {
      if (series[key].length > 30) {
        series[key] = series[key].slice(series[key].length - 30);
      }
    });

    return series;
  }

  function formatUsed(metric) {
    if (metric.unavailable || !hasMetricValue(metric.used)) return 'Not available';
    return metric.format === 'bytes' ? formatBytes(metric.used) : formatNumber(metric.used);
  }

  function formatLimit(metric) {
    if (metric.unavailable) return metric.limit ? `${formatNumber(metric.limit)} ${metric.unit || ''}`.trim() : 'API metric';
    if (!hasMetricValue(metric.limit)) return metric.unit || 'tracked';
    const limit = metric.format === 'bytes' ? formatBytes(metric.limit) : formatNumber(metric.limit);
    return `${limit}${metric.unit ? ` ${metric.unit}` : ''}`;
  }

  function metricPercentLabel(metric) {
    const percent = displayPercent(metric.percent);
    return percent === null ? 'Info' : `${percent}%`;
  }

  function createMetricCard(metric, historySeries) {
    const status = statusForPercent(metric.percent);
    const progress = progressPercent(metric.percent);
    const card = document.createElement('article');
    card.className = `dashboard-card is-${status.level}`;
    card.innerHTML = `
      <div class="dashboard-card__top">
        <div class="service-heading">
          <div class="service-icon" aria-hidden="true">${ICONS[metric.icon] || ICONS.graph}</div>
          <div>
            <h3 class="service-title">${escapeHtml(metric.title)}</h3>
            <p class="service-period">${escapeHtml(metric.period)}</p>
          </div>
        </div>
        <span class="status-badge is-${status.level}">${escapeHtml(metricPercentLabel(metric))}</span>
      </div>
      <p class="dashboard-value">${escapeHtml(formatUsed(metric))}</p>
      <p class="dashboard-meta">Used / ${escapeHtml(formatLimit(metric))}</p>
      <div class="progress" aria-label="${escapeHtml(metric.title)} usage ${progress}%">
        <div class="progress-inner" style="--progress: ${progress}%"></div>
      </div>
      <div class="chart-container">
        <canvas aria-label="${escapeHtml(metric.title)} trend chart"></canvas>
      </div>
    `;

    requestAnimationFrame(() => {
      const canvas = card.querySelector('canvas');
      const values = historySeries[metric.key]?.length ? historySeries[metric.key] : [safeNumber(metric.used)];
      drawLineChart(canvas, values, metric.limit, status.level);
    });

    return card;
  }

  function createMetricListRow(metric) {
    const status = statusForPercent(metric.percent);
    const progress = progressPercent(metric.percent);
    const row = document.createElement('article');
    row.className = `dashboard-list-row is-${status.level}`;
    row.innerHTML = `
      <div class="dashboard-list-main">
        <div class="service-icon" aria-hidden="true">${ICONS[metric.icon] || ICONS.graph}</div>
        <div>
          <h3>${escapeHtml(metric.title)}</h3>
          <p>${escapeHtml(metric.period)}</p>
        </div>
      </div>
      <strong>${escapeHtml(formatUsed(metric))}</strong>
      <span>/${escapeHtml(formatLimit(metric))}</span>
      <span class="status-badge is-${status.level}">${escapeHtml(metricPercentLabel(metric))}</span>
      <div class="progress" aria-label="${escapeHtml(metric.title)} usage ${progress}%">
        <div class="progress-inner" style="--progress: ${progress}%"></div>
      </div>
    `;
    return row;
  }

  function groupStatus(metrics) {
    const ranked = metrics.filter(metric => hasMetricValue(metric.percent)).sort((a, b) => Number(b.percent) - Number(a.percent));
    return ranked[0] ? statusForPercent(ranked[0].percent) : { level: 'good', label: 'Info' };
  }

  function renderGroup(group, metrics, historySeries) {
    const section = document.createElement('section');
    const status = groupStatus(metrics);
    section.className = `dashboard-group is-${status.level}`;
    section.innerHTML = `
      <div class="dashboard-group__header">
        <div>
          <h2>${escapeHtml(group.title)}</h2>
          <p>${metrics.length} tracked metrics</p>
        </div>
        <span class="status-badge is-${status.level}">${escapeHtml(status.label)}</span>
      </div>
    `;

    const body = document.createElement('div');
    body.className = currentView === 'list' ? 'dashboard-list' : 'dashboard-grid';
    metrics.forEach(metric => {
      body.appendChild(currentView === 'list' ? createMetricListRow(metric) : createMetricCard(metric, historySeries));
    });
    section.appendChild(body);
    contentEl.appendChild(section);
  }

  function updateViewButtons() {
    const isList = currentView === 'list';
    cardViewBtn.classList.toggle('is-active', !isList);
    listViewBtn.classList.toggle('is-active', isList);
    cardViewBtn.setAttribute('aria-pressed', String(!isList));
    listViewBtn.setAttribute('aria-pressed', String(isList));
    contentEl.className = `dashboard-content is-${isList ? 'list' : 'card'}-view`;
  }

  function renderEmpty() {
    contentEl.innerHTML = '';
    const empty = document.createElement('div');
    empty.className = 'state-panel is-error';
    empty.textContent = 'No quota data available. Configure your API token and account ID in Settings, then refresh.';
    contentEl.appendChild(empty);
    dashboardSummary.textContent = 'Setup needed';
  }

  function renderDashboard(quotas, history) {
    contentEl.innerHTML = '';
    updateViewButtons();
    if (!quotas) {
      renderEmpty();
      return;
    }

    const metrics = buildMetricDefinitions(quotas);
    const historySeries = buildHistorySeries(history);
    GROUPS.forEach(group => {
      renderGroup(group, metrics.filter(metric => metric.group === group.id), historySeries);
    });

    const sampleCount = Array.isArray(history) ? Math.min(history.length, 30) : 0;
    dashboardSummary.textContent = sampleCount ? `Last ${sampleCount} samples` : 'Latest sample';
  }

  function loadAndRender() {
    if (!hasChromeStorage) {
      const demoHistory = Array.from({ length: 12 }, (_, index) => ({
        quotas: {
          ...DEMO_QUOTAS,
          workers: { ...DEMO_QUOTAS.workers, used: 52000 + index * 2800 },
          pages: { ...DEMO_QUOTAS.pages, used: 130 + index * 7 },
          d1: { ...DEMO_QUOTAS.d1, writes: 42000 + index * 4700 },
          ai: { ...DEMO_QUOTAS.ai, used: 4100 + index * 360 }
        }
      }));
      lastQuotas = DEMO_QUOTAS;
      lastHistory = demoHistory;
      renderDashboard(DEMO_QUOTAS, demoHistory);
      dashboardSummary.textContent = 'Demo data';
      return;
    }

    chrome.storage.local.get(['quotas', 'history'], res => {
      lastQuotas = res.quotas;
      lastHistory = res.history || [];
      renderDashboard(lastQuotas, lastHistory);
    });
  }

  function setViewMode(mode) {
    currentView = mode;
    localStorage.setItem('quotaDashboardView', currentView);
    renderDashboard(lastQuotas, lastHistory);
  }

  cardViewBtn.addEventListener('click', () => setViewMode('cards'));
  listViewBtn.addEventListener('click', () => setViewMode('list'));

  refreshBtn.addEventListener('click', () => {
    if (!hasChromeRuntime) {
      loadAndRender();
      return;
    }

    refreshBtn.disabled = true;
    if (refreshLabel) refreshLabel.textContent = 'Refreshing...';
    chrome.runtime.sendMessage({ action: 'refreshQuotas' }, () => {
      loadAndRender();
      refreshBtn.disabled = false;
      if (refreshLabel) refreshLabel.textContent = 'Refresh now';
    });
  });

  window.addEventListener('resize', () => renderDashboard(lastQuotas, lastHistory));

  loadAndRender();
});
