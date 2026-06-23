// dashboard.js
// Renders grouped quota dashboard cards and dense list rows.

document.addEventListener('DOMContentLoaded', () => {
  const contentEl = document.getElementById('dashboard-content');
  const refreshBtn = document.getElementById('refreshDashboard');
  const refreshLabel = refreshBtn.querySelector('[data-label]') || refreshBtn.querySelector('span');
  const cardViewBtn = document.getElementById('cardViewBtn');
  const listViewBtn = document.getElementById('listViewBtn');
  const dashboardSummary = document.getElementById('dashboardSummary');
  const refreshStatusEl = document.getElementById('dashboardRefreshStatus');
  const refreshStatusTitle = document.getElementById('dashboardRefreshTitle');
  const refreshStatusDetail = document.getElementById('dashboardRefreshDetail');
  const refreshProgress = document.getElementById('dashboardRefreshProgress');
  const chartModal = document.getElementById('chartModal');
  const chartModalClose = document.getElementById('chartModalClose');
  const chartModalCanvas = document.getElementById('chartModalCanvas');
  const chartModalTitle = document.getElementById('chartModalTitle');
  const chartModalMeta = document.getElementById('chartModalMeta');
  const chartModalPercent = document.getElementById('chartModalPercent');
  const chartModalLatest = document.getElementById('chartModalLatest');
  const chartModalLow = document.getElementById('chartModalLow');
  const chartModalHigh = document.getElementById('chartModalHigh');
  const dashboardTitle = document.getElementById('dashboardTitle');
  const dashboardSubtitle = document.getElementById('dashboardSubtitle');
  const dashboardAccountContext = document.getElementById('dashboardAccountContext');
  const hasChromeStorage = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
  const hasChromeRuntime = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage;

  let currentView = localStorage.getItem('quotaDashboardView') || 'cards';
  let lastQuotas = null;
  let lastHistory = [];
  let lastOverview = null;
  let selectedProfileId = new URLSearchParams(window.location.search).get('profile') || '';
  let activeChartKey = null;
  let refreshProgressTimer = null;
  let refreshCompleteTimer = null;

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

  function riskColorForPercent(percent) {
    if (!hasMetricValue(percent)) return cssVar('--risk-low') || cssVar('--success');
    const value = Math.max(0, Number(percent));
    if (value >= 0.95) return cssVar('--risk-critical') || cssVar('--danger');
    if (value >= 0.8) return cssVar('--risk-high') || cssVar('--primary-hot');
    if (value >= 0.6) return cssVar('--risk-elevated') || cssVar('--primary');
    if (value >= 0.4) return cssVar('--risk-watch') || cssVar('--warning');
    if (value >= 0.2) return cssVar('--risk-ready') || cssVar('--success');
    return cssVar('--risk-low') || cssVar('--success');
  }

  function chartScale(series, maxValue, adaptiveScale) {
    const maxSeries = Math.max(...series, 0);
    if (!adaptiveScale) {
      return { min: 0, max: Math.max(safeNumber(maxValue), maxSeries, 1) };
    }

    const minSeries = Math.min(...series);
    const spread = Math.max(maxSeries - minSeries, Math.abs(maxSeries) * 0.08, 1);
    return {
      min: Math.max(0, minSeries - spread),
      max: Math.max(maxSeries + spread, 1)
    };
  }

  function drawLineChart(canvas, values, maxValue, lineColor, options = {}) {
    if (!canvas) return;
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
    const scale = series.length ? chartScale(series, maxValue, options.adaptiveScale) : { min: 0, max: 1 };
    const range = Math.max(scale.max - scale.min, 1);
    const strokeColor = lineColor || cssVar('--risk-low') || cssVar('--success');

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
      const y = height - 5 - ((value - scale.min) / range) * (height - 12);
      return { x, y };
    });

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(243, 128, 32, 0.16)');
    gradient.addColorStop(1, 'rgba(15, 138, 95, 0)');

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
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    const latest = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(latest.x, latest.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = strokeColor;
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
    if (metric.unavailable || !hasMetricValue(metric.used)) return t('Not available');
    return metric.format === 'bytes' ? formatBytes(metric.used) : formatNumber(metric.used);
  }

  function formatLimit(metric) {
    if (metric.unavailable) return metric.limit ? `${formatNumber(metric.limit)} ${metric.unit || ''}`.trim() : t('API metric');
    if (!hasMetricValue(metric.limit)) return metric.unit || t('tracked');
    const limit = metric.format === 'bytes' ? formatBytes(metric.limit) : formatNumber(metric.limit);
    return `${limit}${metric.unit ? ` ${metric.unit}` : ''}`;
  }

  function metricPercentLabel(metric) {
    const percent = displayPercent(metric.percent);
    return percent === null ? 'Info' : `${percent}%`;
  }

  function t(value) {
    return window.quotaI18n?.t ? window.quotaI18n.t(value) : value;
  }

  function formatMetricValue(metric, value) {
    return metric.format === 'bytes' ? formatBytes(value) : formatNumber(value);
  }

  function historyValuesForMetric(metric) {
    const historySeries = buildHistorySeries(lastHistory);
    return historySeries[metric.key]?.length ? historySeries[metric.key] : [safeNumber(metric.used)];
  }

  function openChartModal(metricKey) {
    if (!chartModal || !chartModalCanvas) return;
    const metric = buildMetricDefinitions(lastQuotas || DEMO_QUOTAS).find(item => item.key === metricKey);
    if (!metric) return;

    activeChartKey = metricKey;
    const values = historyValuesForMetric(metric);
    const latest = values[values.length - 1] || safeNumber(metric.used);
    const low = Math.min(...values, latest);
    const high = Math.max(...values, latest);
    const status = statusForPercent(metric.percent);
    const riskColor = riskColorForPercent(metric.percent);

    if (chartModalTitle) chartModalTitle.textContent = metric.title;
    if (chartModalMeta) {
      chartModalMeta.textContent = `${metric.period} trend across ${values.length} stored sample${values.length === 1 ? '' : 's'}. Adaptive scale emphasizes movement; quota risk stays on the card percent.`;
    }
    if (chartModalPercent) {
      chartModalPercent.textContent = metricPercentLabel(metric);
      chartModalPercent.className = `status-badge is-${status.level}`;
    }
    if (chartModalLatest) chartModalLatest.textContent = formatMetricValue(metric, latest);
    if (chartModalLow) chartModalLow.textContent = formatMetricValue(metric, low);
    if (chartModalHigh) chartModalHigh.textContent = formatMetricValue(metric, high);

    chartModal.hidden = false;
    document.body.classList.add('is-modal-open');
    requestAnimationFrame(() => {
      drawLineChart(chartModalCanvas, values, metric.limit, riskColor, { adaptiveScale: true });
    });
  }

  function closeChartModal() {
    if (!chartModal) return;
    chartModal.hidden = true;
    activeChartKey = null;
    document.body.classList.remove('is-modal-open');
  }

  function createMetricCard(metric, historySeries) {
    const status = statusForPercent(metric.percent);
    const progress = progressPercent(metric.percent);
    const riskColor = riskColorForPercent(metric.percent);
    const card = document.createElement('article');
    card.className = `dashboard-card is-${status.level}`;
    card.innerHTML = `
      <div class="dashboard-card__top">
        <div class="service-heading">
          <div class="service-icon" aria-hidden="true">${ICONS[metric.icon] || ICONS.graph}</div>
          <div>
            <h3 class="service-title">${escapeHtml(metric.title)}</h3>
            <p class="service-period">${escapeHtml(t(metric.period))}</p>
          </div>
        </div>
        <span class="status-badge is-${status.level}">${escapeHtml(metricPercentLabel(metric))}</span>
      </div>
      <p class="dashboard-value">${escapeHtml(formatUsed(metric))}</p>
      <p class="dashboard-meta">${escapeHtml(t('Used'))} / ${escapeHtml(formatLimit(metric))}</p>
      <div class="progress" aria-label="${escapeHtml(metric.title)} usage ${progress}%">
        <div class="progress-inner" style="--progress: ${progress}%; --risk-color: ${escapeHtml(riskColor)}"></div>
      </div>
      <div class="chart-container" data-chart-key="${escapeHtml(metric.key)}" role="button" tabindex="0" aria-label="Open enlarged ${escapeHtml(metric.title)} trend chart" title="Open enlarged trend chart">
        <canvas aria-label="${escapeHtml(metric.title)} trend chart"></canvas>
        <span class="chart-expand" aria-hidden="true">
          <svg class="icon" viewBox="0 0 24 24" fill="none">
            <path d="M9 5H5v4M15 5h4v4M19 15v4h-4M5 15v4h4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </div>
    `;

    requestAnimationFrame(() => {
      const canvas = card.querySelector('canvas');
      const values = historySeries[metric.key]?.length ? historySeries[metric.key] : [safeNumber(metric.used)];
      drawLineChart(canvas, values, metric.limit, riskColor, { adaptiveScale: true });
    });

    return card;
  }

  function createMetricListRow(metric) {
    const status = statusForPercent(metric.percent);
    const progress = progressPercent(metric.percent);
    const riskColor = riskColorForPercent(metric.percent);
    const row = document.createElement('article');
    row.className = `dashboard-list-row is-${status.level}`;
    row.innerHTML = `
      <div class="dashboard-list-main">
        <div class="service-icon" aria-hidden="true">${ICONS[metric.icon] || ICONS.graph}</div>
        <div>
          <h3>${escapeHtml(metric.title)}</h3>
          <p>${escapeHtml(t(metric.period))}</p>
        </div>
      </div>
      <strong>${escapeHtml(formatUsed(metric))}</strong>
      <span>/${escapeHtml(formatLimit(metric))}</span>
      <span class="status-badge is-${status.level}">${escapeHtml(metricPercentLabel(metric))}</span>
      <div class="progress" aria-label="${escapeHtml(metric.title)} usage ${progress}%">
        <div class="progress-inner" style="--progress: ${progress}%; --risk-color: ${escapeHtml(riskColor)}"></div>
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
          <h2>${escapeHtml(t(group.title))}</h2>
          <p>${metrics.length} ${escapeHtml(t('tracked metrics'))}</p>
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

  function setRefreshButtonState(isRefreshing) {
    refreshBtn.disabled = isRefreshing;
    refreshBtn.classList.toggle('is-syncing', isRefreshing);
    refreshBtn.setAttribute('aria-busy', String(isRefreshing));
    if (refreshLabel) refreshLabel.textContent = isRefreshing ? 'Syncing...' : 'Refresh';
  }

  function setRefreshStatus(state, title, detail, progress) {
    if (!refreshStatusEl) return;
    refreshStatusEl.hidden = false;
    refreshStatusEl.className = `dashboard-refresh-status is-${state}`;
    if (refreshStatusTitle) refreshStatusTitle.textContent = title;
    if (refreshStatusDetail) refreshStatusDetail.textContent = detail;
    if (refreshProgress) refreshProgress.style.width = `${Math.max(0, Math.min(100, progress))}%`;
  }

  function stopRefreshProgress() {
    if (refreshProgressTimer) {
      clearInterval(refreshProgressTimer);
      refreshProgressTimer = null;
    }
    if (refreshCompleteTimer) {
      clearTimeout(refreshCompleteTimer);
      refreshCompleteTimer = null;
    }
  }

  function startRefreshProgress() {
    stopRefreshProgress();
    const steps = [
      { title: 'Connecting to Cloudflare', detail: 'Sending a read-only telemetry request.', progress: 16 },
      { title: 'Reading usage metrics', detail: 'Checking quota surfaces across enabled services.', progress: 42 },
      { title: 'Updating local cache', detail: 'Writing the latest quota snapshot and today history sample.', progress: 68 },
      { title: 'Rendering dashboard', detail: 'Preparing updated cards, list rows, and charts.', progress: 86 }
    ];
    let index = 0;
    setRefreshStatus('active', steps[0].title, steps[0].detail, steps[0].progress);
    dashboardSummary.textContent = 'Refresh in progress';

    refreshProgressTimer = setInterval(() => {
      index = Math.min(index + 1, steps.length - 1);
      const step = steps[index];
      setRefreshStatus('active', step.title, step.detail, step.progress);
    }, 1100);
  }

  function finishRefreshProgress(success, detail) {
    stopRefreshProgress();
    const title = success ? 'Refresh complete' : 'Refresh failed';
    const state = success ? 'success' : 'error';
    setRefreshStatus(state, title, detail, success ? 100 : 100);
    dashboardSummary.textContent = success ? 'Updated just now' : 'Refresh failed';
    refreshCompleteTimer = setTimeout(() => {
      if (refreshStatusEl) refreshStatusEl.hidden = true;
    }, success ? 4200 : 7000);
  }

  function accountSuffix(accountId) {
    const value = String(accountId || '').trim();
    return value ? `...${value.slice(-5)}` : t('No account ID');
  }

  function accountStatusLabel(status) {
    const label = {
      critical: 'Critical',
      watch: 'Watch',
      ok: 'Healthy',
      error: 'Error',
      info: 'Info'
    }[status] || 'Info';
    return t(label);
  }

  function accountStatusLevel(status) {
    return {
      critical: 'danger',
      watch: 'warning',
      ok: 'good',
      error: 'danger',
      info: 'info'
    }[status] || 'info';
  }

  function accountPercentLabel(account) {
    const percent = displayPercent(account.topPercent);
    return percent === null ? '--' : `${percent}%`;
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

  function createAccountStat(label, value, status) {
    return `
      <article class="account-stat is-${escapeHtml(accountStatusLevel(status))}">
        <span>${escapeHtml(t(label))}</span>
        <strong>${escapeHtml(value)}</strong>
      </article>
    `;
  }

  function createPriorityItem(account) {
    const level = accountStatusLevel(account.status);
    return `
      <article class="priority-account is-${level}">
        <div>
          <strong>${escapeHtml(account.label || t('Cloudflare account'))}</strong>
          <span>${escapeHtml(account.lastError || account.topMetric || t('No usage data'))}</span>
        </div>
        <em>${escapeHtml(accountPercentLabel(account))}</em>
        <button class="btn btn--secondary" type="button" data-profile-id="${escapeHtml(account.profileId)}">${escapeHtml(t('View details'))}</button>
      </article>
    `;
  }

  function createAccountRow(account) {
    const level = accountStatusLevel(account.status);
    const progress = progressPercent(account.topPercent);
    const riskColor = riskColorForPercent(account.topPercent);
    return `
      <article class="account-health-row is-${level}" data-profile-id="${escapeHtml(account.profileId)}" tabindex="0" role="button">
        <div class="account-health-main">
          <strong>${escapeHtml(account.label || t('Cloudflare account'))}</strong>
          <span>${escapeHtml(accountSuffix(account.accountId))}</span>
        </div>
        <span>${escapeHtml(account.lastError || account.topMetric || t('No usage data'))}</span>
        <div class="progress" aria-label="${escapeHtml(account.label || t('Account'))} ${escapeHtml(t('Overall risk'))} ${progress}%">
          <div class="progress-inner" style="--progress: ${progress}%; --risk-color: ${escapeHtml(riskColor)}"></div>
        </div>
        <strong>${escapeHtml(accountPercentLabel(account))}</strong>
        <span>${escapeHtml(`${account.criticalCount || 0} / ${account.watchCount || 0}`)}</span>
        <span>${escapeHtml(formatRelativeTime(account.lastUpdated))}</span>
        <span class="status-badge is-${level}">${escapeHtml(accountStatusLabel(account.status))}</span>
        <button class="icon-button" type="button" data-profile-id="${escapeHtml(account.profileId)}" aria-label="${escapeHtml(t('Open account details'))}">
          <svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m9 6 6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </article>
    `;
  }

  function renderAccountOverview(overview) {
    const accounts = rankedAccounts(overview);
    const summary = overview?.summary || {};
    updateDashboardHeading('overview');
    contentEl.innerHTML = '';
    contentEl.className = 'dashboard-content account-overview-view';
    if (!accounts.length) {
      renderEmpty();
      return;
    }

    const priorityAccounts = accounts.filter(account => ['critical', 'watch', 'error'].includes(account.status)).slice(0, 3);
    const normalCount = accounts.filter(account => account.status === 'ok').length;
    const errorCount = summary.errorCount || accounts.filter(account => account.status === 'error').length;
    contentEl.innerHTML = `
      <section class="account-summary-grid">
        ${createAccountStat('Critical accounts', summary.criticalCount || 0, 'critical')}
        ${createAccountStat('Watch accounts', summary.watchCount || 0, 'watch')}
        ${createAccountStat('Sync errors', errorCount, errorCount ? 'error' : 'ok')}
        ${createAccountStat('Monitored accounts', summary.total || accounts.length, 'info')}
      </section>
      <section class="priority-panel">
        <div class="dashboard-section-heading">
          <div>
            <h2>${escapeHtml(t('Needs attention'))}</h2>
            <p>${escapeHtml(t('Accounts sorted by highest quota pressure and sync health.'))}</p>
          </div>
        </div>
        <div class="priority-grid">
          ${(priorityAccounts.length ? priorityAccounts : accounts.slice(0, 3)).map(createPriorityItem).join('')}
        </div>
      </section>
      <section class="account-health-panel">
        <div class="dashboard-section-heading">
          <div>
            <h2>${escapeHtml(t('Account health'))}</h2>
            <p>${escapeHtml(t('Click any row to drill into service-level quota details.'))}</p>
          </div>
          <span class="summary-badge">${escapeHtml(normalCount)} ${escapeHtml(t('healthy'))}</span>
        </div>
        <div class="account-health-table">
          <div class="account-health-head">
            <span>${escapeHtml(t('Account'))}</span>
            <span>${escapeHtml(t('Highest risk'))}</span>
            <span>${escapeHtml(t('Usage'))}</span>
            <span>${escapeHtml(t('Risk'))}</span>
            <span>C / W</span>
            <span>${escapeHtml(t('Last sync'))}</span>
            <span>${escapeHtml(t('Status'))}</span>
            <span></span>
          </div>
          ${accounts.map(createAccountRow).join('')}
        </div>
      </section>
    `;

    dashboardSummary.textContent = summary.lastUpdated
      ? `${t('Last sync')} ${formatRelativeTime(summary.lastUpdated)}`
      : t('Account overview');
  }

  function profileById(profileId) {
    return (lastOverview?.accounts || []).find(account => account.profileId === profileId) || null;
  }

  function updateDashboardHeading(mode) {
    if (!dashboardTitle || !dashboardSubtitle || !dashboardAccountContext) return;

    if (mode === 'detail') {
      const account = profileById(selectedProfileId);
      dashboardTitle.textContent = account?.label || t('Account details');
      dashboardSubtitle.textContent = account
        ? `${t('Service-level quota details')} · ${accountSuffix(account.accountId)}`
        : t('Service-level quota details');
      dashboardAccountContext.hidden = false;
      dashboardAccountContext.innerHTML = `
        <label for="dashboardAccountSelect">${escapeHtml(t('Viewing account'))}</label>
        <select id="dashboardAccountSelect">
          ${(lastOverview?.accounts || []).map(item => `
            <option value="${escapeHtml(item.profileId)}"${item.profileId === selectedProfileId ? ' selected' : ''}>${escapeHtml(item.label || t('Cloudflare account'))}</option>
          `).join('')}
        </select>
        <a href="dashboard.html">${escapeHtml(t('Back to overview'))}</a>
      `;
      return;
    }

    dashboardTitle.textContent = t('Multi-account Overview');
    dashboardSubtitle.textContent = t('Monitor quota health across every configured Cloudflare account.');
    dashboardAccountContext.hidden = true;
    dashboardAccountContext.innerHTML = '';
  }

  function renderEmpty() {
    contentEl.innerHTML = '';
    const empty = document.createElement('div');
    empty.className = 'state-panel is-error';
    empty.textContent = t('No quota data available. Configure your API token and account ID in Settings, then refresh.');
    contentEl.appendChild(empty);
    dashboardSummary.textContent = t('Setup needed');
  }

  function renderDashboard(quotas, history) {
    contentEl.innerHTML = '';
    updateDashboardHeading(selectedProfileId ? 'detail' : 'overview');
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
      if (!selectedProfileId) {
        lastOverview = {
          summary: { total: 5, criticalCount: 1, watchCount: 2, errorCount: 1, lastUpdated: Date.now() - 120000 },
          accounts: [
            { profileId: 'profile-production', label: 'Production', accountId: '01a91f', topMetric: 'D1 Rows Written', topPercent: 0.94, criticalCount: 1, watchCount: 0, status: 'critical', lastUpdated: Date.now() - 120000 },
            { profileId: 'profile-ai-lab', label: 'AI Lab', accountId: '4e88c4', topMetric: 'Workers AI Neurons', topPercent: 0.88, criticalCount: 0, watchCount: 1, status: 'watch', lastUpdated: Date.now() - 120000 },
            { profileId: 'profile-client-pages', label: 'Client Pages', accountId: '21b672', topMetric: 'Pages Builds', topPercent: 0.76, criticalCount: 0, watchCount: 1, status: 'watch', lastUpdated: Date.now() - 300000 },
            { profileId: 'profile-dev', label: 'Dev Sandbox', accountId: 'aa42d0', topMetric: 'Workers Requests', topPercent: 0.43, criticalCount: 0, watchCount: 0, status: 'ok', lastUpdated: Date.now() - 480000 },
            { profileId: 'profile-archive', label: 'Archive', accountId: 'be19ab', topMetric: 'Sync failed', topPercent: null, criticalCount: 0, watchCount: 0, status: 'error', lastError: 'Token expired', lastUpdated: Date.now() - 600000 }
          ]
        };
        renderAccountOverview(lastOverview);
        dashboardSummary.textContent = 'Demo account overview';
        return;
      }
      lastOverview = {
        summary: { total: 5, criticalCount: 1, watchCount: 2, errorCount: 1, lastUpdated: Date.now() - 120000 },
        accounts: [
          { profileId: 'profile-production', label: 'Production', accountId: '01a91f', topMetric: 'D1 Rows Written', topPercent: 0.94, criticalCount: 1, watchCount: 0, status: 'critical', lastUpdated: Date.now() - 120000 },
          { profileId: 'profile-ai-lab', label: 'AI Lab', accountId: '4e88c4', topMetric: 'Workers AI Neurons', topPercent: 0.88, criticalCount: 0, watchCount: 1, status: 'watch', lastUpdated: Date.now() - 120000 },
          { profileId: 'profile-client-pages', label: 'Client Pages', accountId: '21b672', topMetric: 'Pages Builds', topPercent: 0.76, criticalCount: 0, watchCount: 1, status: 'watch', lastUpdated: Date.now() - 300000 },
          { profileId: 'profile-dev', label: 'Dev Sandbox', accountId: 'aa42d0', topMetric: 'Workers Requests', topPercent: 0.43, criticalCount: 0, watchCount: 0, status: 'ok', lastUpdated: Date.now() - 480000 },
          { profileId: 'profile-archive', label: 'Archive', accountId: 'be19ab', topMetric: 'Sync failed', topPercent: null, criticalCount: 0, watchCount: 0, status: 'error', lastError: 'Token expired', lastUpdated: Date.now() - 600000 }
        ]
      };
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

    if (hasChromeRuntime && !selectedProfileId) {
      chrome.runtime.sendMessage({ action: 'getAccountOverview' }, response => {
        lastOverview = response ? response.data : null;
        renderAccountOverview(lastOverview);
      });
      return;
    }

    if (hasChromeRuntime && selectedProfileId) {
      chrome.runtime.sendMessage({ action: 'getAccountOverview' }, overviewResponse => {
        lastOverview = overviewResponse ? overviewResponse.data : null;
        chrome.runtime.sendMessage({ action: 'getQuotas', profileId: selectedProfileId }, response => {
          lastQuotas = response ? response.data : null;
          lastHistory = response ? response.history || [] : [];
          renderDashboard(lastQuotas, lastHistory);
        });
      });
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
    if (!selectedProfileId) {
      renderAccountOverview(lastOverview);
      return;
    }
    renderDashboard(lastQuotas, lastHistory);
  }

  cardViewBtn.addEventListener('click', () => setViewMode('cards'));
  listViewBtn.addEventListener('click', () => setViewMode('list'));

  contentEl.addEventListener('click', event => {
    const accountTarget = event.target.closest('[data-profile-id]');
    if (accountTarget && !accountTarget.closest('.chart-container')) {
      selectedProfileId = accountTarget.dataset.profileId;
      window.history.pushState({}, '', `dashboard.html?profile=${encodeURIComponent(selectedProfileId)}`);
      loadAndRender();
      return;
    }

    const target = event.target.closest('[data-chart-key]');
    if (target) openChartModal(target.dataset.chartKey);
  });

  contentEl.addEventListener('keydown', event => {
    const accountTarget = event.target.closest('[data-profile-id]');
    if (accountTarget && ['Enter', ' '].includes(event.key)) {
      event.preventDefault();
      selectedProfileId = accountTarget.dataset.profileId;
      window.history.pushState({}, '', `dashboard.html?profile=${encodeURIComponent(selectedProfileId)}`);
      loadAndRender();
      return;
    }

    const target = event.target.closest('[data-chart-key]');
    if (!target || !['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    openChartModal(target.dataset.chartKey);
  });

  if (chartModalClose) {
    chartModalClose.addEventListener('click', closeChartModal);
  }

  if (chartModal) {
    chartModal.addEventListener('click', event => {
      if (event.target.matches('[data-chart-modal-close]')) closeChartModal();
    });
  }

  if (dashboardAccountContext) {
    dashboardAccountContext.addEventListener('change', event => {
      if (!event.target.matches('#dashboardAccountSelect')) return;
      selectedProfileId = event.target.value;
      window.history.pushState({}, '', `dashboard.html?profile=${encodeURIComponent(selectedProfileId)}`);
      loadAndRender();
    });
  }

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && chartModal && !chartModal.hidden) closeChartModal();
  });

  refreshBtn.addEventListener('click', () => {
    if (!hasChromeRuntime) {
      setRefreshStatus('success', 'Demo data refreshed', 'Rendered local demo quota data.', 100);
      loadAndRender();
      return;
    }

    setRefreshButtonState(true);
    startRefreshProgress();
    chrome.runtime.sendMessage({ action: 'refreshQuotas', source: 'dashboard', profileId: selectedProfileId }, () => {
      loadAndRender();
      setRefreshButtonState(false);
      const lastError = chrome.runtime.lastError;
      if (lastError) {
        finishRefreshProgress(false, lastError.message || 'Cloudflare data could not be refreshed.');
        return;
      }
      finishRefreshProgress(true, 'Latest Cloudflare usage data is cached and visible.');
    });
  });

  window.addEventListener('resize', () => {
    if (selectedProfileId) {
      renderDashboard(lastQuotas, lastHistory);
      if (activeChartKey) openChartModal(activeChartKey);
    } else if (lastOverview) {
      renderAccountOverview(lastOverview);
    }
  });

  window.addEventListener('quota-i18n-ready', () => {
    if (selectedProfileId) {
      renderDashboard(lastQuotas, lastHistory);
    } else if (lastOverview) {
      renderAccountOverview(lastOverview);
    }
  });

  loadAndRender();
});
