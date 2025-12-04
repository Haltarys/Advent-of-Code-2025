import { createReadStream, type PathLike } from 'fs';
import { join } from 'path';
import readline from 'readline/promises';

function findHighestBatteryJoltage(bank: number[], startIndex: number, maxRange: number): number {
  // Find the highest digit in the array, up to one step before the end of the array: since the joltage will be a
  // two digits number, even the lowest possible two-digits value (11) will be higher than the highest possible
  // single-digit value (9).
  let maximumJoltage = bank[startIndex] ?? 0,
    maximumJoltageIndex = startIndex;
  for (let i = startIndex + 1; i < bank.length - maxRange; i++) {
    const joltageLevel = bank[i]!;

    if (joltageLevel > maximumJoltage) {
      maximumJoltage = joltageLevel;
      maximumJoltageIndex = i;
    }
  }

  console.debug({ depth: maxRange, maximumJoltage, maximumJoltageIndex });

  if (maxRange > 0) {
    const res = findHighestBatteryJoltage(bank, maximumJoltageIndex! + 1, maxRange - 1);

    return maximumJoltage * Math.pow(10, maxRange) + res;
  } else {
    return maximumJoltage;
  }
}

/**
 * Solution to [Advent of Code 2025 Day 3 Part 2](https://adventofcode.com/2025/day/3#part2)
 *
 * @param filePath path to the file containing the dial rotations
 * @returns The maximum output joltage
 */
export async function day3(filePath: PathLike): Promise<number> {
  const rl = readline.createInterface({ input: createReadStream(filePath) });

  const DEPTH = 12;
  let totalOutputJoltage = 0;

  for await (const line of rl) {
    const bank = line.split('').map(Number);
    console.debug(bank);

    totalOutputJoltage += findHighestBatteryJoltage(bank, -1, DEPTH - 1);
  }

  console.debug(`Total output joltage: ${totalOutputJoltage}`);

  return totalOutputJoltage;
}

function main() {
  const filePath = join(process.cwd(), 'assets/day3/input.txt');

  day3(filePath);
}

main();

export default day3;
