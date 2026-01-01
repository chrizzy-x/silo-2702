import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../src/lib/prisma';
import { inferTradeUsdAmount } from '../../../src/lib/points';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const limit = Number(req.query.limit ?? 20);
  const trades = await prisma.trade.findMany({
    orderBy: { timestamp: 'desc' },
    take: limit,
    include: { trader: true }
  });

  const out = trades.map(t => {
    const usd = inferTradeUsdAmount(t.pair, t.quoteAmount, t.price, t.baseAmount);
    return {
      id: t.id,
      timestamp: t.timestamp,
      traderAddress: t.trader.address,
      pair: t.pair,
      usd: usd.toString()
    };
  });

  res.status(200).json({ trades: out });
}
