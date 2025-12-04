import { type PathLike } from 'fs';
import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * Solution to [Advent of Code 2025 Day 2 Part 1](https://adventofcode.com/2025/day/2)
 *
 * @param filePath path to the file containing the product ID ranges to check
 * @returns The sum of all invalid product IDs in the given ranges
 */
export async function day2(filePath: PathLike): Promise<number> {
  const data = await readFile(filePath, 'utf-8');
  const ranges = data.split(',').map((range) => {
    const [lower, higher] = range.split('-');

    return {
      lowerBound: parseInt(lower!),
      higherBound: parseInt(higher!),
    };
  });
  let sum = 0;

  ranges.forEach(({ lowerBound, higherBound }) => {
    for (let i = lowerBound; i <= higherBound; i++) {
      const regexp = /^(\d+)\1$/g;
      const repeatedSequenceDetected = regexp.test(String(i));

      if (repeatedSequenceDetected) {
        console.debug(`Invalid product ID: ${i}`);
        sum += i;
      }
    }
  });

  console.debug(`Sum of invalid product IDs: ${sum}`);

  return sum;
}

function main() {
  const filePath = join(process.cwd(), 'assets/day2/input.txt');

  day2(filePath);
}

main();

export default day2;
