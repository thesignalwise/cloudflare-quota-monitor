// i18n.js
// Lightweight page localization for extension HTML surfaces.

(() => {
  const SUPPORTED_LOCALES = ['en', 'zh-CN', 'zh-TW', 'ja', 'ko'];
  const STORAGE_KEY = 'localePreference';

  const DICTIONARIES = {
    'zh-CN': {
      'Quota Monitor': '额度监控',
      'Extension settings': '扩展设置',
      'Settings sections': '设置分区',
      'Official website': '官方网站',
      'GitHub repository': 'GitHub 仓库',
      'Popup': '弹窗',
      'Dashboard': '仪表盘',
      'Settings': '设置',
      'API Configuration': 'API 配置',
      'Import / Export': '导入/导出',
      'Monitored Services': '监控服务',
      'Sync Schedule': '同步计划',
      'About': '关于',
      'Privacy': '隐私',
      'Privacy Policy': '隐私条款',
      'Release Notes': '发布说明',
      'Usage Overview': '用量概览',
      'Monitoring your service limits across the global network.': '监控全局网络中的服务额度使用。',
      'Cards': '卡片',
      'List': '列表',
      'Refresh': '刷新',
      'Export Report': '导出报告',
      'Manage Limits': '管理额度',
      'Data updates once per day automatically.': '数据每天自动更新一次。',
      'Last 30 samples': '最近 30 个样本',
      'Manage Cloudflare credentials used by local quota checks.': '管理本地额度检查使用的 Cloudflare 凭据。',
      'Local Storage Only': '仅本地存储',
      'Cloudflare API': 'Cloudflare API',
      'Required': '必填',
      'Cloudflare API token': 'Cloudflare API 令牌',
      'Enter a read-only API token': '输入只读 API 令牌',
      'Use a scoped token with account analytics and read permissions. Avoid Global API keys.': '使用包含账户分析和读取权限的限定令牌，避免使用全局 API Key。',
      'Account ID': '账户 ID',
      'Cloudflare account identifier': 'Cloudflare 账户标识',
      'Find this on your Cloudflare dashboard overview page.': '可在 Cloudflare 控制台概览页找到。',
      'API test results': 'API 测试结果',
      'Collapsed until testing': '测试前折叠',
      'Not tested': '尚未测试',
      'API not tested': 'API 尚未测试',
      'Run a read-only check to validate this token, account access, and telemetry coverage.': '运行只读检查以验证令牌、账户访问和指标覆盖。',
      'Test API': '测试 API',
      'Save API Settings': '保存 API 设置',
      'Move settings between browsers using a single JSON file.': '使用单个 JSON 文件在浏览器之间迁移设置。',
      'Optional': '可选',
      'Remote backup target': '远程备份目标',
      'Username': '用户名',
      'Optional username': '可选用户名',
      'Password': '密码',
      'Optional password': '可选密码',
      'Remote Path': '远程路径',
      'Backup and restore use a single JSON file at this path.': '备份和恢复会使用此路径下的单个 JSON 文件。',
      'Backup': '备份',
      'Restore': '恢复',
      'Save': '保存',
      'Coverage status for each Cloudflare usage source.': '各 Cloudflare 用量来源的覆盖状态。',
      '13 service groups': '13 个服务组',
      'Telemetry coverage': '指标覆盖',
      'Enabled': '已启用',
      'Partial': '部分支持',
      'Background refresh cadence and manual refresh behavior.': '后台刷新频率和手动刷新行为。',
      'Chrome Alarm': 'Chrome 定时任务',
      'Refresh Frequency': '刷新频率',
      'Daily': '每日',
      'The extension refreshes usage data once per day and supports manual refresh from the popup and dashboard.': '扩展每天自动刷新一次用量数据，并支持在弹窗和仪表盘手动刷新。',
      'Version, privacy posture, and API coverage notes.': '版本、隐私策略和 API 覆盖说明。',
      'Local-first quota visibility': '本地优先的额度可视化',
      'A Chrome extension for checking free-tier usage across Cloudflare developer products without sending credentials to third-party services.': '用于检查 Cloudflare 开发者产品免费额度的 Chrome 扩展，不会将凭据发送给第三方服务。',
      'service groups': '服务组',
      'extension runtime': '扩展运行时',
      'Tokens are stored in Chrome local storage. Workers Logs event count and Analytics Engine read queries are shown as unavailable when Cloudflare does not expose those exact counters through the public API.': '令牌存储在 Chrome 本地存储中。当 Cloudflare 公共 API 不暴露精确计数器时，Workers Logs 事件数和 Analytics Engine 读取查询会显示为不可用。',
      'Local first': '本地优先',
      'Data handled': '处理的数据',
      'Read-only': '只读',
      'Cloudflare credentials': 'Cloudflare 凭据',
      'API token and account ID entered by the user.': '用户输入的 API 令牌和账户 ID。',
      'Quota telemetry': '额度遥测',
      'Usage counts, limits, percentages, timestamps, and local history samples returned by Cloudflare APIs.': 'Cloudflare API 返回的用量计数、额度、百分比、时间戳和本地历史样本。',
      'Storage and transfer': '存储与传输',
      'Chrome storage': 'Chrome 存储',
      "The extension stores settings and cached quota results in `chrome.storage.local` on the user's browser profile. It sends the API token only to `https://api.cloudflare.com/` to verify the token and read quota telemetry.": '扩展会将设置和缓存的额度结果存储在用户浏览器 Profile 的 `chrome.storage.local` 中。API 令牌只会发送到 `https://api.cloudflare.com/` 用于验证令牌并读取额度遥测。',
      'Limited Use disclosure': 'Limited Use 披露',
      'Chrome policy': 'Chrome 政策',
      "Cloudflare Quota Monitor's use and transfer of information received from Cloudflare APIs adheres to the Chrome Web Store User Data Policy, including the Limited Use requirements. Data is used only to provide quota monitoring, API validation, local cache history, and user-initiated backup/restore.": 'Cloudflare Quota Monitor 对从 Cloudflare API 接收的信息的使用和传输遵守 Chrome Web Store 用户数据政策，包括 Limited Use 要求。数据仅用于额度监控、API 验证、本地缓存历史以及用户主动发起的备份/恢复。',
      'The extension does not use Cloudflare API data for advertising, profiling, resale, or unrelated analytics.': '扩展不会将 Cloudflare API 数据用于广告、画像、转售或无关分析。',
      'Chrome Web Store readiness': 'Chrome Web Store 发布准备',
      'Release packaging': '发布打包',
      'Added a deterministic extension ZIP package script that excludes local secrets, screenshots, tests, and design sources.': '新增确定性的扩展 ZIP 打包脚本，排除本地密钥、截图、测试和设计源文件。',
      'Language': '语言',
      'Follow browser': '跟随浏览器',
      'Simplified Chinese': '简体中文',
      'Traditional Chinese': '繁體中文',
      'English': '英文',
      'Japanese': '日文',
      'Korean': '韩文',
      'Default follows your browser language. Manual selection is stored locally.': '默认跟随浏览器语言，手动选择会保存在本地。',
      'Product changes and release history.': '产品变更和发布历史。',
      'Current': '当前',
      'Previous': '上一版本',
      'Initial release': '初始版本',
      'Manual sync history cache': '手工同步历史缓存',
      "Manual refresh now updates today's dashboard history sample and waits for cache writes before re-rendering charts.": '手工刷新现在会更新今天的仪表盘历史样本，并等待缓存写入完成后再重新渲染图表。',
      'Risk-aware usage visuals': '风险感知用量视觉',
      'Usage bars and dashboard trend lines now move from deep green to red as quota pressure increases.': '用量条和仪表盘趋势线会随着额度压力增加，从深绿逐级过渡到红色。',
      'Cleaner API testing': '更清爽的 API 测试',
      'API capability results are collapsed by default and expand only when a test is run.': 'API 能力测试结果默认折叠，仅在运行测试时展开。',
      'Internationalization foundation': '国际化基础',
      'Added browser-language detection, a manual language override, and localized extension metadata.': '新增浏览器语言检测、手动语言覆盖和本地化扩展元数据。',
      'Added Release Notes to the sidebar navigation.': '侧边栏新增发布说明入口。',
      'Quota monitoring baseline': '额度监控基线',
      'Move settings between browsers with a local JSON file.': '使用本地 JSON 文件在浏览器之间迁移设置。',
      'Configuration file': '配置文件',
      'No network permission': '无需网络权限',
      'Exported files include sensitive settings.': '导出的文件包含敏感设置。',
      'The exported JSON contains the Cloudflare API token and account ID. Store it securely and import only files you trust.': '导出的 JSON 包含 Cloudflare API 令牌和账户 ID。请安全保存，并只导入你信任的文件。',
      'Export current configuration': '导出当前配置',
      'Downloads a local JSON file with API settings and language preference. No remote service is contacted.': '下载包含 API 设置和语言偏好的本地 JSON 文件，不会连接远程服务。',
      'Import configuration': '导入配置',
      'Loads a previously exported JSON file into Chrome local storage, then refreshes quota data.': '将此前导出的 JSON 文件载入 Chrome 本地存储，然后刷新额度数据。',
      'Import JSON': '导入 JSON',
      'Export JSON': '导出 JSON',
      'A Chrome extension for checking free-tier usage across Cloudflare developer products. Credentials stay local unless you export a configuration file.': '用于检查 Cloudflare 开发者产品免费额度的 Chrome 扩展。除非你导出配置文件，否则凭据保留在本地。',
      'Tokens are stored in Chrome local storage. Configuration export downloads a local JSON file that includes sensitive settings. Workers Logs event count and Analytics Engine read queries are shown as unavailable when Cloudflare does not expose those exact counters through the public API.': '令牌存储在 Chrome 本地存储中。配置导出会下载包含敏感设置的本地 JSON 文件。当 Cloudflare 公共 API 不暴露精确计数器时，Workers Logs 事件数和 Analytics Engine 读取查询会显示为不可用。',
      'How this extension handles credentials, usage data, and local configuration files.': '此扩展如何处理凭据、用量数据和本地配置文件。',
      'Exported configuration file': '导出的配置文件',
      'API token and account ID if the user chooses to export a local JSON configuration file.': '用户选择导出本地 JSON 配置文件时包含的 API 令牌和账户 ID。',
      'Configuration export creates a local JSON file selected by the user. The extension does not upload backup data, operate a server, or receive, sell, or share user data.': '配置导出会创建用户选择保存的本地 JSON 文件。扩展不会上传备份数据，不运营服务器，也不会接收、出售或共享用户数据。',
      "Cloudflare Quota Monitor's use and transfer of information received from Cloudflare APIs adheres to the Chrome Web Store User Data Policy, including the Limited Use requirements. Data is used only to provide quota monitoring, API validation, local cache history, and user-initiated configuration import/export.": 'Cloudflare Quota Monitor 对从 Cloudflare API 接收的信息的使用和传输遵守 Chrome Web Store 用户数据政策，包括 Limited Use 要求。数据仅用于额度监控、API 验证、本地缓存历史以及用户主动发起的配置导入/导出。',
      'Local configuration import/export': '本地配置导入/导出',
      'Replaced online WebDAV backup with local JSON export and import to avoid broad host permissions and improve Chrome Web Store review readiness.': '用本地 JSON 导入/导出替代在线 WebDAV 备份，避免宽泛 host 权限并提高 Chrome Web Store 审核准备度。',
      'Lower permission surface': '更低权限面',
      'Removed optional all-site host permissions. The extension now only requests Cloudflare API access, storage, alarms, and notifications.': '移除了可选全站 host 权限。扩展现在只请求 Cloudflare API 访问、本地存储、定时任务和通知权限。',
      'Translation cleanup': '翻译清理',
      'Filled missing release-note and privacy descriptions across Simplified Chinese, Traditional Chinese, Japanese, and Korean.': '补齐简体中文、繁体中文、日文和韩文中的发布说明与隐私描述翻译。',
      'Privacy policy surfaces': '隐私条款入口',
      'Added bundled and website-ready privacy policy documents, release packaging, and a refreshed extension icon.': '新增扩展内置和网站可发布的隐私条款文档、发布打包脚本和新版扩展图标。',
      'Added grouped dashboard, dense popup cards, Cloudflare API validation, Durable Objects metrics, and configuration portability.': '新增分组仪表盘、高密度弹窗卡片、Cloudflare API 验证、Durable Objects 指标和配置迁移能力。'
    },
    'zh-TW': {
      'Quota Monitor': '額度監控',
      'Extension settings': '擴充功能設定',
      'Settings sections': '設定區段',
      'Official website': '官方網站',
      'GitHub repository': 'GitHub 倉庫',
      'Popup': '彈窗',
      'Dashboard': '儀表板',
      'Settings': '設定',
      'API Configuration': 'API 設定',
      'Monitored Services': '監控服務',
      'Sync Schedule': '同步排程',
      'About': '關於',
      'Privacy': '隱私',
      'Privacy Policy': '隱私權政策',
      'Release Notes': '發布說明',
      'Usage Overview': '用量概覽',
      'Monitoring your service limits across the global network.': '監控全域網路中的服務額度使用。',
      'Cards': '卡片',
      'List': '清單',
      'Refresh': '重新整理',
      'Export Report': '匯出報告',
      'Manage Limits': '管理額度',
      'Data updates once per day automatically.': '資料每天自動更新一次。',
      'Last 30 samples': '最近 30 個樣本',
      'Manage Cloudflare credentials used by local quota checks.': '管理本機額度檢查使用的 Cloudflare 憑證。',
      'Local Storage Only': '僅本機儲存',
      'Cloudflare API': 'Cloudflare API',
      'Required': '必填',
      'Cloudflare API token': 'Cloudflare API 權杖',
      'Enter a read-only API token': '輸入唯讀 API 權杖',
      'Use a scoped token with account analytics and read permissions. Avoid Global API keys.': '使用包含帳戶分析與讀取權限的限定權杖，避免使用全域 API Key。',
      'Account ID': '帳戶 ID',
      'Cloudflare account identifier': 'Cloudflare 帳戶識別碼',
      'Find this on your Cloudflare dashboard overview page.': '可在 Cloudflare 控制台概覽頁找到。',
      'API test results': 'API 測試結果',
      'Collapsed until testing': '測試前收合',
      'Not tested': '尚未測試',
      'API not tested': 'API 尚未測試',
      'Run a read-only check to validate this token, account access, and telemetry coverage.': '執行唯讀檢查以驗證權杖、帳戶存取與指標覆蓋。',
      'Test API': '測試 API',
      'Save API Settings': '儲存 API 設定',
      'Move settings between browsers using a single JSON file.': '使用單一 JSON 檔在瀏覽器間移轉設定。',
      'Optional': '選填',
      'Remote backup target': '遠端備份目標',
      'Username': '使用者名稱',
      'Optional username': '選填使用者名稱',
      'Password': '密碼',
      'Optional password': '選填密碼',
      'Remote Path': '遠端路徑',
      'Backup and restore use a single JSON file at this path.': '備份與還原會使用此路徑下的單一 JSON 檔。',
      'Backup': '備份',
      'Restore': '還原',
      'Save': '儲存',
      'Coverage status for each Cloudflare usage source.': '各 Cloudflare 用量來源的覆蓋狀態。',
      '13 service groups': '13 個服務群組',
      'Telemetry coverage': '指標覆蓋',
      'Enabled': '已啟用',
      'Partial': '部分支援',
      'Background refresh cadence and manual refresh behavior.': '背景更新頻率與手動更新行為。',
      'Chrome Alarm': 'Chrome 排程',
      'Refresh Frequency': '更新頻率',
      'Daily': '每日',
      'The extension refreshes usage data once per day and supports manual refresh from the popup and dashboard.': '擴充功能每天自動更新一次用量資料，並支援從彈窗與儀表板手動更新。',
      'Version, privacy posture, and API coverage notes.': '版本、隱私策略與 API 覆蓋說明。',
      'Local-first quota visibility': '本機優先的額度可視化',
      'A Chrome extension for checking free-tier usage across Cloudflare developer products without sending credentials to third-party services.': '用於檢查 Cloudflare 開發者產品免費額度的 Chrome 擴充功能，不會將憑證傳送給第三方服務。',
      'service groups': '服務群組',
      'extension runtime': '擴充功能執行環境',
      'Tokens are stored in Chrome local storage. Workers Logs event count and Analytics Engine read queries are shown as unavailable when Cloudflare does not expose those exact counters through the public API.': '權杖儲存在 Chrome 本機儲存中。當 Cloudflare 公共 API 未暴露精確計數器時，Workers Logs 事件數與 Analytics Engine 讀取查詢會顯示為不可用。',
      'Local first': '本機優先',
      'Data handled': '處理的資料',
      'Read-only': '唯讀',
      'Cloudflare credentials': 'Cloudflare 憑證',
      'API token and account ID entered by the user.': '使用者輸入的 API 權杖和帳戶 ID。',
      'Quota telemetry': '額度遙測',
      'Usage counts, limits, percentages, timestamps, and local history samples returned by Cloudflare APIs.': 'Cloudflare API 回傳的用量計數、額度、百分比、時間戳與本機歷史樣本。',
      'Storage and transfer': '儲存與傳輸',
      'Chrome storage': 'Chrome 儲存',
      "The extension stores settings and cached quota results in `chrome.storage.local` on the user's browser profile. It sends the API token only to `https://api.cloudflare.com/` to verify the token and read quota telemetry.": '擴充功能會將設定和快取的額度結果儲存在使用者瀏覽器 Profile 的 `chrome.storage.local` 中。API 權杖只會傳送到 `https://api.cloudflare.com/` 用於驗證權杖並讀取額度遙測。',
      'Limited Use disclosure': 'Limited Use 揭露',
      'Chrome policy': 'Chrome 政策',
      "Cloudflare Quota Monitor's use and transfer of information received from Cloudflare APIs adheres to the Chrome Web Store User Data Policy, including the Limited Use requirements. Data is used only to provide quota monitoring, API validation, local cache history, and user-initiated backup/restore.": 'Cloudflare Quota Monitor 對從 Cloudflare API 接收資訊的使用和傳輸遵守 Chrome Web Store 使用者資料政策，包括 Limited Use 要求。資料僅用於額度監控、API 驗證、本機快取歷史以及使用者主動發起的備份/還原。',
      'The extension does not use Cloudflare API data for advertising, profiling, resale, or unrelated analytics.': '擴充功能不會將 Cloudflare API 資料用於廣告、輪廓分析、轉售或無關分析。',
      'Chrome Web Store readiness': 'Chrome Web Store 發布準備',
      'Release packaging': '發布打包',
      'Added a deterministic extension ZIP package script that excludes local secrets, screenshots, tests, and design sources.': '新增確定性的擴充功能 ZIP 打包腳本，排除本機密鑰、截圖、測試與設計原始檔。',
      'Language': '語言',
      'Follow browser': '跟隨瀏覽器',
      'Simplified Chinese': '簡體中文',
      'Traditional Chinese': '繁體中文',
      'English': '英文',
      'Japanese': '日文',
      'Korean': '韓文',
      'Default follows your browser language. Manual selection is stored locally.': '預設跟隨瀏覽器語言，手動選擇會儲存在本機。',
      'Product changes and release history.': '產品變更與發布歷史。',
      'Current': '目前',
      'Previous': '上一版本',
      'Initial release': '初始版本',
      'Manual sync history cache': '手動同步歷史快取',
      "Manual refresh now updates today's dashboard history sample and waits for cache writes before re-rendering charts.": '手動重新整理現在會更新今天的儀表板歷史樣本，並等待快取寫入完成後再重新渲染圖表。',
      'Risk-aware usage visuals': '風險感知用量視覺',
      'Usage bars and dashboard trend lines now move from deep green to red as quota pressure increases.': '用量條與儀表板趨勢線會隨著額度壓力增加，從深綠逐級過渡到紅色。',
      'Cleaner API testing': '更清爽的 API 測試',
      'API capability results are collapsed by default and expand only when a test is run.': 'API 能力測試結果預設收合，僅在執行測試時展開。',
      'Internationalization foundation': '國際化基礎',
      'Added browser-language detection, a manual language override, and localized extension metadata.': '新增瀏覽器語言偵測、手動語言覆寫與本地化擴充功能中繼資料。',
      'Added Release Notes to the sidebar navigation.': '側邊欄新增發布說明入口。',
      'Quota monitoring baseline': '額度監控基線',
      'Import / Export': '匯入/匯出',
      'Move settings between browsers with a local JSON file.': '使用本機 JSON 檔在瀏覽器之間移轉設定。',
      'Configuration file': '設定檔',
      'No network permission': '不需要網路權限',
      'Exported files include sensitive settings.': '匯出的檔案包含敏感設定。',
      'The exported JSON contains the Cloudflare API token and account ID. Store it securely and import only files you trust.': '匯出的 JSON 包含 Cloudflare API 權杖與帳戶 ID。請妥善保存，且只匯入你信任的檔案。',
      'Export current configuration': '匯出目前設定',
      'Downloads a local JSON file with API settings and language preference. No remote service is contacted.': '下載包含 API 設定與語言偏好的本機 JSON 檔，不會連線到遠端服務。',
      'Import configuration': '匯入設定',
      'Loads a previously exported JSON file into Chrome local storage, then refreshes quota data.': '將先前匯出的 JSON 檔載入 Chrome 本機儲存，然後重新整理額度資料。',
      'Import JSON': '匯入 JSON',
      'Export JSON': '匯出 JSON',
      'A Chrome extension for checking free-tier usage across Cloudflare developer products. Credentials stay local unless you export a configuration file.': '用於檢查 Cloudflare 開發者產品免費額度的 Chrome 擴充功能。除非你匯出設定檔，否則憑證保留在本機。',
      'Tokens are stored in Chrome local storage. Configuration export downloads a local JSON file that includes sensitive settings. Workers Logs event count and Analytics Engine read queries are shown as unavailable when Cloudflare does not expose those exact counters through the public API.': '權杖儲存在 Chrome 本機儲存中。設定匯出會下載包含敏感設定的本機 JSON 檔。當 Cloudflare 公共 API 未暴露精確計數器時，Workers Logs 事件數與 Analytics Engine 讀取查詢會顯示為不可用。',
      'How this extension handles credentials, usage data, and local configuration files.': '此擴充功能如何處理憑證、用量資料與本機設定檔。',
      'Exported configuration file': '匯出的設定檔',
      'API token and account ID if the user chooses to export a local JSON configuration file.': '使用者選擇匯出本機 JSON 設定檔時包含的 API 權杖與帳戶 ID。',
      'Configuration export creates a local JSON file selected by the user. The extension does not upload backup data, operate a server, or receive, sell, or share user data.': '設定匯出會建立由使用者選擇儲存的本機 JSON 檔。擴充功能不會上傳備份資料、不營運伺服器，也不會接收、出售或分享使用者資料。',
      "Cloudflare Quota Monitor's use and transfer of information received from Cloudflare APIs adheres to the Chrome Web Store User Data Policy, including the Limited Use requirements. Data is used only to provide quota monitoring, API validation, local cache history, and user-initiated configuration import/export.": 'Cloudflare Quota Monitor 對從 Cloudflare API 接收資訊的使用和傳輸遵守 Chrome Web Store 使用者資料政策，包括 Limited Use 要求。資料僅用於額度監控、API 驗證、本機快取歷史，以及使用者主動發起的設定匯入/匯出。',
      'Local configuration import/export': '本機設定匯入/匯出',
      'Replaced online WebDAV backup with local JSON export and import to avoid broad host permissions and improve Chrome Web Store review readiness.': '以本機 JSON 匯入/匯出取代線上 WebDAV 備份，避免寬泛 host 權限並提升 Chrome Web Store 審核準備度。',
      'Lower permission surface': '更低權限範圍',
      'Removed optional all-site host permissions. The extension now only requests Cloudflare API access, storage, alarms, and notifications.': '移除選用全站 host 權限。擴充功能現在只要求 Cloudflare API 存取、本機儲存、排程與通知權限。',
      'Translation cleanup': '翻譯清理',
      'Filled missing release-note and privacy descriptions across Simplified Chinese, Traditional Chinese, Japanese, and Korean.': '補齊簡體中文、繁體中文、日文與韓文中的發布說明和隱私描述翻譯。',
      'Privacy policy surfaces': '隱私權政策入口',
      'Added bundled and website-ready privacy policy documents, release packaging, and a refreshed extension icon.': '新增擴充功能內建與網站可發布的隱私權政策文件、發布打包腳本和新版擴充功能圖示。',
      'Added grouped dashboard, dense popup cards, Cloudflare API validation, Durable Objects metrics, and configuration portability.': '新增分組儀表板、高密度彈窗卡片、Cloudflare API 驗證、Durable Objects 指標與設定移轉能力。'
    },
    ja: {
      'Quota Monitor': 'Quota Monitor',
      'Extension settings': '拡張機能設定',
      'Settings sections': '設定セクション',
      'Official website': '公式サイト',
      'GitHub repository': 'GitHub リポジトリ',
      'Popup': 'ポップアップ',
      'Dashboard': 'ダッシュボード',
      'Settings': '設定',
      'API Configuration': 'API 設定',
      'Monitored Services': '監視サービス',
      'Sync Schedule': '同期スケジュール',
      'About': '概要',
      'Privacy': 'プライバシー',
      'Privacy Policy': 'プライバシーポリシー',
      'Release Notes': 'リリースノート',
      'Usage Overview': '使用状況概要',
      'Monitoring your service limits across the global network.': 'グローバルネットワーク全体のサービス上限を監視します。',
      'Cards': 'カード',
      'List': 'リスト',
      'Refresh': '更新',
      'Export Report': 'レポート出力',
      'Manage Limits': '上限を管理',
      'Data updates once per day automatically.': 'データは 1 日 1 回自動更新されます。',
      'Last 30 samples': '直近 30 サンプル',
      'Manage Cloudflare credentials used by local quota checks.': 'ローカルの使用量確認に使う Cloudflare 認証情報を管理します。',
      'Local Storage Only': 'ローカル保存のみ',
      'Required': '必須',
      'Cloudflare API token': 'Cloudflare API トークン',
      'Enter a read-only API token': '読み取り専用 API トークンを入力',
      'Account ID': 'アカウント ID',
      'API test results': 'API テスト結果',
      'Collapsed until testing': 'テスト前は折りたたみ',
      'Not tested': '未テスト',
      'Test API': 'API をテスト',
      'Save API Settings': 'API 設定を保存',
      'Optional': '任意',
      'Username': 'ユーザー名',
      'Password': 'パスワード',
      'Backup': 'バックアップ',
      'Restore': '復元',
      'Save': '保存',
      'Enabled': '有効',
      'Partial': '一部対応',
      'Daily': '毎日',
      'Language': '言語',
      'Follow browser': 'ブラウザーに従う',
      'Simplified Chinese': '簡体字中国語',
      'Traditional Chinese': '繁体字中国語',
      'English': '英語',
      'Japanese': '日本語',
      'Korean': '韓国語',
      'Default follows your browser language. Manual selection is stored locally.': '既定ではブラウザーの言語に従います。手動選択はローカルに保存されます。',
      'Product changes and release history.': '製品変更とリリース履歴。',
      'Local first': 'ローカル優先',
      'Data handled': '扱うデータ',
      'Read-only': '読み取り専用',
      'Cloudflare credentials': 'Cloudflare 認証情報',
      'Quota telemetry': 'クォータテレメトリ',
      'Storage and transfer': '保存と転送',
      'Chrome storage': 'Chrome ストレージ',
      'Limited Use disclosure': 'Limited Use 開示',
      'Chrome policy': 'Chrome ポリシー',
      'Chrome Web Store readiness': 'Chrome Web Store 公開準備',
      'Release packaging': 'リリースパッケージ',
      'Current': '現在',
      'Previous': '前のバージョン',
      'Initial release': '初回リリース',
      'Manual sync history cache': '手動同期の履歴キャッシュ',
      "Manual refresh now updates today's dashboard history sample and waits for cache writes before re-rendering charts.": '手動更新は当日のダッシュボード履歴サンプルを更新し、キャッシュ書き込み完了後にチャートを再描画します。',
      'Risk-aware usage visuals': 'リスクに応じた使用量表示',
      'Usage bars and dashboard trend lines now move from deep green to red as quota pressure increases.': '使用量バーとダッシュボードのトレンド線は、クォータの逼迫度に応じて濃い緑から赤へ変化します。',
      'Cleaner API testing': 'より整理された API テスト',
      'API capability results are collapsed by default and expand only when a test is run.': 'API 機能の結果は既定で折りたたまれ、テスト実行時のみ展開されます。',
      'Internationalization foundation': '国際化基盤',
      'Quota monitoring baseline': '使用量監視の基盤',
      'Import / Export': 'インポート/エクスポート',
      'Move settings between browsers with a local JSON file.': 'ローカル JSON ファイルでブラウザー間の設定を移行します。',
      'Configuration file': '設定ファイル',
      'No network permission': 'ネットワーク権限不要',
      'Exported files include sensitive settings.': 'エクスポートファイルには機密設定が含まれます。',
      'The exported JSON contains the Cloudflare API token and account ID. Store it securely and import only files you trust.': 'エクスポートされた JSON には Cloudflare API トークンとアカウント ID が含まれます。安全に保管し、信頼できるファイルだけをインポートしてください。',
      'Export current configuration': '現在の設定をエクスポート',
      'Downloads a local JSON file with API settings and language preference. No remote service is contacted.': 'API 設定と言語設定を含むローカル JSON ファイルをダウンロードします。リモートサービスには接続しません。',
      'Import configuration': '設定をインポート',
      'Loads a previously exported JSON file into Chrome local storage, then refreshes quota data.': '以前にエクスポートした JSON ファイルを Chrome ローカルストレージに読み込み、クォータデータを更新します。',
      'Import JSON': 'JSON をインポート',
      'Export JSON': 'JSON をエクスポート',
      'A Chrome extension for checking free-tier usage across Cloudflare developer products. Credentials stay local unless you export a configuration file.': 'Cloudflare 開発者製品の無料枠使用量を確認する Chrome 拡張機能です。設定ファイルをエクスポートしない限り、認証情報はローカルに保持されます。',
      'Tokens are stored in Chrome local storage. Configuration export downloads a local JSON file that includes sensitive settings. Workers Logs event count and Analytics Engine read queries are shown as unavailable when Cloudflare does not expose those exact counters through the public API.': 'トークンは Chrome ローカルストレージに保存されます。設定のエクスポートでは機密設定を含むローカル JSON ファイルをダウンロードします。Cloudflare の公開 API が正確なカウンターを提供しない場合、Workers Logs のイベント数と Analytics Engine の読み取りクエリは利用不可として表示されます。',
      'How this extension handles credentials, usage data, and local configuration files.': 'この拡張機能が認証情報、使用量データ、ローカル設定ファイルを扱う方法。',
      'Exported configuration file': 'エクスポートされた設定ファイル',
      'API token and account ID if the user chooses to export a local JSON configuration file.': 'ユーザーがローカル JSON 設定ファイルをエクスポートした場合の API トークンとアカウント ID。',
      'Configuration export creates a local JSON file selected by the user. The extension does not upload backup data, operate a server, or receive, sell, or share user data.': '設定のエクスポートは、ユーザーが選択したローカル JSON ファイルを作成します。この拡張機能はバックアップデータをアップロードせず、サーバーを運用せず、ユーザーデータを受信、販売、共有しません。',
      "Cloudflare Quota Monitor's use and transfer of information received from Cloudflare APIs adheres to the Chrome Web Store User Data Policy, including the Limited Use requirements. Data is used only to provide quota monitoring, API validation, local cache history, and user-initiated configuration import/export.": 'Cloudflare Quota Monitor による Cloudflare API から受け取った情報の使用と転送は、Limited Use 要件を含む Chrome Web Store ユーザーデータポリシーに従います。データはクォータ監視、API 検証、ローカルキャッシュ履歴、ユーザーが開始する設定のインポート/エクスポートにのみ使用されます。',
      'Local configuration import/export': 'ローカル設定のインポート/エクスポート',
      'Replaced online WebDAV backup with local JSON export and import to avoid broad host permissions and improve Chrome Web Store review readiness.': 'オンライン WebDAV バックアップをローカル JSON のエクスポート/インポートに置き換え、広範な host 権限を避けて Chrome Web Store 審査への準備を改善しました。',
      'Lower permission surface': '権限範囲の縮小',
      'Removed optional all-site host permissions. The extension now only requests Cloudflare API access, storage, alarms, and notifications.': '任意の全サイト host 権限を削除しました。拡張機能は Cloudflare API アクセス、ストレージ、アラーム、通知のみを要求します。',
      'Translation cleanup': '翻訳の整理',
      'Filled missing release-note and privacy descriptions across Simplified Chinese, Traditional Chinese, Japanese, and Korean.': '簡体字中国語、繁体字中国語、日本語、韓国語で不足していたリリースノートとプライバシー説明を補完しました。',
      'Privacy policy surfaces': 'プライバシーポリシー画面',
      'Added bundled and website-ready privacy policy documents, release packaging, and a refreshed extension icon.': '同梱版と Web 公開用のプライバシーポリシー文書、リリースパッケージ、更新された拡張機能アイコンを追加しました。',
      'Added grouped dashboard, dense popup cards, Cloudflare API validation, Durable Objects metrics, and configuration portability.': 'グループ化されたダッシュボード、高密度ポップアップカード、Cloudflare API 検証、Durable Objects メトリクス、設定の移行機能を追加しました。'
    },
    ko: {
      'Quota Monitor': 'Quota Monitor',
      'Extension settings': '확장 설정',
      'Settings sections': '설정 섹션',
      'Official website': '공식 웹사이트',
      'GitHub repository': 'GitHub 저장소',
      'Popup': '팝업',
      'Dashboard': '대시보드',
      'Settings': '설정',
      'API Configuration': 'API 설정',
      'Monitored Services': '모니터링 서비스',
      'Sync Schedule': '동기화 일정',
      'About': '정보',
      'Privacy': '개인정보',
      'Privacy Policy': '개인정보 처리방침',
      'Release Notes': '릴리스 노트',
      'Usage Overview': '사용량 개요',
      'Monitoring your service limits across the global network.': '글로벌 네트워크 전반의 서비스 한도를 모니터링합니다.',
      'Cards': '카드',
      'List': '목록',
      'Refresh': '새로고침',
      'Export Report': '보고서 내보내기',
      'Manage Limits': '한도 관리',
      'Data updates once per day automatically.': '데이터는 하루에 한 번 자동 업데이트됩니다.',
      'Last 30 samples': '최근 30개 샘플',
      'Manage Cloudflare credentials used by local quota checks.': '로컬 할당량 확인에 사용하는 Cloudflare 자격 증명을 관리합니다.',
      'Local Storage Only': '로컬 저장 전용',
      'Required': '필수',
      'Cloudflare API token': 'Cloudflare API 토큰',
      'Enter a read-only API token': '읽기 전용 API 토큰 입력',
      'Account ID': '계정 ID',
      'API test results': 'API 테스트 결과',
      'Collapsed until testing': '테스트 전 접힘',
      'Not tested': '테스트 안 됨',
      'Test API': 'API 테스트',
      'Save API Settings': 'API 설정 저장',
      'Optional': '선택',
      'Username': '사용자 이름',
      'Password': '비밀번호',
      'Backup': '백업',
      'Restore': '복원',
      'Save': '저장',
      'Enabled': '활성화됨',
      'Partial': '부분 지원',
      'Daily': '매일',
      'Language': '언어',
      'Follow browser': '브라우저 따르기',
      'Simplified Chinese': '중국어 간체',
      'Traditional Chinese': '중국어 번체',
      'English': '영어',
      'Japanese': '일본어',
      'Korean': '한국어',
      'Default follows your browser language. Manual selection is stored locally.': '기본값은 브라우저 언어를 따르며 수동 선택은 로컬에 저장됩니다.',
      'Product changes and release history.': '제품 변경 및 릴리스 기록.',
      'Local first': '로컬 우선',
      'Data handled': '처리되는 데이터',
      'Read-only': '읽기 전용',
      'Cloudflare credentials': 'Cloudflare 자격 증명',
      'Quota telemetry': '할당량 텔레메트리',
      'Storage and transfer': '저장 및 전송',
      'Chrome storage': 'Chrome 저장소',
      'Limited Use disclosure': 'Limited Use 공개',
      'Chrome policy': 'Chrome 정책',
      'Chrome Web Store readiness': 'Chrome Web Store 게시 준비',
      'Release packaging': '릴리스 패키징',
      'Current': '현재',
      'Previous': '이전 버전',
      'Initial release': '초기 릴리스',
      'Manual sync history cache': '수동 동기화 기록 캐시',
      "Manual refresh now updates today's dashboard history sample and waits for cache writes before re-rendering charts.": '수동 새로고침은 오늘의 대시보드 기록 샘플을 업데이트하고 캐시 쓰기가 끝난 뒤 차트를 다시 렌더링합니다.',
      'Risk-aware usage visuals': '위험도 기반 사용량 시각화',
      'Usage bars and dashboard trend lines now move from deep green to red as quota pressure increases.': '할당량 압박이 높아질수록 사용량 막대와 대시보드 추세선이 진한 녹색에서 빨간색으로 전환됩니다.',
      'Cleaner API testing': '더 정돈된 API 테스트',
      'API capability results are collapsed by default and expand only when a test is run.': 'API 기능 결과는 기본적으로 접혀 있으며 테스트 실행 시에만 펼쳐집니다.',
      'Internationalization foundation': '국제화 기반',
      'Quota monitoring baseline': '할당량 모니터링 기준',
      'Import / Export': '가져오기/내보내기',
      'Move settings between browsers with a local JSON file.': '로컬 JSON 파일로 브라우저 간 설정을 이동합니다.',
      'Configuration file': '구성 파일',
      'No network permission': '네트워크 권한 없음',
      'Exported files include sensitive settings.': '내보낸 파일에는 민감한 설정이 포함됩니다.',
      'The exported JSON contains the Cloudflare API token and account ID. Store it securely and import only files you trust.': '내보낸 JSON에는 Cloudflare API 토큰과 계정 ID가 포함됩니다. 안전하게 보관하고 신뢰하는 파일만 가져오세요.',
      'Export current configuration': '현재 구성 내보내기',
      'Downloads a local JSON file with API settings and language preference. No remote service is contacted.': 'API 설정과 언어 기본값이 포함된 로컬 JSON 파일을 다운로드합니다. 원격 서비스에는 연결하지 않습니다.',
      'Import configuration': '구성 가져오기',
      'Loads a previously exported JSON file into Chrome local storage, then refreshes quota data.': '이전에 내보낸 JSON 파일을 Chrome 로컬 저장소에 로드한 뒤 할당량 데이터를 새로고침합니다.',
      'Import JSON': 'JSON 가져오기',
      'Export JSON': 'JSON 내보내기',
      'A Chrome extension for checking free-tier usage across Cloudflare developer products. Credentials stay local unless you export a configuration file.': 'Cloudflare 개발자 제품의 무료 티어 사용량을 확인하는 Chrome 확장입니다. 구성 파일을 내보내지 않는 한 자격 증명은 로컬에 유지됩니다.',
      'Tokens are stored in Chrome local storage. Configuration export downloads a local JSON file that includes sensitive settings. Workers Logs event count and Analytics Engine read queries are shown as unavailable when Cloudflare does not expose those exact counters through the public API.': '토큰은 Chrome 로컬 저장소에 저장됩니다. 구성 내보내기는 민감한 설정이 포함된 로컬 JSON 파일을 다운로드합니다. Cloudflare 공개 API가 정확한 카운터를 제공하지 않는 경우 Workers Logs 이벤트 수와 Analytics Engine 읽기 쿼리는 사용할 수 없음으로 표시됩니다.',
      'How this extension handles credentials, usage data, and local configuration files.': '이 확장이 자격 증명, 사용량 데이터, 로컬 구성 파일을 처리하는 방식입니다.',
      'Exported configuration file': '내보낸 구성 파일',
      'API token and account ID if the user chooses to export a local JSON configuration file.': '사용자가 로컬 JSON 구성 파일을 내보낼 때 포함되는 API 토큰과 계정 ID입니다.',
      'Configuration export creates a local JSON file selected by the user. The extension does not upload backup data, operate a server, or receive, sell, or share user data.': '구성 내보내기는 사용자가 선택한 로컬 JSON 파일을 만듭니다. 이 확장은 백업 데이터를 업로드하거나 서버를 운영하거나 사용자 데이터를 수신, 판매, 공유하지 않습니다.',
      "Cloudflare Quota Monitor's use and transfer of information received from Cloudflare APIs adheres to the Chrome Web Store User Data Policy, including the Limited Use requirements. Data is used only to provide quota monitoring, API validation, local cache history, and user-initiated configuration import/export.": 'Cloudflare Quota Monitor가 Cloudflare API에서 받은 정보를 사용하고 전송하는 방식은 Limited Use 요구사항을 포함한 Chrome Web Store 사용자 데이터 정책을 따릅니다. 데이터는 할당량 모니터링, API 검증, 로컬 캐시 기록, 사용자가 시작한 구성 가져오기/내보내기에만 사용됩니다.',
      'Local configuration import/export': '로컬 구성 가져오기/내보내기',
      'Replaced online WebDAV backup with local JSON export and import to avoid broad host permissions and improve Chrome Web Store review readiness.': '광범위한 host 권한을 피하고 Chrome Web Store 심사 준비도를 높이기 위해 온라인 WebDAV 백업을 로컬 JSON 내보내기/가져오기로 대체했습니다.',
      'Lower permission surface': '권한 범위 축소',
      'Removed optional all-site host permissions. The extension now only requests Cloudflare API access, storage, alarms, and notifications.': '선택적 전체 사이트 host 권한을 제거했습니다. 이제 확장은 Cloudflare API 접근, 저장소, 알람, 알림 권한만 요청합니다.',
      'Translation cleanup': '번역 정리',
      'Filled missing release-note and privacy descriptions across Simplified Chinese, Traditional Chinese, Japanese, and Korean.': '중국어 간체, 중국어 번체, 일본어, 한국어에서 누락된 릴리스 노트와 개인정보 설명 번역을 보완했습니다.',
      'Privacy policy surfaces': '개인정보 처리방침 화면',
      'Added bundled and website-ready privacy policy documents, release packaging, and a refreshed extension icon.': '확장 내장 및 웹사이트 게시용 개인정보 처리방침 문서, 릴리스 패키징, 새 확장 아이콘을 추가했습니다.',
      'Added grouped dashboard, dense popup cards, Cloudflare API validation, Durable Objects metrics, and configuration portability.': '그룹화된 대시보드, 밀도 높은 팝업 카드, Cloudflare API 검증, Durable Objects 지표, 구성 이동 기능을 추가했습니다.'
    }
  };

  function normalizeLocale(locale) {
    const value = String(locale || '').replace('_', '-').toLowerCase();
    if (value.startsWith('zh-tw') || value.startsWith('zh-hk') || value.startsWith('zh-mo')) return 'zh-TW';
    if (value.startsWith('zh')) return 'zh-CN';
    if (value.startsWith('ja')) return 'ja';
    if (value.startsWith('ko')) return 'ko';
    return 'en';
  }

  function browserLocale() {
    if (typeof chrome !== 'undefined' && chrome.i18n?.getUILanguage) {
      return chrome.i18n.getUILanguage();
    }
    return navigator.language || 'en';
  }

  function readPreference(callback) {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get([STORAGE_KEY], result => callback(result[STORAGE_KEY] || 'auto'));
      return;
    }
    callback(localStorage.getItem(STORAGE_KEY) || 'auto');
  }

  function writePreference(value, callback) {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set({ [STORAGE_KEY]: value }, callback);
      return;
    }
    localStorage.setItem(STORAGE_KEY, value);
    callback();
  }

  function translateValue(value, locale) {
    const dictionary = DICTIONARIES[locale] || {};
    const trimmed = String(value || '').trim();
    return dictionary[trimmed] || trimmed;
  }

  function translateTextNodes(root, locale) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || ['SCRIPT', 'STYLE', 'SVG', 'PATH'].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
        return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });

    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const raw = node.nodeValue;
      const leading = raw.match(/^\s*/)[0];
      const trailing = raw.match(/\s*$/)[0];
      const translated = translateValue(raw, locale);
      if (translated !== raw.trim()) node.nodeValue = `${leading}${translated}${trailing}`;
    });
  }

  function translateAttributes(root, locale) {
    ['placeholder', 'aria-label', 'title'].forEach(attribute => {
      root.querySelectorAll(`[${attribute}]`).forEach(element => {
        const translated = translateValue(element.getAttribute(attribute), locale);
        if (translated) element.setAttribute(attribute, translated);
      });
    });
  }

  function applyI18n(locale) {
    document.documentElement.lang = locale;
    translateTextNodes(document.body, locale);
    translateAttributes(document.body, locale);
    if (document.title) document.title = translateValue(document.title, locale);
  }

  function bindLocaleSelect(preference) {
    document.querySelectorAll('[data-locale-select]').forEach(select => {
      select.value = preference;
      select.addEventListener('change', () => {
        writePreference(select.value, () => window.location.reload());
      });
    });
  }

  function init() {
    readPreference(preference => {
      const locale = preference === 'auto' ? normalizeLocale(browserLocale()) : normalizeLocale(preference);
      window.quotaI18n = {
        locale,
        preference,
        supportedLocales: SUPPORTED_LOCALES.slice(),
        t(value) {
          return translateValue(value, locale);
        }
      };
      applyI18n(locale);
      bindLocaleSelect(preference);
      const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              translateTextNodes(node, locale);
              translateAttributes(node, locale);
            } else if (node.nodeType === Node.TEXT_NODE && node.parentElement) {
              translateTextNodes(node.parentElement, locale);
            }
          });
        });
      });
      observer.observe(document.body, { childList: true, subtree: true });
      window.dispatchEvent(new CustomEvent('quota-i18n-ready', { detail: window.quotaI18n }));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
