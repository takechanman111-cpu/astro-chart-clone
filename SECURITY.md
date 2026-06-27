# Security Policy

This app is designed so the source code can be public while private user data stays private.

## Public OK

- app source code
- calculation logic
- public license and notice files
- redacted reference samples
- fictional validation samples

## Never Commit

- `.env`
- API keys
- passwords
- database URLs
- private tokens
- real user names
- real user birth data
- saved chart IDs from third-party sites
- raw logs that include user input

## Birth Data Rule

Birth date, birth time, birthplace, latitude, longitude, and reading history can identify a person when combined. Treat them as private user data.

Default behavior should be:

- calculate in memory
- do not save user birth data unless the user explicitly chooses to save it
- do not write birth data to public logs
- do not include real user data in tests or reference fixtures

## Public Release Check

Run this before publishing or pushing source:

```bash
node scripts/check_public_release_safety.mjs
```

The check rejects common secret patterns, raw saved chart IDs, `.env` files, and missing public-source notices.

