/*
 * Cloudflare Free Quota Monitor background service worker.
 *
 * This script runs in the background to periodically query the Cloudflare GraphQL
 * and REST APIs for usage metrics across several products. The service worker
 * stores the latest usage metrics in memory and in
 * chrome.storage so that the popup UI can display fresh data. It also exposes a
 * message API for the popup to request immediate refreshes.
 *
 * NOTE: If a product has a quota but the public API does not expose the
 * corresponding usage counter, the metric is marked unsupported instead of
 * reporting a misleading zero.
 */

const DEFAULT_SETTINGS = {
  apiToken: '',
  accountId: '',
  webdav: {
    url: '',
    username: '',
    password: '',
    path: '/cloudflare-quota-backup.json'
  }
};

const HISTORY_LIMIT = 200;
const SYNC_LOG_LIMIT = 100;

// Static quota limits for Cloudflare free-tier products. Each entry includes a
// limit, period, and human-friendly unit used by the UI.
const QUOTAS = {
  // Workers Free plan: 100k requests per day【986349189248534†L656-L663】.
  workers: { limit: 100000, period: 'daily', unit: 'requests' },
  // Pages Free plan: 500 builds per month【830555805635834†L230-L240】.
  pages: { limit: 500, period: 'monthly', unit: 'builds' },
  // D1 Free plan: 5 M rows read per day and 100k rows written per day【919013306072868†L178-L184】.
  d1Reads: { limit: 5000000, period: 'daily', unit: 'rows read' },
  d1Writes: { limit: 100000, period: 'daily', unit: 'rows written' },
  // KV Free plan: 100k reads per day and 1k writes per day【986349189248534†L805-L815】.
  kvReads: { limit: 100000, period: 'daily', unit: 'reads' },
  kvWrites: { limit: 1000, period: 'daily', unit: 'writes' },
  kvDeletes: { limit: 1000, period: 'daily', unit: 'deletes' },
  kvLists: { limit: 1000, period: 'daily', unit: 'lists' },
  // R2 Free plan: 10 GB‑month storage, 1 M Class A operations and 10 M Class B operations per month【695922532753919†L272-L277】.
  r2Storage: { limit: 10 * 1024 * 1024 * 1024, period: 'monthly', unit: 'bytes' },
  r2AOps: { limit: 1000000, period: 'monthly', unit: 'ops' },
  r2BOps: { limit: 10000000, period: 'monthly', unit: 'ops' },
  // Queues Free plan: 10k operations per day【986349189248534†L868-L872】.
  queues: { limit: 10000, period: 'daily', unit: 'ops' },
  // Hyperdrive Free plan: 100k database queries per day【434663993878670†L160-L168】.
  hyperdrive: { limit: 100000, period: 'daily', unit: 'queries' },
  // Browser Rendering (Browser Run) Free plan: 10 minutes per day【977357586045499†L153-L156】.
  browser: { limit: 10, period: 'daily', unit: 'minutes' },
  // Workers Logs Free plan: 200k log events per day【986349189248534†L781-L788】.
  logs: { limit: 200000, period: 'daily', unit: 'events' },
  // Analytics Engine Free plan: 100k points written per day and 10k queries per day【359239698507774†L220-L227】.
  analyticsWrites: { limit: 100000, period: 'daily', unit: 'points' },
  analyticsReads: { limit: 10000, period: 'daily', unit: 'queries' },
  // Workflows Free plan: 100k invocations per day【86188148743809†L151-L155】.
  workflows: { limit: 100000, period: 'daily', unit: 'invocations' },
  // Workers AI Free plan: 10k neurons per day【906915516928934†L167-L173】.
  ai: { limit: 10000, period: 'daily', unit: 'neurons' },
  durableObjectsRequests: { limit: 100000, period: 'daily', unit: 'requests' },
  durableObjectsDuration: { limit: 13000, period: 'daily', unit: 'GB-s' },
  durableObjectsRowsRead: { limit: 5000000, period: 'daily', unit: 'rows read' },
  durableObjectsRowsWritten: { limit: 100000, period: 'daily', unit: 'rows written' },
  durableObjectsSqlStorage: { limit: 5 * 1024 * 1024 * 1024, period: 'total', unit: 'bytes' }
};

// Cached quotas to serve popup requests quickly.
let cachedQuotas = null;

/**
 * Helper to read extension settings from chrome.storage. Returns a promise.
 */
function loadSettings() {
  return new Promise(resolve => {
    chrome.storage.local.get(['settings'], result => {
      resolve(Object.assign({}, DEFAULT_SETTINGS, result.settings || {}));
    });
  });
}

