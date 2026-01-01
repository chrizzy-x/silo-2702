import { computeDailyPointsFromVolume } from '../src/lib/points';
import Decimal from 'decimal.js';

test('daily points base thresholds', () => {
  expect(computeDailyPointsFromVolume(new Decimal(49))).toBe(0);
  expect(computeDailyPointsFromVolume(new Decimal(50))).toBe(1);
  expect(computeDailyPointsFromVolume(new Decimal(100))).toBe(2);
  expect(computeDailyPointsFromVolume(new Decimal(200))).toBe(3);
  expect(computeDailyPointsFromVolume(new Decimal(800))).toBe(5);
  expect(computeDailyPointsFromVolume(new Decimal(200000))).toBeGreaterThanOrEqual(12);
});
