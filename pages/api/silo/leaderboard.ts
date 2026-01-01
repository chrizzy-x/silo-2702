import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../src/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const q = req.query;
  const limit = Number(q.limit ?? 20);

  const latestSeason = await prisma.season.findFirst({ orderBy: { startAt: 'desc' } });
  if (!latestSeason) return res.status(200).json({ leaderboard: [] });

  const points = await prisma.seasonPoint.findMany({
    where: { seasonId: latestSeason.id },
    orderBy: { totalPoints: 'desc' },
    take: limit,
    include: { trader: true }
  });

  const leaderboard = points.map(p => ({ address: p.trader.address, totalPoints: p.totalPoints }));
  return res.status(200).json({ leaderboard });
}
