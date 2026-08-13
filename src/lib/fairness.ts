/**
 * Jain's Fairness Index: (Σx)² / (n · Σx²), ranges from 1/n (one sender
 * hogs everything) to 1.0 (every sender has an identical window). This is
 * what turns "the lines look like they're converging" into a number you
 * can point at.
 */
export function jainsFairnessIndex(values: number[]): number {
  if (values.length === 0) return 1;
  const sum = values.reduce((total, value) => total + value, 0);
  const sumOfSquares = values.reduce((total, value) => total + value * value, 0);
  return (sum * sum) / (values.length * sumOfSquares);
}
