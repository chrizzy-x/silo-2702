# SiloPerps Dashboard & Points System

This implementation provides the SiloPerps Points Reward System.

Prerequisites
- Node 18+
- Postgres database
- .env with DATABASE_URL

Install
- npm install
- npm install prisma @prisma/client decimal.js axios react-chartjs-2 chart.js

Prisma
- npx prisma generate
- npx prisma migrate dev --name init

Daily aggregation
- Schedule scripts/daily-aggregate.ts at 00:05 UTC daily (cron or GitHub Actions)

Epoch aggregation
- Run scripts/epoch-aggregate.ts <epochId>

Season finalize
- Run scripts/finalize-season.ts <seasonId> after snapshots are prepared

Notes
- Staking multiplier snapshots must be recorded before finalization.
- Referral first-trade bonus (10 points) awarded at ingest when first trade >= $100.
