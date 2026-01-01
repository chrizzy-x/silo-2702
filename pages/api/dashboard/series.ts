import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../src/lib/prisma';
import { computeDailyPointsFromVolume } from '../../../src/lib/points';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const interval = String(req.query.interval ?? 'day');
  const limit = Number(req.query.limit ?? 30);

  if (interval !== 'day') return res.status(400).json({ error: 'only day interval supported' });

  const dates = await prisma.dailyPoint.findMany({
    orderBy: { date: 'desc' },
    take: limit
  });

  const series = dates.map(d => ({ date: d.date.toISOString().slice(0,10), volumeUsd: Number(d.volumeUsd.toString()), points: d.points }));
  return res.status(200).json({ series: series.reverse() });
}
