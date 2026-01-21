import { type PathLike } from 'fs';
import { readFile } from 'fs/promises';
import { join } from 'path';

const EMPTY_SPACE = '.';
const PAPER_ROLL = '@';

type Cell = typeof EMPTY_SPACE | typeof PAPER_ROLL;
type Grid = Cell[][];

/**
 * Retrieves the content of a cell in a grid, given its coordinates.
 * Returns an empty space ('.') if attempting to access a cell out of bounds.
 *
 * @param grid A grid of characters representing either an empty space ('.') or a paper roll ('@')
 * @param row The row index of the cell to check
 * @param col The column index of the cell to check
 * @returns The content of the cell (either '.' or '@')
 */
function getGridCellContent(grid: Grid, row: number, col: number): Cell {
  // If attempting to access a cell out of bounds, assume it is an empty space
  if (row < 0 || col < 0 || row >= grid.length || col >= grid[row].length) return EMPTY_SPACE;

  return grid[row][col];
}

function countAdjacentPaperRolls(grid: Grid, row: number, col: number): number {
  let count = 0;

  if (getGridCellContent(grid, row - 1, col - 1) === PAPER_ROLL) count++; // Top left
  if (getGridCellContent(grid, row - 1, col) === PAPER_ROLL) count++; // Top middle
  if (getGridCellContent(grid, row - 1, col + 1) === PAPER_ROLL) count++; // Top right
  if (getGridCellContent(grid, row, col - 1) === PAPER_ROLL) count++; // Left
  if (getGridCellContent(grid, row, col + 1) === PAPER_ROLL) count++; // Right
  if (getGridCellContent(grid, row + 1, col - 1) === PAPER_ROLL) count++; // Bottom left
  if (getGridCellContent(grid, row + 1, col) === PAPER_ROLL) count++; // Bottom middle
  if (getGridCellContent(grid, row + 1, col + 1) === PAPER_ROLL) count++; // Bottom right

  return count;
}

/**
 * Solution to [Advent of Code 2025 Day 4 Part 1](https://adventofcode.com/2025/day/4)
 *
 * @param filePath path to the file containing the map of paper rolls
 * @returns The number of accessible paper rolls
 */
export async function solveDay4(filePath: PathLike): Promise<number> {
  const data = await readFile(filePath, 'utf-8');
  const grid = data.split('\n').map((line) => line.split('')) as Grid;
  const ADJACENT_PAPER_ROLLS_LIMIT = 4;
  let accessiblePaperRollsCount = 0;

  console.log(data);

  // Go through each cell
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const cell = getGridCellContent(grid, y, x);

      // If it's a paper roll, count the number of adjacent paper rolls.
      if (cell === PAPER_ROLL) {
        const count = countAdjacentPaperRolls(grid, y, x);

        console.log(`Grid[${y}][${x}] = ${cell}, has ${count} adjacent paper rolls.`);

        // Keep track of the total number of paper rolls that are accessible (less than `ADJACENT_PAPER_ROLLS_LIMIT`
        // adjacent paper rolls).
        if (count < ADJACENT_PAPER_ROLLS_LIMIT) accessiblePaperRollsCount++;
      }
    }
  }

  console.log(`Total number of paper rolls accessible: ${accessiblePaperRollsCount}`);
  return accessiblePaperRollsCount;
}

function main() {
  const filePath = join(process.cwd(), 'assets/day4/input.txt');

  solveDay4(filePath);
}

main();

export default solveDay4;