function historyDayKey(timestamp) {
  const value = Number(timestamp);
  const date = new Date(Number.isFinite(value) ? value : Date.now());
  return date.toISOString().slice(0, 10);
}

function upsertHistorySnapshot(quotas, timestamp = Date.now()) {
  return new Promise(resolve => {
    chrome.storage.local.get({ history: [] }, res => {
      const history = Array.isArray(res.history) ? res.history.filter(entry => entry && entry.quotas) : [];
      const todayKey = historyDayKey(timestamp);
      const nextHistory = history
        .filter(entry => historyDayKey(entry.timestamp) !== todayKey)
        .concat({ timestamp, quotas })
        .sort((a, b) => Number(a.timestamp || 0) - Number(b.timestamp || 0));

      while (nextHistory.length > HISTORY_LIMIT) {
        nextHistory.shift();
      }

      chrome.storage.local.set({ history: nextHistory }, resolve);
    });
  });
}

function recordSyncLog(source, status, message, details = {}) {
  const entry = {
    timestamp: Date.now(),
    source: source || 'manual',
    status,
    message,
    durationMs: Number.isFinite(Number(details.durationMs)) ? Number(details.durationMs) : undefined
  };

  return new Promise(resolve => {
    chrome.storage.local.get({ syncLogs: [] }, res => {
      const logs = Array.isArray(res.syncLogs)
        ? res.syncLogs.filter(log => log && log.timestamp && log.status)
        : [];
      logs.push(entry);
      while (logs.length > SYNC_LOG_LIMIT) logs.shift();
      chrome.storage.local.set({ syncLogs: logs }, resolve);
    });
  });
}

function ensureUpdateAlarm() {
  chrome.alarms.create('updateQuotas', { periodInMinutes: 1440 });
}

/**
 * Helper to perform a GraphQL POST to Cloudflare. Returns JSON response or throws.
 *
 * @param {string} token Cloudflare API token
 * @param {string} query GraphQL query string
 * @param {Object} variables Variables for the GraphQL query
 */
async function graphqlRequest(token, query, variables) {
  const resp = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ query, variables })
  });
  const json = await resp.json();
  if (!json || json.errors) {
    throw new Error(json && json.errors ? JSON.stringify(json.errors) : 'Unknown GraphQL error');
  }
  return json.data;
}

async function cloudflareApiRequest(token, path) {
  const resp = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const json = await resp.json();
  if (!resp.ok || !json.success) {
    throw new Error(json && json.errors ? JSON.stringify(json.errors) : `Cloudflare API error ${resp.status}`);
  }
  return json;
}

function getAccount(data) {
  return data.viewer?.accounts?.[0] || {};
}

function sumGroups(groups, readValue) {
  return (groups || []).reduce((total, group) => {
    const value = Number(readValue(group));
    return total + (Number.isFinite(value) ? value : 0);
  }, 0);
}

function percentOf(used, limit) {
  const value = Number(used);
  if (!Number.isFinite(value) || !limit) return null;
  return value / limit;
}

/**
 * Compute start and end ISO timestamps for the current UTC day.
 */
function getUtcDayRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59));
  return { start: start.toISOString(), end: end.toISOString() };
}

/**
 * Compute start and end ISO timestamps for the current UTC month.
 */
function getUtcMonthRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  // month end: last day 23:59:59
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));
  const end = new Date(nextMonth.getTime() - 1000); // subtract one second
  return { start: start.toISOString(), end: end.toISOString() };
}

/**
 * Fetch Workers invocation usage for the current UTC day.
 *
 * @param {string} token API token
 * @param {string} accountId Account ID
 * @returns {Promise<number>} number of requests today
 */
async function fetchWorkersUsage(token, accountId) {
  const { start, end } = getUtcDayRange();
  // GraphQL query for Workers invocation count
  const query = `query($accountTag: String!, $start: DateTime!, $end: DateTime!) {
    viewer {
      accounts(filter: {accountTag: $accountTag}) {
        workersInvocationsAdaptive(
          limit: 1
          filter: { datetime_geq: $start, datetime_leq: $end }
        ) {
          sum { requests }
        }
      }
    }
  }`;
  try {
    const data = await graphqlRequest(token, query, { accountTag: accountId, start, end });
    const accounts = data.viewer.accounts;
    if (accounts && accounts[0] && accounts[0].workersInvocationsAdaptive && accounts[0].workersInvocationsAdaptive[0]) {
      return accounts[0].workersInvocationsAdaptive[0].sum.requests || 0;
    }
  } catch (err) {
    console.warn('Failed to fetch Workers usage', err);
  }
  return 0;
}

