import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../src/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const sumVol = await prisma.dailyVolume.aggregate({ _sum: { volumeUsd: true } });
  const totalVolume = sumVol._sum.volumeUsd ?? '0';

  const d = new Date();
  const utcToday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const prev = new Date(utcToday);
  prev.setUTCDate(utcToday.getUTCDate() - 1);

  const vol24 = await prisma.dailyVolume.aggregate({
    _sum: { volumeUsd: true },
    where: { date: prev }
  });

  const sp = await prisma.seasonPoint.aggregate({ _sum: { totalPoints: true } });

  return res.status(200).json({
    totalVolume,
    volume24h: vol24._sum.volumeUsd ?? '0',
    totalSiloPoints: sp._sum.totalPoints ?? 0
  });
}
