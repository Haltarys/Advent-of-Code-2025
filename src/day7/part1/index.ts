import { createReadStream, type PathLike } from 'fs';
import { join } from 'path';
import readline from 'readline/promises';

/**
 * Solution to [Advent of Code 2025 Day 7 Part 1](https://adventofcode.com/2025/day/7)
 *
 * @param filePath path to the tachyon manifold diagram
 * @returns The number of times the beam was split
 */
export async function solveDay7(filePath: PathLike): Promise<number> {
  const rl = readline.createInterface({ input: createReadStream(filePath) });

  let previousRow = null;
  let splitCounter = 0;

  // Read the file line by line
  for await (const line of rl) {
    if (!previousRow) {
      previousRow = line;

      console.debug(previousRow);

      continue;
    }

    const row = line.split('');

    // Iterate through the row and compare each character with the one above it
    for (let i = 1; i < row.length - 1; i++) {
      const charAbove = previousRow[i];

      // If the current character is an empty space ('.'), propagate the beam downwards
      if (row[i] === '.' && (charAbove === '|' || charAbove === 'S')) row[i] = '|';
      // Else, if the current character is a splitter and is hit by a beam above it, split the beam left and right
      else if (row[i] === '^' && charAbove === '|') {
        splitCounter++;
        row[i - 1] = '|';
        row[i + 1] = '|';
      }
    }

    // `.join('')` isn't strictly necessary, as bracket notation works on both strings and arrays but it makes the
    // output cleaner
    previousRow = row.join('');

    console.debug(previousRow);
  }

  console.debug(`The beam has been split ${splitCounter} times.`);

  return splitCounter;
}

function main() {
  const filePath = join(process.cwd(), 'assets/day7/input.txt');

  solveDay7(filePath);
}

main();

export default solveDay7;
