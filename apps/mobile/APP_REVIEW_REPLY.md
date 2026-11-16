# Reply to App Review (Guideline 2.1) — paste in "Reply to App Review" AND in App Review Information → Notes

Hello,

Thank you for the review. Answers below; a screen recording from a physical device (TestFlight build 1.0.5 (3)) is attached.

1. **Screen recording** — attached: launch, login, account deletion (Settings → "מחיקת חשבון" / Delete account), and the main screens. The app has no user-generated content (no posts, comments or user-to-user messaging), so no reporting/blocking mechanism is needed. There are no in-app purchases or paid features inside the app.

2. **Purpose and audience** — STANNEL Business Club is a closed B2B loyalty club for architects, designers and building-material suppliers in Israel. Architects upload purchase invoices from member suppliers, earn points, and redeem them for rewards and events. Suppliers confirm invoices and track their architects.

3. **How to access the app** — Demo account (architect): `appreview.architect@newpost.co.il` / `Stannel#Review2026`. Demo account (supplier): `appreview.supplier@newpost.co.il` / `Stannel#Review2026`. Registration is also available in-app; new accounts are activated by an administrator.

4. **External services** — Firebase Authentication (email/password, Google Sign-In, Sign in with Apple), Google Cloud Run + PostgreSQL (backend), Google Cloud Storage (invoice images), Google Vertex AI / Gemini (automatic invoice validation), email delivery for notifications.

5. **Regional differences** — The app behaves identically in all regions; it is intended for the Israeli market and the interface is in Hebrew (RTL). No features are geo-restricted.

6. **Regulated industries** — Not applicable; the app is not in a highly regulated industry.

Account deletion: Settings → "מחיקת חשבון" (bottom of the page) → confirm. The account is deactivated immediately and can no longer sign in.
