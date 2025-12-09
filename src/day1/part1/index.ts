import { createReadStream, type PathLike } from 'fs';
import { join } from 'path';
import readline from 'readline/promises';

/**
 * Solution to [Advent of Code 2025 Day 1 Part 1](https://adventofcode.com/2025/day/1)
 *
 * @param filePath path to the file containing the dial rotations
 * @returns The number of times the dial lands on 0
 */
export async function solveDay1(filePath: PathLike): Promise<number> {
  const rl = readline.createInterface({ input: createReadStream(filePath) });

  const MAX_DIAL_AMOUNT = 100;
  let dial = 50;
  let zeroesCount = 0;

  for await (const line of rl) {
    const match = line.match(/(?<direction>L|R)(?<amount>\d+)/);

    const rotation = {
      direction: match!.groups!.direction,
      amount: parseInt(match!.groups!.amount),
    };

    if (rotation.direction === 'R') {
      // If the dial amount exceeds the maximum value (meaning it completes a rotation),
      // shave off a full turn's amount
      dial = (dial + rotation.amount) % MAX_DIAL_AMOUNT;
    } else if (rotation.direction === 'L') {
      // Adding the `MAX_DIAL_AMOUNT` until the dial value is no longer negative to
      // ensure it is always within bounds
      dial = dial - rotation.amount;
      while (dial < 0) dial += MAX_DIAL_AMOUNT;
    }

    console.debug(`Rotation: ${rotation.direction}${rotation.amount}, dial: ${dial}`);

    if (dial === 0) zeroesCount++;
  }

  console.debug(`The dial landed on 0 ${zeroesCount} times.`);

  return zeroesCount;
}

function main() {
  const filePath = join(process.cwd(), 'assets/day1/input.txt');

  solveDay1(filePath);
}

main();

export default solveDay1;
