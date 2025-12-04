import { createReadStream, type PathLike } from 'fs';
import { join } from 'path';
import readline from 'readline/promises';

function findHighestBatteryJoltage(bank: number[], startIndex: number, maxRange: number) {
  // Find the highest digit in the array, up to one step before the end of the array: since the joltage will be a
  // two digits number, even the lowest possible two-digits value (11) will be higher than the highest possible
  // single-digit value (9).
  let maximumJoltage = 0,
    maximumJoltageIndex = null;
  for (let i = startIndex + 1; i < bank.length - maxRange; i++) {
    const joltageLevel = bank[i]!;

    if (joltageLevel > maximumJoltage) {
      maximumJoltage = joltageLevel;
      maximumJoltageIndex = i;
    }
  }

  console.debug({ depth: maxRange, maximumJoltage, maximumJoltageIndex });

  return { maximumJoltage, maximumJoltageIndex };
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

    let maximumJoltageIndex = -1;
    for (let depth = 0; depth < DEPTH; depth++) {
      const { maximumJoltage, maximumJoltageIndex: index } = findHighestBatteryJoltage(
        bank,
        maximumJoltageIndex,
        DEPTH - 1 - depth
      );

      totalOutputJoltage += maximumJoltage * Math.pow(10, DEPTH - 1 - depth);
      maximumJoltageIndex = index!;
    }
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
