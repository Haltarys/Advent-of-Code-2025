import { createReadStream, type PathLike } from 'fs';
import { join } from 'path';
import readline from 'readline/promises';

/**
 * Solution to [Advent of Code 2025 Day 5 Part 2](https://adventofcode.com/2025/day/5#part2)
 *
 * @param filePath path to the file containing the fresh ingredient ranges and the list of ingredients to test
 * @returns The total number of ingredients IDs theoretically considered fresh
 */
export async function solveDay5Part2(filePath: PathLike): Promise<number> {
  const rl = readline.createInterface({ input: createReadStream(filePath) });

  // Read fresh ingredient id ranges until we hit an empty line
  const data = [];
  for await (const line of rl) {
    if (line === '') break;

    data.push(line);
  }

  const ranges = data
    .map((line) => {
      const [lower, higher] = line.split('-');

      return {
        lowerBound: parseInt(lower),
        higherBound: parseInt(higher),
      };
    })
    .sort((a, b) => a.lowerBound - b.lowerBound);

  // Merge overlapping ranges
  for (let i = 1; i < ranges.length; i++) {
    const range = ranges[i],
      previousRange = ranges[i - 1];

    // If the current range has no overlap with the previous one, skip it
    if (range.lowerBound > previousRange.higherBound) continue;

    // There must be an overlap, merge the ranges by selecting the lowest of their lower bounds and the highest of
    // their higher bounds
    previousRange.lowerBound = Math.min(previousRange.lowerBound, range.lowerBound);
    previousRange.higherBound = Math.max(previousRange.higherBound, range.higherBound);

    // Delete the current range as it has been merged into the previous
    // (Decrease the index as well, as the current element has just been removed)
    ranges.splice(i--, 1);
  }

  // Calculate the total number of fresh ingredient IDs by summing the sizes of each range
  let totalFreshIngredientIds = ranges.reduce(
    (acc, range) => acc + (range.higherBound - range.lowerBound + 1),
    0
  );

  console.log(ranges);

  console.log(`Number of fresh ingredients: ${totalFreshIngredientIds}`);

  return totalFreshIngredientIds;
}

function main() {
  const filePath = join(process.cwd(), 'assets/day5/input.txt');

  solveDay5Part2(filePath);
}

main();

export default solveDay5Part2;
