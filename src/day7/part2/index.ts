import { createReadStream, type PathLike } from 'fs';
import { join } from 'path';
import readline from 'readline/promises';

function computeTimelinesCount(
  rows: string[],
  beamIndex: number,
  rowIndex = 0,
  // Map to memoise the result to improve performance
  memo = new Map<string, number>()
): number {
  // Base case: reached the bottom of the diagram
  if (rowIndex >= rows.length) return 1;

  // Create a unique key for this state
  const key = `${rowIndex}-${beamIndex}`;

  // Return cached result if available
  if (memo.has(key)) {
    return memo.get(key)!;
  }

  const row = rows[rowIndex];

  let res: number;
  // If we have reached a splitter, compute the number of paths to its left and to its right
  if (row[beamIndex] === '^') {
    const leftPathTimelineCount = computeTimelinesCount(rows, beamIndex - 1, rowIndex + 1, memo);
    const rightPathTimelineCount = computeTimelinesCount(rows, beamIndex + 1, rowIndex + 1, memo);

    res = leftPathTimelineCount + rightPathTimelineCount;
  } else {
    // Continue straight down
    res = computeTimelinesCount(rows, beamIndex, rowIndex + 1, memo);
  }

  // Store result in memo before returning
  memo.set(key, res);
  return res;
}

/**
 * Solution to [Advent of Code 2025 Day 7 Part 2](https://adventofcode.com/2025/day/7#part2)
 *
 * @param filePath path to the tachyon manifold diagram
 * @returns The number of different timelines a single tachyon will travel on
 */
export async function solveDay7Part2(filePath: PathLike): Promise<number> {
  const rl = readline.createInterface({ input: createReadStream(filePath) });
  const rows: string[] = [];

  // Store the map in an array
  for await (const line of rl) rows.push(line);

  // Find the starting position index of the tachyon beam
  const beamIndex = rows[0].indexOf('S')!;

  const timelineCount = computeTimelinesCount(rows, beamIndex);

  console.debug(`A single tachyon will travel on ${timelineCount} different timelines.`);

  return timelineCount;
}

function main() {
  const filePath = join(process.cwd(), 'assets/day7/input.txt');

  solveDay7Part2(filePath);
}

main();

export default solveDay7Part2;
