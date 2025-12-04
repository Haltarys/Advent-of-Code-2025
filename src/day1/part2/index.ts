import { createReadStream, type ReadStream } from 'fs';
import { join } from 'path';
import readline from 'readline/promises';

/**
 * Solution to [Advent of Code 2025 Day 1 Part 2](https://adventofcode.com/2025/day/1#part2)
 *
 * @param filePath path to the file containing the dial rotations
 * @returns The number of times the dial lands on or passes through 0
 */
export async function day1(stream: ReadStream): Promise<number> {
  const rl = readline.createInterface({ input: stream });

  const MAX_DIAL_AMOUNT = 100;
  let dial = 50;
  let zeroesCount = 0;

  for await (const line of rl) {
    const match = line.match(/(?<direction>L|R)(?<amount>\d+)/);

    const rotation = {
      direction: match!.groups!.direction!,
      amount: parseInt(match!.groups!.amount!),
    };

    if (rotation.direction === 'R') {
      // Count the number of times the dial has passed through 0, add it to the counter and shave off the excess
      dial = dial + rotation.amount;
      zeroesCount += Math.floor(dial / MAX_DIAL_AMOUNT);
      dial %= MAX_DIAL_AMOUNT;
    } else if (rotation.direction === 'L') {
      // Adding the `MAX_DIAL_AMOUNT` until the dial value is no longer negative to
      // ensure it is always within bounds
      dial = dial - rotation.amount;

      if (dial === 0) zeroesCount++;
      while (dial < 0) {
        zeroesCount++;
        dial += MAX_DIAL_AMOUNT;
      }
    }

    console.debug(`Rotation: ${rotation.direction}${rotation.amount}, dial: ${dial}`);
  }

  console.debug(`The dial landed on or passed through 0 ${zeroesCount} times.`);

  return zeroesCount;
}

function main() {
  const filePath = join(process.cwd(), 'assets/day1/input.txt');
  const stream = createReadStream(filePath);
  day1(stream);
}

main();

export default day1;
