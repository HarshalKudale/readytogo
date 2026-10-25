# Domain and DNS

Own your domain, serve it securely, wire up app links.

Phase: Foundation · Last verified: 2026-10-24 · Checklist applies when: none of platform:library

## domain.registered: Domain registered with auto-renew on

- **Priority:** blocker · ~10 min · **Applies when:** the checklist applies
- **Why:** An expired domain takes your product, email and policy URLs offline at once.
- **Needs product copy:** url
- **Steps:**
  1. Turn on auto-renew at your registrar.
  2. Make sure the payment card on file won't expire soon.

## domain.lock: Registrar lock and two-factor auth

- **Priority:** recommended · ~5 min · **Applies when:** the checklist applies
- **Why:** Domain hijacking usually starts with a weak registrar login.
- **Steps:**
  1. Enable transfer lock.
  2. Turn on 2FA for the registrar account.

## domain.https: HTTPS everywhere with auto-renewing certificates

- **Priority:** blocker · ~15 min · **Applies when:** any of store:website, platform:web, platform:api
- **Why:** Browsers flag HTTP as not secure, and stores reject non-HTTPS policy URLs.
- **Steps:**
  1. (any of host:vercel, host:netlify, host:cloudflare) Vercel, Netlify and Cloudflare issue certificates automatically once DNS points at them.
  2. (any of host:self, host:cloud, host:paas) On your own server, use Caddy or certbot with auto-renewal.
  3. Redirect all HTTP traffic to HTTPS.

## domain.canonical: One canonical host (www → apex or the reverse)

- **Priority:** recommended · ~10 min · **Applies when:** any of store:website
- **Why:** Two hosts split your SEO signals and break cookies.
- **Steps:**
  1. Pick one host.
  2. 301-redirect the other to it.

## domain.policy-urls: Privacy and support pages live on your domain

- **Priority:** blocker · ~20 min · **Applies when:** any of mobile, platform:desktop, platform:extension
- **Why:** Every app and extension store requires public privacy and support URLs.
- **Steps:**
  1. Publish /privacy and /support (or a contact page) on your domain.
  2. Check they load without login and on mobile.

## domain.deeplinks-ios: apple-app-site-association for Universal Links

- **Priority:** recommended · ~30 min · **Applies when:** any of platform:ios
- **Why:** Without it, links to your site open Safari instead of your app.
- **Auto-check:** `readytogo check` verifies this one.
- **Steps:**
  1. Serve /.well-known/apple-app-site-association as JSON over HTTPS, without redirects.
  2. Add the Associated Domains entitlement (applinks:yourdomain.com).
  3. (any of fw:expo) Expo: set ios.associatedDomains in app.json.

## domain.deeplinks-android: assetlinks.json for Android App Links

- **Priority:** recommended · ~30 min · **Applies when:** any of platform:android
- **Why:** Verified App Links open your app directly, without the 'Open with' chooser.
- **Auto-check:** `readytogo check` verifies this one.
- **Steps:**
  1. Serve /.well-known/assetlinks.json with your package name and the Play App Signing SHA-256 fingerprint.
  2. Add an autoVerify intent filter for your domain.
  3. (any of fw:expo) Expo: set android.intentFilters with autoVerify in app.json.

## domain.api-cors: API on its own subdomain with CORS locked down

- **Priority:** recommended · ~20 min · **Applies when:** any of platform:api
- **Why:** A wildcard CORS policy lets any site call your API with your users' credentials.
- **Steps:**
  1. Serve the API from api.yourdomain.com.
  2. Allow only your own origins in CORS.
