import { createReadStream, type PathLike } from 'fs';
import { join } from 'path';
import readline from 'readline/promises';

type OperatorType = '+' | '*';

/**
 * Solution to [Advent of Code 2025 Day 6 Part 1](https://adventofcode.com/2025/day/6)
 *
 * @param filePath path to the math worksheet file
 * @returns The total sum of the worksheet's math problems
 */
export async function solveDay6Part2(filePath: PathLike): Promise<number> {
  const rl = readline.createInterface({ input: createReadStream(filePath) });

  let transposedData: string[] = [];

  let operators: OperatorType[] = [];

  // Read the file line by line
  for await (const line of rl) {
    // If we have reach the last line, with the operators (either addition or multiplication), parse it
    if (line[0] === '+' || line[0] === '*') {
      operators = line.split(/\s+/g) as OperatorType[];
      break;
    }

    // Transpose the operand data
    if (transposedData.length === 0) {
      transposedData = line.split('');
    } else {
      for (let i = 0; i < line.length; i++) {
        transposedData[i] += line[i];
      }
    }
  }

  console.table(transposedData);

  let i = -1,
    total = 0;
  // For each operator, compute the sum/product of its column. Keep track of the grand total.
  for (const operator of operators) {
    if (operator === '+') {
      let sum = 0;

      // Accumulate numbers until we hit an empty line (which separates operations in the non transposed data).
      while (!/^ *$/g.test(transposedData[++i] ?? '')) sum += parseInt(transposedData[i]);

      total += sum;
    } else if (operator === '*') {
      let product = 1;

      // Accumulate numbers until we hit an empty line (an empty column in the non transposed data, which separates
      // operations).
      while (!/^ *$/g.test(transposedData[++i] ?? '')) product *= parseInt(transposedData[i]);

      total += product;
    }
  }

  console.log(`Total sum of the worksheet's math problems: ${total}`);

  return total;
}

function main() {
  const filePath = join(process.cwd(), 'assets/day6/input.txt');

  solveDay6Part2(filePath);
}

main();

export default solveDay6Part2;
