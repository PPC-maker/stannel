# Google Play — Production access (prepared 2026-11-10)

App: STANNEL BUSINESS CLUB — package `com.stannel.app` (versionCode 10 in app.json, version 1.0.6)
Closed test started: Oct 28 — first round did not get production access ("More testing required"); the 14-day counter restarted.

## New round (1.0.6)
- 1.0.6 fixes: login is now kept after closing the app on iPhone (WebView no longer runs in non-persistent mode).
- Android build: https://expo.dev/accounts/stannel_app/projects/stannel/builds/9f43b46d-effe-41f0-9f09-4962dc755e20
- iOS build: https://expo.dev/accounts/stannel_app/projects/stannel/builds/dc454441-b013-4940-bc94-2b12ac2fadc4
- Download the AAB and upload it MANUALLY to Closed testing (never `eas submit` — it targets the production track).
- iOS: submit to TestFlight only after Apple approves 1.0.5; verify login persists after full close/reopen before sending 1.0.6 to review.
- Ask testers to keep the app installed and open it regularly during the 14 days.

## Tomorrow checklist
1. Play Console → Dashboard → confirm "14 days" and that "Apply for production access" is enabled.
2. Click it, fill the questionnaire (answers below).
3. Wait for Google's approval (usually a few days).
4. Production → Create new release → upload latest AAB → send for review.

## Do now (App content)
- **App access**: choose "restricted" and add demo accounts:
  - Architect: appreview.architect@newpost.co.il / Stannel#Review2026
  - Supplier: appreview.supplier@newpost.co.il / Stannel#Review2026
  - Instructions: "Sign in with email and password. Registration is also available in-app; new accounts are activated by an administrator."
- **Privacy policy URL**: https://stannelclub.co.il/privacy
- **Data safety**: declare account creation + deletion; data collected: name, email, phone, invoice images (Google Cloud Storage). In transit encryption: yes. Users can request deletion: yes.
- **Account deletion URL**: needs a public web page (see open item below).
- **Target audience**: adults 18+ (B2B). **Ads**: none. **Content rating**: questionnaire, no UGC.

## Questionnaire answers (adjust to what really happened)

**What does your app do / target users**
STANNEL Business Club is a closed B2B loyalty club for architects, designers and building-material suppliers in Israel. Architects upload purchase invoices from member suppliers, earn points and redeem them for rewards and events. Suppliers confirm invoices and track their architects. The interface is in Hebrew (RTL).

**How did you test with your testers**
The closed test ran with 12+ testers for 14 days on real Android devices. Testers registered, logged in, uploaded invoices, checked their wallet/points, browsed rewards and events, and tested account deletion.

**Feedback received and changes made** — FILL IN (real items only)
- Feedback 1: ...  → change: ...
- Feedback 2: ...  → change: ...
(Known fix shipped: admin "restore deleted user" error message. Account-deletion flow verified on a physical device.)

**Why the app is ready for production**
No crashes or blocking issues were reported during the closed test; the demo accounts and in-app account deletion work; backend runs on Google Cloud Run with Firebase Authentication.

## Open items (not verified)
- No standalone public "delete account" web page found in apps/web (only Settings inside the app). Google may require a URL → add a simple page (additive change).
- Confirm the latest AAB (versionCode > 9 if you changed code) is uploaded and both demo accounts log in.
- Fill the real tester feedback above; do not invent it.
