# Payments and tax

Get paid, stay compliant, follow store billing rules.

Phase: Foundation · Last verified: 2026-10-24 · Checklist applies when: any of paid

## pay.live-test: Live payment tested with a real card, including a refund

- **Priority:** blocker · ~30 min · **Applies when:** any of platform:web, platform:desktop, platform:api, platform:cli, platform:extension
- **Why:** Test mode hides tax, 3DS and webhook issues that only show up in live mode.
- **Steps:**
  1. (any of svc:stripe) Stripe: switch to live keys, buy your cheapest plan, then refund it from the dashboard.
  2. Confirm the webhook upgraded and then downgraded the account.

## pay.store-billing: Digital purchases in the app use store billing

- **Priority:** blocker · ~120 min · **Applies when:** any of mobile, store:mac_app_store
- **Why:** Apple and Google reject apps that sell digital goods outside their billing (with narrow exceptions).
- **Steps:**
  1. (any of platform:ios) iOS: use StoreKit (or RevenueCat) for subscriptions and unlocks.
  2. (any of platform:android) Android: use Google Play Billing.
  3. (any of fw:expo) Expo: react-native-purchases (RevenueCat) handles both stores.
  4. (any of fw:flutter) Flutter: use in_app_purchase or purchases_flutter.

## pay.mor: Merchant of record or tax collection decided

- **Priority:** recommended · ~45 min · **Applies when:** any of platform:web, platform:desktop, platform:api, platform:cli, platform:extension
- **Why:** Selling worldwide means VAT/GST in dozens of countries. Someone has to collect it.
- **Steps:**
  1. Use a merchant of record (Paddle, Lemon Squeezy, Polar), or Stripe Tax and register yourself.

## pay.pricing-page: Pricing page matches what checkout charges

- **Priority:** recommended · ~15 min · **Applies when:** all of store:website
- **Why:** Mismatches cause chargebacks and support tickets on launch day.
- **Steps:**
  1. Compare each plan's price, currency and trial with the checkout page.

## pay.dunning: Failed-payment emails and retries

- **Priority:** recommended · ~20 min · **Applies when:** all of pricing:subscription; none of mobile
- **Why:** Involuntary churn from expired cards is often 20–40% of subscription churn.
- **Steps:**
  1. (any of svc:stripe) Stripe: turn on Smart Retries and the failed-payment emails in Billing settings.
  2. Email users before access is cut off.

## pay.license-keys: License keys or account check for paid desktop and CLI builds

- **Priority:** recommended · ~90 min · **Applies when:** any of platform:desktop, platform:cli; none of store:mac_app_store, store:microsoft_store
- **Why:** Downloadable software needs a way to unlock paid features offline.
- **Steps:**
  1. Issue keys from your merchant of record or license service.
  2. Validate on launch with an offline grace period.
