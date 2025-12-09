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
 * Solution to [Advent of Code 2025 Day 4 Part 2](https://adventofcode.com/2025/day/4#part2)
 *
 * @param filePath path to the file containing the map of paper rolls
 * @returns The total number of removed paper rolls
 */
export async function solveDay4Part2(filePath: PathLike): Promise<number> {
  const data = await readFile(filePath, 'utf-8');
  const grid = data.split('\n').map((line) => line.split('')) as Grid;
  const ADJACENT_PAPER_ROLLS_LIMIT = 4;
  let removedPaperRollsCount = 0;

  console.debug(data);

  let canRemovePaperRolls = true;
  while (canRemovePaperRolls) {
    // Assume that we can no longer remove paper rolls. If this variable is never updated after going through the grid
    // below, we can be sure no more paper rolls can be removed.
    canRemovePaperRolls = false;

    // Go through each cell
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const cell = getGridCellContent(grid, y, x);

        // If it's a paper roll, count the number of adjacent paper rolls.
        if (cell === PAPER_ROLL) {
          const count = countAdjacentPaperRolls(grid, y, x);

          console.debug(`Grid[${y}][${x}] = ${cell}, has ${count} adjacent paper rolls.`);

          // If it is accessible, remove it, keep track of the total number of removed paper rolls, and confirm that
          // we have remove at least one paper roll for this iteration of the while loop
          if (count < ADJACENT_PAPER_ROLLS_LIMIT) {
            grid[y][x] = EMPTY_SPACE;
            removedPaperRollsCount++;
            canRemovePaperRolls = true;
          }
        }
      }
    }
  }

  console.debug(`Total number of paper rolls removed: ${removedPaperRollsCount}`);
  return removedPaperRollsCount;
}

function main() {
  const filePath = join(process.cwd(), 'assets/day4/input.txt');

  solveDay4Part2(filePath);
}

main();

export default solveDay4Part2;
