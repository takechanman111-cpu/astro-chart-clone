# Publication Checklist

Use this before publishing the app on your site.

## Required

- Run `npm run check:public`
- Run `npm run check:engine`
- Run `npm run check:api`
- Run `npm run check:timing`
- Run `npm run check:deploy` before final publishing
- Confirm `.env` is not committed
- Confirm no real user birth data is committed
- Confirm source-code link is visible in the app
- Confirm `PUBLIC_SOURCE_URL` is set on the production server
- Confirm `NOTICE.md`, `SECURITY.md`, and `PRIVACY.md` are included
- For public server mode, start with `npm run start:public` and open the public HTTPS URL instead of opening `index.html` directly
- Confirm `/healthz` returns `{ "status": "ok" }`

## If Swiss Ephemeris Is Added

- Run `npm run check:swiss`
- Run `npm run check:timing:strict`
- Add AGPL license text or license link
- Add Swiss Ephemeris notices
- Publish corresponding source code
