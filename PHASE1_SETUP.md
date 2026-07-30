# The Hive — Phase 1 setup

Phase 1 adds:

- Password-protected Settings, Budget Management, Worker Bee Roster, and Hive Configuration pages.
- Manual settings fields for donor frequency, current theoretical yield, and unique donor count.
- A configurable dashboard rotation interval, defaulting to 120 seconds, for the Phase 2 rotating dashboard.
- A manager lock/logout control.

## Required local environment variables

Add these values to your existing `.env` file. Do not replace or remove your existing `DATABASE_URL`.

```env
ADMIN_PASSWORD="choose-a-strong-manager-password"
ADMIN_SESSION_SECRET="choose-a-different-long-random-secret"
```

Use the same names in Vercel under Project Settings → Environment Variables.

## Database and generated client

After copying these files into the working project, run:

```bash
npx prisma generate
npx prisma migrate deploy
npm run build
```

For a local development database workflow, `npx prisma migrate dev` may be used instead of `migrate deploy`.

## Test checklist

1. Open `/` and confirm the existing production dashboard is unchanged.
2. Select Settings or Budget Settings and confirm redirect to `/admin-login`.
3. Enter the configured manager password.
4. Open Hive Configuration and save donor frequency, theoretical yield, unique donor count, and 120-second rotation timing.
5. Select Lock Admin, then verify protected pages require the password again.
