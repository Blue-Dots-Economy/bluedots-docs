// Prints `repos=<comma-separated list>` for $GITHUB_OUTPUT: the repos whose
// scan dates the Security status page fetches, after SECURITY_STATUS_DISABLED
// is applied. The deploy workflow limits the GitHub App token to this list.
// Prints `repos=` when no repo needs scan dates; the workflow then skips the
// token. Uses Node built-ins only.

import { SECURITY_STATUS_COMPONENTS } from '../src/config/security-status.config.mjs';
import { applyDisabled, scanRepos } from '../src/lib/security-status.mjs';

const { components } = applyDisabled(SECURITY_STATUS_COMPONENTS, process.env.SECURITY_STATUS_DISABLED);
console.log(`repos=${scanRepos(components).join(',')}`);
