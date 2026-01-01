import { prisma } from '../src/lib/prisma';
import { inferTradeUsdAmount, computeDailyPointsFromVolume } from '../src/lib/points';
import Decimal from 'decimal.js';

function getUtcDateDaysAgo(daysAgo = 1) {
  const d = new Date();
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  utc.setUTCDate(utc.getUTCDate() - daysAgo);
  return utc;
}

function toIsoDate(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

async function run() {
  const targetDate = getUtcDateDaysAgo(1);
  const dayStart = toIsoDate(targetDate);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayStart.getUTCDate() + 1);

  console.log(`Aggregating trades for date ${dayStart.toISOString().slice(0,10)}`);

  const trades = await prisma.trade.findMany({
    where: { timestamp: { gte: dayStart, lt: dayEnd } },
    include: { trader: true }
  });

  const map = new Map<number, Decimal>();
  for (const t of trades) {
    const tradeUsd = inferTradeUsdAmount(t.pair, t.quoteAmount, t.price, t.baseAmount);
    const existing = map.get(t.traderId) ?? new Decimal(0);
    map.set(t.traderId, existing.plus(tradeUsd));
  }

  for (const [traderId, volume] of map.entries()) {
    await prisma.dailyVolume.upsert({
      where: { date_traderId: { date: dayStart, traderId } },
      update: { volumeUsd: volume.toFixed() },
      create: { date: dayStart, trader: { connect: { id: traderId } }, volumeUsd: volume.toFixed() }
    });

    const points = computeDailyPointsFromVolume(volume);

    await prisma.dailyPoint.create({
      data: {
        date: dayStart,
        trader: { connect: { id: traderId } },
        volumeUsd: volume.toFixed(),
        points
      }
    });

    console.log(`Trader ${traderId} volume=${volume.toFixed()} points=${points}`);
  }

  console.log('Daily aggregation complete.');
}

run().catch(err => { console.error(err); process.exit(1); });