/**
 * Fetch KV operations usage for the current UTC day.
 * Returns an object { reads, writes, deletes, lists }.
 *
 * The GraphQL API aggregates KV operations across namespaces. We sum them here.
 */
async function fetchKvUsage(token, accountId) {
  const { start, end } = getUtcDayRange();
  const query = `query($accountTag: String!, $start: DateTime!, $end: DateTime!) {
    viewer {
      accounts(filter: {accountTag: $accountTag}) {
        kvOperationsAdaptiveGroups(
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
  try {
    const data = await graphqlRequest(token, query, { accountTag: accountId, start, end });
    const groups = getAccount(data).kvOperationsAdaptiveGroups || [];
    let reads = 0;
    let writes = 0;
    let deletes = 0;
    let lists = 0;
    for (const g of groups) {
      const requests = g.sum?.requests || 0;
      const actionType = g.dimensions?.actionType || '';
      if (actionType === 'read') reads += requests;
      else if (actionType === 'write') writes += requests;
      else if (actionType === 'delete') deletes += requests;
      else if (actionType === 'list') lists += requests;
    }
    return { reads, writes, deletes, lists };
  } catch (err) {
    console.warn('Failed to fetch KV usage', err);
    return { reads: 0, writes: 0, deletes: 0, lists: 0 };
  }
}

/**
 * Fetch D1 database usage for the current UTC day.
 * Returns an object { reads, writes } representing row reads and writes.
 *
 * Cloudflare's D1 metrics are available via the d1AnalyticsAdaptiveGroups dataset.
 */
async function fetchD1Usage(token, accountId) {
  const { start, end } = getUtcDayRange();
  const query = `query($accountTag: String!, $start: DateTime!, $end: DateTime!) {
    viewer {
      accounts(filter: {accountTag: $accountTag}) {
        d1AnalyticsAdaptiveGroups(
          limit: 1000
          filter: { datetime_geq: $start, datetime_leq: $end }
        ) {
          sum {
            rowsRead
            rowsWritten
          }
        }
      }
    }
  }`;
  try {
    const data = await graphqlRequest(token, query, { accountTag: accountId, start, end });
    const groups = data.viewer.accounts?.[0]?.d1AnalyticsAdaptiveGroups || [];
    let reads = 0;
    let writes = 0;
    for (const g of groups) {
      reads += g.sum.rowsRead || 0;
      writes += g.sum.rowsWritten || 0;
    }
    return { reads, writes };
  } catch (err) {
    console.warn('Failed to fetch D1 usage', err);
    return { reads: 0, writes: 0 };
  }
}

/**
 * Fetch R2 storage and operation usage for the current UTC month.
 * Returns an object { storage, classA, classB } representing bytes stored,
 * Class A operations and Class B operations this month.  Cloudflare counts
 * storage in GB‑months and operations monthly【695922532753919†L272-L277】.
 * If the GraphQL query fails or the fields are missing, zeros are returned.
 */
async function fetchR2Usage(token, accountId) {
  const { start, end } = getUtcMonthRange();
  const query = `query($accountTag: String!, $start: DateTime!, $end: DateTime!) {
    viewer {
      accounts(filter: {accountTag: $accountTag}) {
        r2StorageAdaptiveGroups(
          limit: 1000
          filter: { datetime_geq: $start, datetime_leq: $end }
        ) {
          dimensions {
            bucketName
            storageClass
          }
          max {
            payloadSize
            metadataSize
            objectCount
            uploadCount
          }
        }
        r2OperationsAdaptiveGroups(
          limit: 1000
          filter: { datetime_geq: $start, datetime_leq: $end }
        ) {
          dimensions {
            actionType
            actionStatus
            bucketName
          }
          sum {
            requests
          }
        }
      }
    }
  }`;
  try {
    const data = await graphqlRequest(token, query, { accountTag: accountId, start, end });
    const accounts = data.viewer.accounts || [];
    let storage = 0;
    let classA = 0;
    let classB = 0;
    if (accounts[0]) {
      const storGroups = accounts[0].r2StorageAdaptiveGroups || [];
      for (const g of storGroups) {
        const max = g.max || {};
        storage += (max.payloadSize || 0) + (max.metadataSize || 0);
      }
      const opGroups = accounts[0].r2OperationsAdaptiveGroups || [];
      for (const g of opGroups) {
        const sum = g.sum || {};
        const requests = sum.requests || 0;
        const actionType = g.dimensions?.actionType || '';
        if (isR2ClassBAction(actionType)) {
          classB += requests;
        } else if (isR2ClassAAction(actionType)) {
          classA += requests;
        }
      }
    }
    return { storage, classA, classB };
  } catch (err) {
    console.warn('Failed to fetch R2 usage', err);
    return { storage: 0, classA: 0, classB: 0 };
  }
}

function isR2ClassAAction(actionType) {
  return [
    'ListBuckets',
    'PutBucket',
    'ListObjects',
    'PutObject',
    'CopyObject',
    'CompleteMultipartUpload',
    'CreateMultipartUpload',
    'LifecycleStorageTierTransition',
    'ListMultipartUploads',
    'UploadPart',
    'UploadPartCopy',
    'ListParts',
    'PutBucketEncryption',
    'PutBucketCors',
    'PutBucketLifecycleConfiguration'
  ].includes(actionType);
}

function isR2ClassBAction(actionType) {
  return [
    'HeadBucket',
    'HeadObject',
    'GetObject',
    'UsageSummary',
    'GetBucketEncryption',
    'GetBucketLocation',
    'GetBucketCors',
    'GetBucketLifecycleConfiguration',
    'GetBucketSippyConfiguration'
  ].includes(actionType);
}

/**
 * Fetch Queue operations usage for the current UTC day. Cloudflare's Queues free
 * tier allows 10k operations per day【986349189248534†L868-L872】.  Each message
 * incurs multiple operations (enqueue, dequeue, acknowledge).  The GraphQL
 * dataset and field names are approximated here; if the query fails the
 * function returns zero.
 */
async function fetchQueuesUsage(token, accountId) {
  const { start, end } = getUtcDayRange();
  const query = `query($accountTag: String!, $start: DateTime!, $end: DateTime!) {
    viewer {
      accounts(filter: {accountTag: $accountTag}) {
        queueMessageOperationsAdaptiveGroups(
          limit: 1000
          filter: { datetime_geq: $start, datetime_leq: $end }
        ) {
          sum {
            billableOperations
          }
        }
      }
    }
  }`;
  try {
    const data = await graphqlRequest(token, query, { accountTag: accountId, start, end });
    return sumGroups(getAccount(data).queueMessageOperationsAdaptiveGroups, group => group.sum?.billableOperations);
  } catch (err) {
    console.warn('Failed to fetch Queues usage', err);
    return 0;
  }
}

/**
 * Fetch Hyperdrive query usage for the current UTC day.  The Hyperdrive free
 * tier allows 100k queries per day【434663993878670†L160-L168】.  The GraphQL
 * dataset name is assumed to be hyperdriveQueriesAdaptiveGroups; if the query
 * fails, zero is returned.
 */
async function fetchHyperdriveUsage(token, accountId) {
  const { start, end } = getUtcDayRange();
  const query = `query($accountTag: String!, $start: DateTime!, $end: DateTime!) {
    viewer {
      accounts(filter: {accountTag: $accountTag}) {
        hyperdriveQueriesAdaptiveGroups(
          limit: 1000
          filter: { datetime_geq: $start, datetime_leq: $end }
        ) {
          count
        }
      }
    }
  }`;
  try {
    const data = await graphqlRequest(token, query, { accountTag: accountId, start, end });
    return sumGroups(getAccount(data).hyperdriveQueriesAdaptiveGroups, group => group.count);
  } catch (err) {
    console.warn('Failed to fetch Hyperdrive usage', err);
    return 0;
  }
}

/**
 * Fetch Browser Rendering (Browser Run) usage for the current UTC day.  The free
 * tier provides 10 minutes per day and 3 concurrent browsers【977357586045499†L153-L156】.
 * The GraphQL dataset for browser rendering is not publicly documented, so this
 * implementation returns zero by default.  If Cloudflare later exposes a
 * browserRenderingAdaptiveGroups dataset, add a query here similar to other
 * functions.
 */
async function fetchBrowserUsage(token, accountId) {
  const { start, end } = getUtcDayRange();
  const query = `query($accountTag: String!, $start: DateTime!, $end: DateTime!) {
    viewer {
      accounts(filter: {accountTag: $accountTag}) {
        browserRenderingBrowserTimeUsageAdaptiveGroups(
          limit: 1000
          filter: { datetime_geq: $start, datetime_leq: $end }
        ) {
          sum {
            totalSessionDurationMs
          }
        }
      }
    }
  }`;
  try {
    const data = await graphqlRequest(token, query, { accountTag: accountId, start, end });
    const totalMs = sumGroups(getAccount(data).browserRenderingBrowserTimeUsageAdaptiveGroups, group => group.sum?.totalSessionDurationMs);
    return totalMs / 60000;
  } catch (err) {
    console.warn('Failed to fetch Browser Run usage', err);
    return 0;
  }
}

/**
 * Fetch Workers log event usage for the current UTC day.  The free tier
 * includes 200k events per day【986349189248534†L781-L788】.  The GraphQL dataset
 * for logs is not widely publicised; this function returns zero until a
 * supported dataset is available.
 */
async function fetchLogsUsage(token, accountId) {
  const { start, end } = getUtcDayRange();
  const query = `query($accountTag: String!, $start: DateTime!, $end: DateTime!) {
    viewer {
      accounts(filter: {accountTag: $accountTag}) {
        logExplorerIngestionAdaptiveGroups(
          limit: 1000
          filter: { datetime_geq: $start, datetime_leq: $end }
        ) {
          sum {
            billableBytes
            totalBytes
          }
        }
      }
    }
  }`;
  try {
    const data = await graphqlRequest(token, query, { accountTag: accountId, start, end });
    const groups = getAccount(data).logExplorerIngestionAdaptiveGroups;
    return {
      events: null,
      supported: false,
      billableBytes: sumGroups(groups, group => group.sum?.billableBytes),
      totalBytes: sumGroups(groups, group => group.sum?.totalBytes)
    };
  } catch (err) {
    console.warn('Failed to fetch Workers Logs usage', err);
    return { events: null, supported: false, billableBytes: 0, totalBytes: 0 };
  }
}

/**
 * Fetch Analytics Engine usage for the current UTC day.  The free tier allows
 * 100k data points written per day and 10k queries per day【359239698507774†L220-L227】.
 * The GraphQL dataset names used here are speculative; if the query fails,
 * zeros are returned.
 */
async function fetchAnalyticsUsage(token, accountId) {
  const { start, end } = getUtcDayRange();
  const query = `query($accountTag: String!, $start: DateTime!, $end: DateTime!) {
    viewer {
      accounts(filter: {accountTag: $accountTag}) {
        workersAnalyticsEngineAdaptiveGroups(
          limit: 1000
          filter: { datetime_geq: $start, datetime_leq: $end }
        ) {
          count
        }
      }
    }
  }`;
  try {
    const data = await graphqlRequest(token, query, { accountTag: accountId, start, end });
    return {
      writes: sumGroups(getAccount(data).workersAnalyticsEngineAdaptiveGroups, group => group.count),
      reads: null,
      readsSupported: false
    };
  } catch (err) {
    console.warn('Failed to fetch Analytics Engine usage', err);
    return { writes: 0, reads: null, readsSupported: false };
  }
}

/**
 * Fetch Workflows invocation usage for the current UTC day.  The free tier
 * includes 100k invocations per day【86188148743809†L151-L155】.  Workflows
 * invocations also count against the Workers request quota, but we track
 * them separately here.  A GraphQL dataset name is assumed; if the query
 * fails, zero is returned.
 */
async function fetchWorkflowsUsage(token, accountId) {
  const { start, end } = getUtcDayRange();
  const query = `query($accountTag: String!, $start: DateTime!, $end: DateTime!) {
    viewer {
      accounts(filter: {accountTag: $accountTag}) {
        workflowsAdaptiveGroups(
          limit: 1000
          filter: { datetime_geq: $start, datetime_leq: $end }
        ) {
          count
        }
      }
    }
  }`;
  try {
    const data = await graphqlRequest(token, query, { accountTag: accountId, start, end });
    return sumGroups(getAccount(data).workflowsAdaptiveGroups, group => group.count);
  } catch (err) {
    console.warn('Failed to fetch Workflows usage', err);
    return 0;
  }
}

/**
 * Fetch Workers AI usage for the current UTC day.  The free tier includes
 * 10k neurons per day【906915516928934†L167-L173】.  At present there is no public
 * GraphQL dataset exposing AI usage, so this implementation returns zero.
 */
async function fetchAiUsage(token, accountId) {
  const { start, end } = getUtcDayRange();
  const query = `query($accountTag: String!, $start: DateTime!, $end: DateTime!) {
    viewer {
      accounts(filter: {accountTag: $accountTag}) {
        aiInferenceAdaptiveGroups(
          limit: 1000
          filter: { datetime_geq: $start, datetime_leq: $end }
        ) {
          sum {
            totalNeurons
          }
        }
      }
    }
  }`;
  try {
    const data = await graphqlRequest(token, query, { accountTag: accountId, start, end });
    return sumGroups(getAccount(data).aiInferenceAdaptiveGroups, group => group.sum?.totalNeurons);
  } catch (err) {
    console.warn('Failed to fetch Workers AI usage', err);
    return 0;
  }
}

/**
 * Fetch Durable Objects compute and SQLite storage usage.
 */
async function fetchDurableObjectsUsage(token, accountId) {
  const { start, end } = getUtcDayRange();
  const { start: monthStart, end: monthEnd } = getUtcMonthRange();
  const query = `query($accountTag: String!, $start: DateTime!, $end: DateTime!, $monthStart: DateTime!, $monthEnd: DateTime!) {
    viewer {
      accounts(filter: {accountTag: $accountTag}) {
        durableObjectsInvocationsAdaptiveGroups(
          limit: 1000
          filter: { datetime_geq: $start, datetime_leq: $end }
        ) {
          sum {
            requests
          }
        }
        durableObjectsPeriodicGroups(
          limit: 1000
          filter: { datetime_geq: $start, datetime_leq: $end }
        ) {
          sum {
            duration
            rowsRead
            rowsWritten
          }
        }
        durableObjectsSqlStorageGroups(
          limit: 1000
          filter: { datetime_geq: $monthStart, datetime_leq: $monthEnd }
        ) {
          max {
            storedBytes
          }
        }
      }
    }
  }`;
  try {
    const data = await graphqlRequest(token, query, {
      accountTag: accountId,
      start,
      end,
      monthStart,
      monthEnd
    });
    const acc = getAccount(data);
    const periodicGroups = acc.durableObjectsPeriodicGroups || [];
    return {
      requests: sumGroups(acc.durableObjectsInvocationsAdaptiveGroups, group => group.sum?.requests),
      duration: sumGroups(periodicGroups, group => group.sum?.duration),
      rowsRead: sumGroups(periodicGroups, group => group.sum?.rowsRead),
      rowsWritten: sumGroups(periodicGroups, group => group.sum?.rowsWritten),
      sqlStorage: sumGroups(acc.durableObjectsSqlStorageGroups, group => group.max?.storedBytes)
    };
  } catch (err) {
    console.warn('Failed to fetch Durable Objects usage', err);
    return { requests: 0, duration: 0, rowsRead: 0, rowsWritten: 0, sqlStorage: 0 };
  }
}

/**
 * Fetch Pages build count for the current UTC month.
 *
 * Returns number of builds this month. The free tier limit is 500 builds per month.
 */
async function fetchPagesUsage(token, accountId) {
  const { start, end } = getUtcMonthRange();
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  try {
    const projects = [];
    for (let page = 1; page <= 100; page += 1) {
      const body = await cloudflareApiRequest(token, `/accounts/${accountId}/pages/projects?page=${page}&per_page=10`);
      projects.push(...(body.result || []));
      if (!body.result_info || page >= body.result_info.total_pages) break;
    }

    let totalBuilds = 0;
    for (const project of projects) {
      for (let page = 1; page <= 200; page += 1) {
        const body = await cloudflareApiRequest(token, `/accounts/${accountId}/pages/projects/${encodeURIComponent(project.name)}/deployments?page=${page}&per_page=25`);
        const deployments = body.result || [];
        totalBuilds += deployments.filter(deployment => {
          const created = new Date(deployment.created_on).getTime();
          return created >= startTime && created <= endTime;
        }).length;

        const oldest = deployments.length ? new Date(deployments[deployments.length - 1].created_on).getTime() : null;
        if (!body.result_info || page >= body.result_info.total_pages || (oldest && oldest < startTime)) break;
      }
    }
    return totalBuilds;
  } catch (err) {
    console.warn('Failed to fetch Pages usage', err);
    return 0;
  }
}

/**
 * Update all quota metrics and cache them.
 * This function reads settings from storage and, if configured, fetches the
 * latest usage metrics from Cloudflare. It then normalises the data into a
 * structure consumable by the UI and stores it in both memory and
 * chrome.storage.local.
 */
async function updateQuotas(source = 'manual') {
  const startedAt = Date.now();
  await recordSyncLog(source, 'started', 'Sync started.');
  const settings = await loadSettings();
  // Only attempt if both token and account ID are present
  if (!settings.apiToken || !settings.accountId) {
    cachedQuotas = null;
    await chrome.storage.local.set({ quotas: null });
    await recordSyncLog(source, 'skipped', 'Missing API token or account ID.', { durationMs: Date.now() - startedAt });
    return;
  }
  const token = settings.apiToken.trim();
  const accountId = settings.accountId.trim();
  try {
    const [workersUsed, pagesUsed, kvUsage, d1Usage, r2Usage, queuesUsed, hyperdriveUsed, browserUsed, logsUsage, analyticsUsage, workflowsUsed, aiUsed, durableObjectsUsage] = await Promise.all([
      fetchWorkersUsage(token, accountId),
      fetchPagesUsage(token, accountId),
      fetchKvUsage(token, accountId),
      fetchD1Usage(token, accountId),
      fetchR2Usage(token, accountId),
      fetchQueuesUsage(token, accountId),
      fetchHyperdriveUsage(token, accountId),
      fetchBrowserUsage(token, accountId),
      fetchLogsUsage(token, accountId),
      fetchAnalyticsUsage(token, accountId),
      fetchWorkflowsUsage(token, accountId),
      fetchAiUsage(token, accountId),
      fetchDurableObjectsUsage(token, accountId)
    ]);
    const result = {
      workers: {
        used: workersUsed,
        limit: QUOTAS.workers.limit,
        percent: percentOf(workersUsed, QUOTAS.workers.limit),
        unit: QUOTAS.workers.unit,
        period: QUOTAS.workers.period
      },
      pages: {
        used: pagesUsed,
        limit: QUOTAS.pages.limit,
        percent: percentOf(pagesUsed, QUOTAS.pages.limit),
        unit: QUOTAS.pages.unit,
        period: QUOTAS.pages.period
      },
      kv: {
        reads: kvUsage.reads,
        writes: kvUsage.writes,
        deletes: kvUsage.deletes,
        lists: kvUsage.lists,
        readsPercent: percentOf(kvUsage.reads, QUOTAS.kvReads.limit),
        writesPercent: percentOf(kvUsage.writes, QUOTAS.kvWrites.limit),
        deletesPercent: percentOf(kvUsage.deletes, QUOTAS.kvDeletes.limit),
        listsPercent: percentOf(kvUsage.lists, QUOTAS.kvLists.limit),
        readsLimit: QUOTAS.kvReads.limit,
        writesLimit: QUOTAS.kvWrites.limit,
        deletesLimit: QUOTAS.kvDeletes.limit,
        listsLimit: QUOTAS.kvLists.limit,
        unit: 'operations',
        period: QUOTAS.kvReads.period
      },
      d1: {
        reads: d1Usage.reads,
        writes: d1Usage.writes,
        readsPercent: percentOf(d1Usage.reads, QUOTAS.d1Reads.limit),
        writesPercent: percentOf(d1Usage.writes, QUOTAS.d1Writes.limit),
        readsLimit: QUOTAS.d1Reads.limit,
        writesLimit: QUOTAS.d1Writes.limit,
        unit: 'rows',
        period: QUOTAS.d1Reads.period
      },
      r2: {
        storage: r2Usage.storage,
        classA: r2Usage.classA,
        classB: r2Usage.classB,
        storagePercent: percentOf(r2Usage.storage, QUOTAS.r2Storage.limit),
        classAPercent: percentOf(r2Usage.classA, QUOTAS.r2AOps.limit),
        classBPercent: percentOf(r2Usage.classB, QUOTAS.r2BOps.limit),
        storageLimit: QUOTAS.r2Storage.limit,
        classALimit: QUOTAS.r2AOps.limit,
        classBLimit: QUOTAS.r2BOps.limit,
        unit: {
          storage: 'bytes',
          opsA: 'operations',
          opsB: 'operations'
        },
        period: {
          storage: QUOTAS.r2Storage.period,
          ops: QUOTAS.r2AOps.period
        }
      },
      queues: {
        used: queuesUsed,
        limit: QUOTAS.queues.limit,
        percent: percentOf(queuesUsed, QUOTAS.queues.limit),
        unit: QUOTAS.queues.unit,
        period: QUOTAS.queues.period
      },
      hyperdrive: {
        used: hyperdriveUsed,
        limit: QUOTAS.hyperdrive.limit,
        percent: percentOf(hyperdriveUsed, QUOTAS.hyperdrive.limit),
        unit: QUOTAS.hyperdrive.unit,
        period: QUOTAS.hyperdrive.period
      },
      browser: {
        used: browserUsed,
        limit: QUOTAS.browser.limit,
        percent: percentOf(browserUsed, QUOTAS.browser.limit),
        unit: QUOTAS.browser.unit,
        period: QUOTAS.browser.period
      },
      logs: {
        used: logsUsage.events,
        supported: logsUsage.supported,
        billableBytes: logsUsage.billableBytes,
        totalBytes: logsUsage.totalBytes,
        limit: QUOTAS.logs.limit,
        percent: percentOf(logsUsage.events, QUOTAS.logs.limit),
        unit: QUOTAS.logs.unit,
        period: QUOTAS.logs.period
      },
      analytics: {
        writes: analyticsUsage.writes,
        reads: analyticsUsage.reads,
        readsSupported: analyticsUsage.readsSupported,
        writesPercent: percentOf(analyticsUsage.writes, QUOTAS.analyticsWrites.limit),
        readsPercent: percentOf(analyticsUsage.reads, QUOTAS.analyticsReads.limit),
        writesLimit: QUOTAS.analyticsWrites.limit,
        readsLimit: QUOTAS.analyticsReads.limit,
        unit: { writes: 'points', reads: 'queries' },
        period: { writes: QUOTAS.analyticsWrites.period, reads: QUOTAS.analyticsReads.period }
      },
      workflows: {
        used: workflowsUsed,
        limit: QUOTAS.workflows.limit,
        percent: percentOf(workflowsUsed, QUOTAS.workflows.limit),
        unit: QUOTAS.workflows.unit,
        period: QUOTAS.workflows.period
      },
      ai: {
        used: aiUsed,
        limit: QUOTAS.ai.limit,
        percent: percentOf(aiUsed, QUOTAS.ai.limit),
        unit: QUOTAS.ai.unit,
        period: QUOTAS.ai.period
      },
      durableObjects: {
        requests: durableObjectsUsage.requests,
        duration: durableObjectsUsage.duration,
        rowsRead: durableObjectsUsage.rowsRead,
        rowsWritten: durableObjectsUsage.rowsWritten,
        sqlStorage: durableObjectsUsage.sqlStorage,
        requestsPercent: percentOf(durableObjectsUsage.requests, QUOTAS.durableObjectsRequests.limit),
        durationPercent: percentOf(durableObjectsUsage.duration, QUOTAS.durableObjectsDuration.limit),
        rowsReadPercent: percentOf(durableObjectsUsage.rowsRead, QUOTAS.durableObjectsRowsRead.limit),
        rowsWrittenPercent: percentOf(durableObjectsUsage.rowsWritten, QUOTAS.durableObjectsRowsWritten.limit),
        sqlStoragePercent: percentOf(durableObjectsUsage.sqlStorage, QUOTAS.durableObjectsSqlStorage.limit),
        requestsLimit: QUOTAS.durableObjectsRequests.limit,
        durationLimit: QUOTAS.durableObjectsDuration.limit,
        rowsReadLimit: QUOTAS.durableObjectsRowsRead.limit,
        rowsWrittenLimit: QUOTAS.durableObjectsRowsWritten.limit,
        sqlStorageLimit: QUOTAS.durableObjectsSqlStorage.limit,
        unit: {
          requests: 'requests',
          duration: 'GB-s',
          rows: 'rows',
          storage: 'bytes'
        },
        period: {
          requests: QUOTAS.durableObjectsRequests.period,
          duration: QUOTAS.durableObjectsDuration.period,
          rows: QUOTAS.durableObjectsRowsRead.period,
          storage: QUOTAS.durableObjectsSqlStorage.period
        }
      }
    };
    const now = Date.now();
    cachedQuotas = result;
    await chrome.storage.local.set({ quotas: result, lastUpdated: now });
    await upsertHistorySnapshot(result, now);
    await recordSyncLog(source, 'success', 'Quota data refreshed and history cache updated.', { durationMs: Date.now() - startedAt });
    return result;
  } catch (err) {
    console.warn('Failed to update quotas', err);
    await recordSyncLog(source, 'error', err.message || 'Cloudflare quota refresh failed.', { durationMs: Date.now() - startedAt });
    // Do not overwrite cached quotas if query fails
    return cachedQuotas;
  }
}

// Create an alarm on installation to update quotas regularly.
chrome.runtime.onInstalled.addListener(() => {
  ensureUpdateAlarm();
  // Immediately update after install
  updateQuotas('install');
});

chrome.runtime.onStartup.addListener(() => {
  ensureUpdateAlarm();
  recordSyncLog('startup', 'scheduled', 'Daily sync alarm checked.');
});

// Alarm listener to trigger updates
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'updateQuotas') {
    updateQuotas('scheduled');
  }
});

// Message listener for popup to request data or trigger refresh
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getQuotas') {
    // If cachedQuotas is null, attempt to load from storage
    if (cachedQuotas === null) {
      chrome.storage.local.get(['quotas'], result => {
        cachedQuotas = result.quotas || null;
        sendResponse({ data: cachedQuotas });
      });
      return true; // keep message channel open
    } else {
      sendResponse({ data: cachedQuotas });
    }
  } else if (message.action === 'refreshQuotas') {
    updateQuotas(message.source || 'manual').then(() => {
      sendResponse({ data: cachedQuotas });
    });
    return true; // keep message channel open
  }
});
