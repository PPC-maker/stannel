# גיבוי 14:00 - 16/03/2026

## סטטוס נוכחי

### משתמשים (זהים בלוקלי ובפרודקשן)
| # | אימייל | תפקיד | שם | פעיל |
|---|--------|-------|-----|------|
| 1 | admin@newpost.co.il | ADMIN | Admin | ✓ |
| 2 | aa@bb.co.il | ARCHITECT | אדריכל | ✓ |
| 3 | sapak@gmail.com | SUPPLIER | ספק | ✓ |

### כתובות פרודקשן
- **Web:** https://stannel-web-1094694418275.me-west1.run.app
- **API:** https://stannel-api-1094694418275.me-west1.run.app
- **Admin:** https://stannel-web-1094694418275.me-west1.run.app/admin

### Cloud Run Revisions
- **Web:** stannel-web-00018-nqw (deployed 11:48 UTC)
- **API:** stannel-api-00038-pcv

### פעולות שבוצעו
1. ✅ סנכרון WebSocket (הסרת console.logs)
2. ✅ תיקון Backend Dockerfile
3. ✅ פריסה לפרודקשן (Cloud Build)
4. ✅ סנכרון משתמשים מלוקלי לפרודקשן
5. ✅ גיבוי DB ל-BACKUP-14-00.json

### שחזור
לשחזור המשתמשים מהגיבוי, הרץ:
```bash
cd backend
node restore-from-backup.cjs
```

### קבצים
- `BACKUP-14-00.json` - גיבוי מלא של הDB
- `BACKUP-14-00.md` - תיעוד זה
