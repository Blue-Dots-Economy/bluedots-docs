---
title: Security
description: How the Blue Dots software is checked for quality and security, and where to see when each check last ran.
---

This section is for anyone who needs to know how the Blue Dots software is checked: an evaluator, a procurement team, or the person in charge of a deployment.

## How the software is checked

Each part of Blue Dots is open-source software kept on GitHub. Automatic checks run on the code every time it changes, and once a month.

| Check | What it looks for | Tool |
|---|---|---|
| Code quality and test coverage | Code that is hard to maintain or likely to fail, and how much of the code automatic tests cover | SonarCloud |
| Known weaknesses in other software | Other software that Blue Dots uses, with a published security weakness | Trivy and Dependabot |
| Container images | The packaged software that runs on the servers, checked for the same known weaknesses | Trivy |
| Passwords and keys in code | Passwords or keys saved in the code by mistake | Gitleaks |
| Code patterns | Ways of writing code that often lead to security problems | CodeQL |

Each check sends its results to a private list for the team that maintains the software.

## See how recently each check ran

[Quality and scan status](/security/status/) shows, for each part of Blue Dots, its code quality ratings and how long ago each check last ran.
