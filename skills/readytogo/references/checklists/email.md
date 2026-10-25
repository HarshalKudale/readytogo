# Email and deliverability

A support inbox, and email that lands in the inbox.

Phase: Foundation · Last verified: 2026-10-24 · Checklist applies when: none of platform:library

## email.support: Support address on your own domain

- **Priority:** blocker · ~15 min · **Applies when:** the checklist applies
- **Why:** Stores, users and reviewers need a way to reach you that isn't a personal Gmail.
- **Steps:**
  1. Create support@ or hello@ on your domain.
  2. Forward it somewhere you read daily.

## email.mx: MX records set and inbound mail tested

- **Priority:** recommended · ~10 min · **Applies when:** the checklist applies
- **Why:** Store reviewers and users email you. Bounced mail is lost goodwill.
- **Steps:**
  1. Add MX records for your mail provider.
  2. Send a test email from an outside account.

## email.spf: SPF record covering every sending service

- **Priority:** blocker · ~15 min · **Applies when:** any of data:accounts, data:emails
- **Why:** Without SPF, signup and reset emails land in spam or get rejected.
- **Steps:**
  1. Publish one TXT record: v=spf1 include:<each provider> ~all.
  2. (any of svc:supabase) Supabase Auth: set up custom SMTP first. The built-in sender is rate-limited and not for production.

## email.dkim: DKIM signing on for every sending service

- **Priority:** blocker · ~15 min · **Applies when:** any of data:accounts, data:emails
- **Why:** Gmail and Yahoo require authenticated mail from bulk and app senders.
- **Steps:**
  1. Add the DKIM CNAME or TXT records your provider gives you.
  2. Verify in the provider's dashboard.

## email.dmarc: DMARC record (start with p=none)

- **Priority:** recommended · ~10 min · **Applies when:** any of data:accounts, data:emails
- **Why:** Protects your domain from spoofing and is required by major inboxes.
- **Steps:**
  1. Publish _dmarc TXT: v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com.
  2. Tighten to quarantine once reports look clean.

## email.transactional: Signup, reset and receipt emails tested in Gmail and Outlook

- **Priority:** blocker · ~30 min · **Applies when:** any of data:accounts
- **Why:** A reset email in spam is a lost user.
- **Steps:**
  1. Use a transactional provider (Resend, Postmark, SES).
  2. (any of svc:firebase) Firebase Auth: customise the action URL and sender domain for auth emails.
  3. (any of svc:clerk) Clerk: verify your sending domain in the Clerk dashboard.
  4. Send each email to a Gmail and an Outlook inbox and check placement.

## email.unsubscribe: One-click unsubscribe and a postal address in marketing emails

- **Priority:** recommended · ~15 min · **Applies when:** any of data:emails
- **Why:** Required by CAN-SPAM, GDPR and Gmail's bulk sender rules.
- **Steps:**
  1. Add a List-Unsubscribe header and a visible unsubscribe link.
  2. Include a postal address in the footer.
