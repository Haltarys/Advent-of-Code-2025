import { createReadStream, type PathLike } from 'fs';
import { join } from 'path';
import readline from 'readline/promises';

/**
 * Solution to [Advent of Code 2025 Day 3 Part 1](https://adventofcode.com/2025/day/3)
 *
 * @param filePath path to the file containing the banks of batteries
 * @returns The maximum output joltage
 */
export async function solveDay3(filePath: PathLike): Promise<number> {
  const rl = readline.createInterface({ input: createReadStream(filePath) });

  let totalOutputJoltage = 0;

  for await (const line of rl) {
    const bank = line.split('').map(Number);
    console.log(bank);

    // Find the highest digit in the array, up to one step before the end of the array: since the joltage will be a
    // two digits number, even the lowest possible two-digits value (11) will be higher than the highest possible
    // single-digit value (9).
    let maximumJoltage = 0,
      maximumJoltageIndex = null;
    for (let i = 0; i < bank.length - 1; i++) {
      const joltageLevel = bank[i];

      if (joltageLevel > maximumJoltage) {
        maximumJoltage = joltageLevel;
        maximumJoltageIndex = i;
      }
    }

    console.log({ maximumJoltage, maximumJoltageIndex });

    // Once the highest digit has been found, search for the highest digit to its right
    // (Technically, we don't need the index here, but I kept it for debugging purposes)
    let maximumJoltage2 = 0,
      maximumJoltage2Index = null;
    for (let i = maximumJoltageIndex! + 1; i < bank.length; i++) {
      const joltageLevel = bank[i];

      if (joltageLevel > maximumJoltage2) {
        maximumJoltage2 = joltageLevel;
        maximumJoltage2Index = i;
      }
    }

    console.log({ maximumJoltage2, maximumJoltage2Index });

    // Multiply by 10 the highest digit because it represent the dozens in the bank's joltage value
    totalOutputJoltage += maximumJoltage * 10 + maximumJoltage2;
  }

  console.log(`Total output joltage: ${totalOutputJoltage}`);

  return totalOutputJoltage;
}

function main() {
  const filePath = join(process.cwd(), 'assets/day3/input.txt');

  solveDay3(filePath);
}

main();

export default solveDay3;
