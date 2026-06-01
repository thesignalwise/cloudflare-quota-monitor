# Privacy Policy for Cloudflare Quota Monitor

Effective date: 2026-05-25

Cloudflare Quota Monitor is a Chrome extension that helps users monitor Cloudflare free-tier quota usage. The extension is local-first and does not operate a backend service.

## Data handled

The extension may handle:

- Cloudflare API token and Cloudflare Account ID entered by the user.
- Cloudflare quota telemetry, including usage counts, limits, percentages, timestamps, and local history samples returned by Cloudflare APIs.
- Optional local configuration export files selected by the user. Exported files include the Cloudflare API token, account ID, latest quota cache, and local dashboard history.
- Extension preferences such as language selection and cached refresh state.

## How data is used

Data is used only to:

- Verify the configured Cloudflare API token.
- Read Cloudflare quota and analytics telemetry for the configured account.
- Display quota usage, risk levels, local history charts, and API capability test results.
- Store settings and cached quota results locally in the user's Chrome profile.
- Run user-initiated local configuration import and export.

## Storage and transfer

Settings and cached quota results are stored in `chrome.storage.local` on the user's browser profile.

The extension sends the Cloudflare API token only to `https://api.cloudflare.com/` for token verification and read-only quota telemetry requests.

If the user exports configuration, the extension creates a local JSON file through the browser. The exported file includes sensitive settings such as the Cloudflare API token and account ID, plus cached monitoring data and local dashboard history. Users should store exported files securely and import only files they trust.

## Data sharing

The extension does not sell, rent, or share user data. The developer does not receive user credentials or telemetry through the extension.

Cloudflare receives API requests required to provide the quota data. The extension does not upload backup data to any developer-operated service.

## Limited Use disclosure

Cloudflare Quota Monitor's use and transfer of information received from Cloudflare APIs adheres to the Chrome Web Store User Data Policy, including the Limited Use requirements. Data is used only to provide quota monitoring, API validation, local cache history, and user-initiated configuration import/export.

The extension does not use Cloudflare API data for advertising, profiling, resale, or unrelated analytics.

## Permissions

The extension requests:

- `storage`: save settings and cached quota data locally.
- `alarms`: refresh quota data on a schedule.
- `notifications`: notify the user about quota risk when applicable.
- `https://api.cloudflare.com/*`: verify tokens and read Cloudflare quota telemetry.
The extension does not request optional broad host permissions for backup or restore.

## Contact

For privacy questions, contact thesignalwise@thesignalwise.com.
