import { prisma } from '../src/lib/prisma';
import { computeBoostedPoints } from '../src/lib/points';
import Decimal from 'decimal.js';

async function run(seasonId: number) {
  const season = await prisma.season.findUnique({ where: { id: seasonId }, include: { epochs: true } });
  if (!season) throw new Error('season not found');

  const users = await prisma.user.findMany();
  const tradingPointsMap = new Map<number, number>();

  for (const user of users) {
    const sum = await prisma.epochPoint.aggregate({ _sum: { points: true }, where: { epoch: { seasonId: seasonId }, traderId: user.id } });
    const tradingPoints = sum._sum.points ?? 0;
    tradingPointsMap.set(user.id, tradingPoints);
  }

  for (const ref of await prisma.referral.findMany()) {
    const referrerId = ref.referrerId;
    const refereeId = ref.refereeId;
    const refereeTradingPoints = tradingPointsMap.get(refereeId) ?? 0;
    const referralEarnings = Math.floor(refereeTradingPoints * 0.2);
    if (referralEarnings > 0) {
      await prisma.user.update({ where: { id: referrerId }, data: { referralPoints: { increment: referralEarnings } } });
    }
  }

  for (const user of users) {
    const tradingPoints = tradingPointsMap.get(user.id) ?? 0;
    let stakingMultiplier = new Decimal(1);
    const existing = await prisma.seasonPoint.findFirst({ where: { seasonId, traderId: user.id } });
    if (existing) {
      stakingMultiplier = new Decimal(existing.stakingMultiplier.toString());
      const boosted = computeBoostedPoints(tradingPoints, stakingMultiplier);
      const total = boosted + Number(user.referralPoints.toString());
      await prisma.seasonPoint.update({ where: { id: existing.id }, data: { tradingPoints, boostedPoints: boosted, referralPoints: Number(user.referralPoints.toString()), totalPoints: total } });
    } else {
      await prisma.seasonPoint.create({ data: { season: { connect: { id: seasonId } }, trader: { connect: { id: user.id } }, tradingPoints, stakingMultiplier: stakingMultiplier.toFixed(), boostedPoints: computeBoostedPoints(tradingPoints, stakingMultiplier), referralPoints: Number(user.referralPoints.toString()), totalPoints: computeBoostedPoints(tradingPoints, stakingMultiplier) + Number(user.referralPoints.toString()) } });
    }
  }

  console.log('Season finalize complete.');
}

const arg = process.argv[2];
if (!arg) { console.error('Usage: ts-node scripts/finalize-season.ts <seasonId>'); process.exit(1); }
run(Number(arg)).catch(err => { console.error(err); process.exit(1); });
