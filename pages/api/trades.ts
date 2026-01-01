import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../src/lib/prisma';
import { inferTradeUsdAmount } from '../../src/lib/points';
import Decimal from 'decimal.js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body;
    const {
      tradeId,
      timestamp,
      pair,
      baseAmount,
      quoteAmount,
      price,
      traderAddress,
      metadata
    } = body;

    if (!timestamp || !pair || !traderAddress) {
      return res.status(400).json({ error: 'missing fields: timestamp | pair | traderAddress' });
    }

    const base = baseAmount !== undefined ? new Decimal(baseAmount) : new Decimal(0);
    const quote = quoteAmount !== undefined ? new Decimal(quoteAmount) : null;
    const p = price !== undefined ? new Decimal(price) : null;

    let user = await prisma.user.findUnique({ where: { address: traderAddress } });
    if (!user) {
      user = await prisma.user.create({ data: { address: traderAddress } });
    }

    const ts = new Date(timestamp);

    const trade = await prisma.trade.create({
      data: {
        tradeId,
        timestamp: ts,
        pair,
        baseAmount: base.toFixed(),
        quoteAmount: quote ? quote.toFixed() : '0',
        price: p ? p.toFixed() : undefined,
        trader: { connect: { id: user.id } },
        metadata: metadata ?? {}
      }
    });

    const tradeUsd = inferTradeUsdAmount(pair, quote ? quote.toFixed() : null, p ? p.toFixed() : null, base.toFixed());
    if (tradeUsd.gte(new Decimal(100))) {
      const priorTrades = await prisma.trade.count({
        where: { traderId: user.id, id: { lt: trade.id } }
      });
      if (priorTrades === 0) {
        const referral = await prisma.referral.findFirst({ where: { refereeId: user.id } });
        if (referral && !referral.firstTradeQualified) {
          await prisma.user.update({
            where: { id: referral.referrerId },
            data: { referralPoints: { increment: new Decimal(10).toFixed() } }
          });
          await prisma.referral.update({ where: { id: referral.id }, data: { firstTradeQualified: true } });
        }
      }
    }

    return res.status(201).json({ ok: true, tradeId: trade.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal' });
  }
}
