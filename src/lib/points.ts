import Decimal from 'decimal.js';

export const DAILY_MIN_USD = new Decimal(50);

export function computeDailyPointsFromVolume(dailyVolumeUsd: Decimal.Value): number {
  const vol = new Decimal(dailyVolumeUsd);
  if (vol.lt(DAILY_MIN_USD)) return 0;

  const ratio = vol.div(DAILY_MIN_USD).toNumber();
  const log2 = Math.log2(ratio);
  const points = Math.floor(log2) + 1;
  return Math.max(0, points);
}

export function inferTradeUsdAmount(pair: string | undefined, quoteAmount?: Decimal.Value | null, price?: Decimal.Value | null, baseAmount?: Decimal.Value | null) {
  const usdTickers = ['USD', 'USDC', 'USDT', 'DAI', 'BUSD'];
  if (!pair) {
    if (quoteAmount !== undefined && quoteAmount !== null) return new Decimal(quoteAmount);
    if (price !== undefined && baseAmount !== undefined && price !== null && baseAmount !== null) {
      return new Decimal(price).mul(new Decimal(baseAmount));
    }
    return new Decimal(0);
  }

  const parts = pair.toUpperCase().split(/[\/\-_:]/);
  const quote = parts[1] ?? parts[0];

  if (usdTickers.includes(quote) && quoteAmount !== undefined && quoteAmount !== null) {
    return new Decimal(quoteAmount);
  }

  if (price !== undefined && price !== null && baseAmount !== undefined && baseAmount !== null) {
    return new Decimal(price).mul(new Decimal(baseAmount));
  }

  if (quoteAmount !== undefined && quoteAmount !== null) {
    return new Decimal(quoteAmount);
  }

  return new Decimal(0);
}

export function computeBoostedPoints(tradingPoints: number, stakingMultiplier: Decimal.Value) {
  const boosted = new Decimal(tradingPoints).mul(new Decimal(stakingMultiplier));
  return boosted.floor().toNumber();
}
