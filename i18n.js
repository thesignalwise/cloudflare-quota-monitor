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
      'WebDAV Backup': 'WebDAV 备份',
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
      'Backup includes sensitive settings.': '备份包含敏感设置。',
      'WebDAV backup uploads the Cloudflare API token, account ID, WebDAV username, and WebDAV password to the endpoint you configure. Use only a trusted HTTPS destination.': 'WebDAV 备份会将 Cloudflare API 令牌、账户 ID、WebDAV 用户名和 WebDAV 密码上传到你配置的端点。请只使用可信的 HTTPS 目标。',
      'WebDAV URL': 'WebDAV 地址',
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
      'A Chrome extension for checking free-tier usage across Cloudflare developer products. Credentials stay local unless you explicitly use WebDAV backup.': '用于检查 Cloudflare 开发者产品免费额度的 Chrome 扩展。除非你明确使用 WebDAV 备份，否则凭据保留在本地。',
      'service groups': '服务组',
      'extension runtime': '扩展运行时',
      'Tokens are stored in Chrome local storage. Workers Logs event count and Analytics Engine read queries are shown as unavailable when Cloudflare does not expose those exact counters through the public API.': '令牌存储在 Chrome 本地存储中。当 Cloudflare 公共 API 不暴露精确计数器时，Workers Logs 事件数和 Analytics Engine 读取查询会显示为不可用。',
      'Tokens are stored in Chrome local storage. WebDAV backup sends settings to the endpoint you configure. Workers Logs event count and Analytics Engine read queries are shown as unavailable when Cloudflare does not expose those exact counters through the public API.': '令牌存储在 Chrome 本地存储中。WebDAV 备份会将设置发送到你配置的端点。当 Cloudflare 公共 API 不暴露精确计数器时，Workers Logs 事件数和 Analytics Engine 读取查询会显示为不可用。',
      'How this extension handles credentials, usage data, and optional backups.': '此扩展如何处理凭据、用量数据和可选备份。',
      'Local first': '本地优先',
      'Data handled': '处理的数据',
      'Read-only': '只读',
      'Cloudflare credentials': 'Cloudflare 凭据',
      'API token and account ID entered by the user.': '用户输入的 API 令牌和账户 ID。',
      'Quota telemetry': '额度遥测',
      'Usage counts, limits, percentages, timestamps, and local history samples returned by Cloudflare APIs.': 'Cloudflare API 返回的用量计数、额度、百分比、时间戳和本地历史样本。',
      'Backup settings': '备份设置',
      'Optional WebDAV URL, username, password, and backup path if the user configures backup.': '用户配置备份时填写的可选 WebDAV 地址、用户名、密码和备份路径。',
      'Storage and transfer': '存储与传输',
      'Chrome storage': 'Chrome 存储',
      "The extension stores settings and cached quota results in `chrome.storage.local` on the user's browser profile. It sends the API token only to `https://api.cloudflare.com/` to verify the token and read quota telemetry.": '扩展会将设置和缓存的额度结果存储在用户浏览器 Profile 的 `chrome.storage.local` 中。API 令牌只会发送到 `https://api.cloudflare.com/` 用于验证令牌并读取额度遥测。',
      'When WebDAV backup is used, the extension requests runtime permission for the configured WebDAV origin and uploads a JSON backup that includes sensitive settings. The extension does not operate a server and does not receive, sell, or share user data.': '使用 WebDAV 备份时，扩展会请求配置的 WebDAV 来源运行时权限，并上传包含敏感设置的 JSON 备份。扩展不运营服务器，也不会接收、出售或共享用户数据。',
      'Limited Use disclosure': 'Limited Use 披露',
      'Chrome policy': 'Chrome 政策',
      "Cloudflare Quota Monitor's use and transfer of information received from Cloudflare APIs adheres to the Chrome Web Store User Data Policy, including the Limited Use requirements. Data is used only to provide quota monitoring, API validation, local cache history, and user-initiated backup/restore.": 'Cloudflare Quota Monitor 对从 Cloudflare API 接收的信息的使用和传输遵守 Chrome Web Store 用户数据政策，包括 Limited Use 要求。数据仅用于额度监控、API 验证、本地缓存历史以及用户主动发起的备份/恢复。',
      'The extension does not use Cloudflare API data for advertising, profiling, resale, or unrelated analytics.': '扩展不会将 Cloudflare API 数据用于广告、画像、转售或无关分析。',
      'Chrome Web Store readiness': 'Chrome Web Store 发布准备',
      'Reduced default host permissions to Cloudflare only, moved WebDAV access to runtime host permission prompts, and added privacy policy surfaces.': '默认 host 权限已收窄为仅 Cloudflare，WebDAV 访问改为运行时 host 权限申请，并新增隐私条款入口。',
      'Safer WebDAV backup': '更安全的 WebDAV 备份',
      'Backup now warns that credentials are included before uploading settings to the user-configured WebDAV endpoint.': '备份在上传设置到用户配置的 WebDAV 端点前，会提示其中包含凭据。',
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
      'Added grouped dashboard, dense popup cards, Cloudflare API validation, Durable Objects metrics, and WebDAV backup.': '新增分组仪表盘、高密度弹窗卡片、Cloudflare API 验证、Durable Objects 指标和 WebDAV 备份。'
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
      'WebDAV Backup': 'WebDAV 備份',
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
      'Backup includes sensitive settings.': '備份包含敏感設定。',
      'WebDAV backup uploads the Cloudflare API token, account ID, WebDAV username, and WebDAV password to the endpoint you configure. Use only a trusted HTTPS destination.': 'WebDAV 備份會將 Cloudflare API 權杖、帳戶 ID、WebDAV 使用者名稱和 WebDAV 密碼上傳到你設定的端點。請只使用可信任的 HTTPS 目的地。',
      'WebDAV URL': 'WebDAV 位址',
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
      'A Chrome extension for checking free-tier usage across Cloudflare developer products. Credentials stay local unless you explicitly use WebDAV backup.': '用於檢查 Cloudflare 開發者產品免費額度的 Chrome 擴充功能。除非你明確使用 WebDAV 備份，否則憑證保留在本機。',
      'service groups': '服務群組',
      'extension runtime': '擴充功能執行環境',
      'Tokens are stored in Chrome local storage. Workers Logs event count and Analytics Engine read queries are shown as unavailable when Cloudflare does not expose those exact counters through the public API.': '權杖儲存在 Chrome 本機儲存中。當 Cloudflare 公共 API 未暴露精確計數器時，Workers Logs 事件數與 Analytics Engine 讀取查詢會顯示為不可用。',
      'Tokens are stored in Chrome local storage. WebDAV backup sends settings to the endpoint you configure. Workers Logs event count and Analytics Engine read queries are shown as unavailable when Cloudflare does not expose those exact counters through the public API.': '權杖儲存在 Chrome 本機儲存中。WebDAV 備份會將設定傳送到你設定的端點。當 Cloudflare 公共 API 未暴露精確計數器時，Workers Logs 事件數與 Analytics Engine 讀取查詢會顯示為不可用。',
      'How this extension handles credentials, usage data, and optional backups.': '此擴充功能如何處理憑證、用量資料和選用備份。',
      'Local first': '本機優先',
      'Data handled': '處理的資料',
      'Read-only': '唯讀',
      'Cloudflare credentials': 'Cloudflare 憑證',
      'API token and account ID entered by the user.': '使用者輸入的 API 權杖和帳戶 ID。',
      'Quota telemetry': '額度遙測',
      'Usage counts, limits, percentages, timestamps, and local history samples returned by Cloudflare APIs.': 'Cloudflare API 回傳的用量計數、額度、百分比、時間戳與本機歷史樣本。',
      'Backup settings': '備份設定',
      'Optional WebDAV URL, username, password, and backup path if the user configures backup.': '使用者設定備份時填寫的選用 WebDAV 位址、使用者名稱、密碼與備份路徑。',
      'Storage and transfer': '儲存與傳輸',
      'Chrome storage': 'Chrome 儲存',
      "The extension stores settings and cached quota results in `chrome.storage.local` on the user's browser profile. It sends the API token only to `https://api.cloudflare.com/` to verify the token and read quota telemetry.": '擴充功能會將設定和快取的額度結果儲存在使用者瀏覽器 Profile 的 `chrome.storage.local` 中。API 權杖只會傳送到 `https://api.cloudflare.com/` 用於驗證權杖並讀取額度遙測。',
      'When WebDAV backup is used, the extension requests runtime permission for the configured WebDAV origin and uploads a JSON backup that includes sensitive settings. The extension does not operate a server and does not receive, sell, or share user data.': '使用 WebDAV 備份時，擴充功能會要求設定的 WebDAV 來源執行階段權限，並上傳包含敏感設定的 JSON 備份。擴充功能不營運伺服器，也不會接收、出售或分享使用者資料。',
      'Limited Use disclosure': 'Limited Use 揭露',
      'Chrome policy': 'Chrome 政策',
      "Cloudflare Quota Monitor's use and transfer of information received from Cloudflare APIs adheres to the Chrome Web Store User Data Policy, including the Limited Use requirements. Data is used only to provide quota monitoring, API validation, local cache history, and user-initiated backup/restore.": 'Cloudflare Quota Monitor 對從 Cloudflare API 接收資訊的使用和傳輸遵守 Chrome Web Store 使用者資料政策，包括 Limited Use 要求。資料僅用於額度監控、API 驗證、本機快取歷史以及使用者主動發起的備份/還原。',
      'The extension does not use Cloudflare API data for advertising, profiling, resale, or unrelated analytics.': '擴充功能不會將 Cloudflare API 資料用於廣告、輪廓分析、轉售或無關分析。',
      'Chrome Web Store readiness': 'Chrome Web Store 發布準備',
      'Reduced default host permissions to Cloudflare only, moved WebDAV access to runtime host permission prompts, and added privacy policy surfaces.': '預設 host 權限已縮小為僅 Cloudflare，WebDAV 存取改為執行階段 host 權限提示，並新增隱私權政策入口。',
      'Safer WebDAV backup': '更安全的 WebDAV 備份',
      'Backup now warns that credentials are included before uploading settings to the user-configured WebDAV endpoint.': '備份在上傳設定到使用者設定的 WebDAV 端點前，會提示其中包含憑證。',
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
      'Added grouped dashboard, dense popup cards, Cloudflare API validation, Durable Objects metrics, and WebDAV backup.': '新增分組儀表板、高密度彈窗卡片、Cloudflare API 驗證、Durable Objects 指標與 WebDAV 備份。'
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
      'WebDAV Backup': 'WebDAV バックアップ',
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
      'How this extension handles credentials, usage data, and optional backups.': 'この拡張機能が認証情報、使用量データ、任意のバックアップを扱う方法。',
      'Local first': 'ローカル優先',
      'Data handled': '扱うデータ',
      'Read-only': '読み取り専用',
      'Backup includes sensitive settings.': 'バックアップには機密設定が含まれます。',
      'WebDAV backup uploads the Cloudflare API token, account ID, WebDAV username, and WebDAV password to the endpoint you configure. Use only a trusted HTTPS destination.': 'WebDAV バックアップは Cloudflare API トークン、アカウント ID、WebDAV ユーザー名、WebDAV パスワードを設定済みエンドポイントへアップロードします。信頼できる HTTPS の保存先だけを使用してください。',
      'Cloudflare credentials': 'Cloudflare 認証情報',
      'Quota telemetry': 'クォータテレメトリ',
      'Backup settings': 'バックアップ設定',
      'Storage and transfer': '保存と転送',
      'Chrome storage': 'Chrome ストレージ',
      'Limited Use disclosure': 'Limited Use 開示',
      'Chrome policy': 'Chrome ポリシー',
      'Chrome Web Store readiness': 'Chrome Web Store 公開準備',
      'Safer WebDAV backup': 'より安全な WebDAV バックアップ',
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
      'Quota monitoring baseline': '使用量監視の基盤'
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
      'WebDAV Backup': 'WebDAV 백업',
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
      'How this extension handles credentials, usage data, and optional backups.': '이 확장이 자격 증명, 사용량 데이터, 선택적 백업을 처리하는 방식입니다.',
      'Local first': '로컬 우선',
      'Data handled': '처리되는 데이터',
      'Read-only': '읽기 전용',
      'Backup includes sensitive settings.': '백업에는 민감한 설정이 포함됩니다.',
      'WebDAV backup uploads the Cloudflare API token, account ID, WebDAV username, and WebDAV password to the endpoint you configure. Use only a trusted HTTPS destination.': 'WebDAV 백업은 Cloudflare API 토큰, 계정 ID, WebDAV 사용자 이름 및 비밀번호를 설정한 엔드포인트로 업로드합니다. 신뢰할 수 있는 HTTPS 대상만 사용하세요.',
      'Cloudflare credentials': 'Cloudflare 자격 증명',
      'Quota telemetry': '할당량 텔레메트리',
      'Backup settings': '백업 설정',
      'Storage and transfer': '저장 및 전송',
      'Chrome storage': 'Chrome 저장소',
      'Limited Use disclosure': 'Limited Use 공개',
      'Chrome policy': 'Chrome 정책',
      'Chrome Web Store readiness': 'Chrome Web Store 게시 준비',
      'Safer WebDAV backup': '더 안전한 WebDAV 백업',
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
      'Quota monitoring baseline': '할당량 모니터링 기준'
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
