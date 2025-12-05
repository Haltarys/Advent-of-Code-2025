import { createReadStream, type PathLike } from 'fs';
import { join } from 'path';
import readline from 'readline/promises';

/**
 * Solution to [Advent of Code 2025 Day 5 Part 1](https://adventofcode.com/2025/day/5)
 *
 * @param filePath path to the file containing the fresh ingredient ranges and the list of ingredients to test
 * @returns The number of fresh ingredients IDs
 */
export async function day5(filePath: PathLike): Promise<number> {
  const rl = readline.createInterface({ input: createReadStream(filePath) });
  let freshIngredientIdsCount = 0;

  const freshIngredientIdRanges = [];

  // Read fresh ingredient id ranges until we hit an empty line
  for await (const line of rl) {
    if (line === '') break;
    const match = line.match(/(?<lower>\d+)-(?<higher>\d+)/);

    // TODO: One could merge and extend the ranges as they are added to avoid duplication and unnecessary checks
    // (Actually done in part 2)

    // Add each fresh ingredient range to a list
    freshIngredientIdRanges.push({
      lowerBound: parseInt(match!.groups!.lower),
      higherBound: parseInt(match!.groups!.higher),
    });
  }

  console.debug(freshIngredientIdRanges);

  // Read each ingredient id to check if it falls within some range of fresh ingredient IDs
  for await (const line of rl) {
    const ingredientId = parseInt(line);

    // If so, keep track of the total number of fresh ingredient IDs
    if (
      freshIngredientIdRanges.some(
        ({ lowerBound, higherBound }) => ingredientId >= lowerBound && ingredientId <= higherBound
      )
    )
      freshIngredientIdsCount++;

    console.debug(ingredientId);
  }

  console.debug(`Number of fresh ingredients: ${freshIngredientIdsCount}`);

  return freshIngredientIdsCount;
}

function main() {
  const filePath = join(process.cwd(), 'assets/day5/input.txt');

  day5(filePath);
}

main();

export default day5;
