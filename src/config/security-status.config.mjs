// Components on the Security status page (/security/status/).
//
// `repo` is the GitHub repository in the Blue-Dots-Economy organisation.
// `sonar` shows the SonarCloud ratings; `scans` shows how long ago each code
// scanning check last ran on `main`. Set either to false to hide that report.
// Removing an entry removes the row. The SECURITY_STATUS_DISABLED repository
// variable can switch reports off at deploy time; it cannot add a repo.

/** @typedef {{ repo: string, name: string, sonar: boolean, scans: boolean }} StatusComponent */

export const GITHUB_ORG = 'Blue-Dots-Economy';

/** @type {readonly StatusComponent[]} */
export const SECURITY_STATUS_COMPONENTS = [
  { repo: 'signals-dpg', name: 'Signals DPG', sonar: true, scans: true },
  { repo: 'aggregator-dpg', name: 'Aggregator DPG', sonar: true, scans: true },
  { repo: 'signals-search', name: 'Signals Search', sonar: true, scans: true },
  { repo: 'ai-diffusion-dpg', name: 'AI Diffusion DPG', sonar: true, scans: true },
  // Hidden: both reports off. Set `scans` (or `sonar`) to true to show again.
  { repo: 'notification-service', name: 'Notification service', sonar: false, scans: false },
  { repo: 'keycloak-otp-authenticator', name: 'Keycloak OTP authenticator', sonar: false, scans: false },
  { repo: 'bluedots-automation', name: 'Keycloak server image and deployment scripts', sonar: false, scans: false },
];

// SonarCloud measures shown for each component. These are ratings, not
// counts. Never add the vulnerabilities, bugs, code_smells or
// security_hotspots metrics: they publish the number of open findings.
export const SONAR_METRICS = /** @type {const} */ ({
  qualityGate: 'alert_status',
  security: 'security_rating',
  reliability: 'reliability_rating',
  maintainability: 'sqale_rating',
  coverage: 'coverage',
});

// Age limits for the badge next to each scan. Checks run on every change to
// `main` and once a month, so a scan older than a month means the monthly
// run did not happen.
export const SCAN_AGE_DAYS = {
  /** Up to this many days old: shown green. */
  recent: 7,
  /** Up to this many days old: shown blue. Older: shown amber. */
  monthly: 31,
};
