import { prisma } from '../src/lib/prisma';

async function runForEpoch(epochId: number) {
  const epoch = await prisma.epoch.findUnique({ where: { id: epochId }, include: { season: true } });
  if (!epoch) throw new Error('Epoch not found');

  const traders = await prisma.user.findMany();

  for (const user of traders) {
    const sum = await prisma.dailyPoint.aggregate({
      _sum: { points: true },
      where: { traderId: user.id, date: { gte: epoch.startAt, lt: epoch.endAt } }
    });

    const points = sum._sum.points ?? 0;

    await prisma.epochPoint.upsert({
      where: { epochId_traderId: { epochId: epoch.id, traderId: user.id } },
      update: { points },
      create: { epoch: { connect: { id: epoch.id } }, trader: { connect: { id: user.id } }, points }
    });
  }

  console.log(`Epoch ${epoch.id} aggregation complete.`);
}

const argEpoch = process.argv[2];
if (!argEpoch) { console.error('Usage: ts-node scripts/epoch-aggregate.ts <epochId>'); process.exit(1); }
runForEpoch(Number(argEpoch)).catch(err => { console.error(err); process.exit(1); });
