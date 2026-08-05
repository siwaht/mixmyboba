---
name: Replit preview iframe cookies
description: Cookies must use SameSite=None + Secure + Partitioned over HTTPS, or the Replit preview iframe blocks them and auth appears broken
---

# Replit preview iframe cookie quirk

The Replit preview pane loads the app in a **cross-site iframe** (app on `*.replit.dev`, parent on replit.com). Browsers treat cookies set there as third-party and reject them unless they carry `Secure; SameSite=None; Partitioned`.

**Symptom:** the login API returns 200 and sets the cookie, but the very next request is unauthenticated (401s, middleware redirects back to the login page in a loop). Server-side curl tests pass, which makes it look like "the link doesn't work."

**Rule:** when setting session/auth cookies in a Replit-hosted app, detect HTTPS (`x-forwarded-proto === 'https'` or `nextUrl.protocol === 'https:'`) and set `secure: true, sameSite: 'none', partitioned: true`; keep `sameSite: 'lax'` only for plain-HTTP localhost. Deleting the cookie must use the **same** HTTPS-aware attributes too — a bare `Max-Age=0` clear gets rejected the same way, leaving the session alive after logout.

**Why:** Chrome's third-party cookie blocking (CHIPS) requires the `Partitioned` attribute; `SameSite=Lax` cookies are not sent on cross-site iframe requests at all.

**How to apply:** every route in the cookie's lifecycle (issue, refresh, clear) in any Replit-hosted app that authenticates via cookies.
