import { createReadStream, type PathLike } from 'fs';
import { join } from 'path';
import readline from 'readline/promises';

function findHighestBatteryJoltage(
  bank: number[],
  startIndex: number,
  maxRange: number,
  accumulatedJoltage = 0
): number {
  if (maxRange < 0) return accumulatedJoltage;

  let maximumJoltage = 0,
    maximumJoltageIndex = null;
  // Find the highest digit in the bank, as far as the `maxRange` value allows.
  for (let i = startIndex; i < bank.length - maxRange; i++) {
    const joltageLevel = bank[i];

    if (joltageLevel > maximumJoltage) {
      maximumJoltage = joltageLevel;
      maximumJoltageIndex = i;
    }
  }

  console.debug({ depth: maxRange, maximumJoltage, maximumJoltageIndex });

  // Return the sum of the maximum joltage found and the joltage accumulated so far, and search for the next highest
  // digit to the right of the one that has been found.
  return findHighestBatteryJoltage(
    bank,
    maximumJoltageIndex! + 1,
    maxRange - 1,
    accumulatedJoltage + maximumJoltage * Math.pow(10, maxRange)
  );
}

/**
 * Solution to [Advent of Code 2025 Day 3 Part 2](https://adventofcode.com/2025/day/3#part2)
 *
 * @param filePath path to the file containing the banks of batteries
 * @returns The maximum output joltage
 */
export async function solveDay3Part2(filePath: PathLike): Promise<number> {
  const rl = readline.createInterface({ input: createReadStream(filePath) });

  const DEPTH = 12;
  let totalOutputJoltage = 0;

  for await (const line of rl) {
    const bank = line.split('').map(Number);

    console.debug(bank);

    totalOutputJoltage += findHighestBatteryJoltage(bank, 0, DEPTH - 1);
  }

  console.debug(`Total output joltage: ${totalOutputJoltage}`);

  return totalOutputJoltage;
}

function main() {
  const filePath = join(process.cwd(), 'assets/day3/input.txt');

  solveDay3Part2(filePath);
}

main();

export default solveDay3Part2;
