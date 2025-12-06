import { createReadStream, type PathLike } from 'fs';
import { join } from 'path';
import readline from 'readline/promises';

/**
 * Solution to [Advent of Code 2025 Day 6 Part 1](https://adventofcode.com/2025/day/6)
 *
 * @param filePath path to the math worksheet file
 * @returns The total sum of the worksheet's math problems
 */
export async function day6(filePath: PathLike): Promise<number> {
  const rl = readline.createInterface({ input: createReadStream(filePath) });

  let operands: number[][] = [];

  // Read the file line by line
  for await (const line of rl) {
    // Parse the line's elements
    const data = line.split(/\s+/g);

    // If we have reach the last line, with the operators (either addition or multiplication)
    if (data[0] === '+' || data[0] === '*') {
      let total = 0;

      console.table(operands);

      // Iterate through each operator and compute the sum/product of its column. Keep track of the grand total.
      for (let i = 0; i < operands.length; i++) {
        const operator = data[i];

        if (operator === '+') total += operands[i].reduce((acc, n) => acc + n, 0);
        if (operator === '*') total += operands[i].reduce((acc, n) => acc * n, 1);
      }

      console.debug(`Total sum of the worksheet's math problems: ${total}`);

      return total;
    }

    // Emulate a `.zip` on the array of operands. (Perform a matrix transpose.)
    if (operands.length === 0) {
      operands = data.map((n) => [parseInt(n)]);
    } else {
      // Stack the operands of a column into an array
      for (let i = 0; i < data.length; i++) operands[i].push(parseInt(data[i]));
    }
  }

  return 0;
}

function main() {
  const filePath = join(process.cwd(), 'assets/day6/input.txt');

  day6(filePath);
}

main();

export default day6;
