import { createReadStream, type PathLike } from 'fs';
import { join } from 'path';
import readline from 'readline/promises';

type Shape = boolean[][];
type Grid = {
  width: number;
  height: number;
  widestRowWidth: number;
  highestColumnHeight: number;
  cells: boolean[][];
};
type Present = { width: number; height: number; coveredArea: number; shapeVariations: Shape[] };
type TreeRegion = { width: number; height: number; presentsToFit: number[] };

function buildEmptyRegionGrid(rows: number, columns: number): Grid {
  return {
    width: columns,
    height: rows,
    widestRowWidth: 0,
    highestColumnHeight: 0,
    cells: Array.from({ length: rows }, () => new Array(columns).fill(false)),
  };
}

function placeShapeOnGridAtCoordinates(grid: Grid, shape: Shape, row: number, col: number): Grid {
  const newGrid: Grid = {
    width: grid.width,
    height: grid.height,
    widestRowWidth: Math.max(grid.widestRowWidth, col + shape[0].length),
    highestColumnHeight: Math.max(grid.highestColumnHeight, row + shape.length),
    cells: Array.from(grid.cells, (gridRow) => [...gridRow]),
  };

  for (let i = 0; i < shape.length; i++) {
    for (let j = 0; j < shape[i].length; j++) newGrid.cells[row + i][col + j] ||= shape[i][j];
  }

  return newGrid;
}

function canShapeFitOnGridAtCoordinates(
  grid: Grid,
  shape: Shape,
  row: number,
  col: number,
): boolean {
  if (row + shape.length > grid.height || col + shape[0].length > grid.width) return false;

  for (let i = 0; i < shape.length; i++) {
    for (let j = 0; j < shape[i].length; j++) {
      if (grid.cells[row + i][col + j] && shape[i][j]) return false;
    }
  }

  return true;
}

function* generateAllValidWaysToFitPresentInGridAtCoordinates(
  grid: Grid,
  present: Present,
  row: number,
  col: number,
): Generator<Grid> {
  for (const shape of present.shapeVariations) {
    if (canShapeFitOnGridAtCoordinates(grid, shape, row, col))
      yield placeShapeOnGridAtCoordinates(grid, shape, row, col);
  }
}

function* generateAllValidWaysToFitPresentInGridForCoordinateRanges(
  grid: Grid,
  present: Present,
  rowStart: number,
  rowEnd: number,
  colStart: number,
  colEnd: number,
): Generator<Grid> {
  for (let row = rowStart; row < rowEnd; row++) {
    for (let col = colStart; col < colEnd; col++)
      yield* generateAllValidWaysToFitPresentInGridAtCoordinates(grid, present, row, col);
  }
}

/**
 * Generates all the valid ways to fit the given present in the given grid, considering rotations and flips.
 * Prioritises fitting the present near the top left corner, in the already partially filled area delimited by
 * `grid.widestRowWidth` and`grid.highestColumnHeight`.
 *
 * @example
 *
 * Given the following grid, generates all the valid ways to fit the present in areas 1, 2, and 3 in this order.
 *
 * +-----+-------+
 * |###  |       |
 * |# 1 #|   2   |
 * |  ###|       |
 * +-----+-------+
 * |             |
 * |      3      |
 * |             |
 * +-------------+
 *
 * @param grid
 * @param present
 */
function* generateAllValidWaysToFitOnePresentInGrid(grid: Grid, present: Present): Generator<Grid> {
  // 1. Generate all the valid ways to fit the given present in the currently partially filled area of the grid first
  // to waste as little space as possible.
  yield* Array.from(
    generateAllValidWaysToFitPresentInGridForCoordinateRanges(
      grid,
      present,
      0,
      grid.highestColumnHeight,
      0,
      grid.widestRowWidth,
    ),
  ).sort((a, b) =>
    a.widestRowWidth < b.widestRowWidth && a.highestColumnHeight < b.highestColumnHeight ? -1 : 1,
  );

  // 2. Generate all the valid ways to fit the given present to the right of the partially filled region
  yield* generateAllValidWaysToFitPresentInGridForCoordinateRanges(
    grid,
    present,
    0,
    grid.highestColumnHeight,
    grid.widestRowWidth,
    grid.width - present.width + 1,
  );

  // 3. Generate all the valid ways to fit the given present below the partially filled region.
  yield* generateAllValidWaysToFitPresentInGridForCoordinateRanges(
    grid,
    present,
    grid.highestColumnHeight,
    grid.height + present.height + 1,
    0,
    grid.width - present.width + 1,
  );
}

function* generateAllValidWaysToFitPresentsInGrid(
  grid: Grid,
  presents: Present[],
  presentsToFit: number[],
): Generator<Grid> {
  const nextPresentToFitIndex = presentsToFit.findIndex((presentCount) => presentCount > 0);

  // Base case: no more presents to fit, return the current grid
  if (nextPresentToFitIndex === -1) {
    yield grid;
  } else {
    // Make a copy of the array and decrease the count of the remaining presents to fit
    const remainingPresentsToFit = [...presentsToFit];
    remainingPresentsToFit[nextPresentToFitIndex]--;

    // Recursive case: compute all valid ways to fit the next present
    const validPresentFits = generateAllValidWaysToFitOnePresentInGrid(
      grid,
      presents[nextPresentToFitIndex],
    );

    // For each valid way to fit the present, recursively try to fit the remaining presents
    for (const newGrid of validPresentFits)
      yield* generateAllValidWaysToFitPresentsInGrid(newGrid, presents, remainingPresentsToFit);
  }
}

function canPresentsFitInRegion(region: TreeRegion, presents: Present[]): boolean {
  console.log(`Tree region (${region.width}x${region.height}):`);
  console.log('Presents to fit:', region.presentsToFit);
  console.log();

  // Calculate the actual number of cells all the presents would cover
  const totalCoveredArea = region.presentsToFit
    .map((presentCount, i) => presents[i].coveredArea * presentCount)
    .reduce((a, b) => a + b, 0);
  const regionArea = region.width * region.height;

  // If the actual area covered by all the presents is greater than the tree region area
  if (totalCoveredArea > regionArea) return false;

  // Treating presents as rectangular areas, ignoring their actual shapes,
  // find the largest theoretical present's dimensions
  let largestPresentWidth = 0,
    largestPresentHeight = 0;
  for (const present of presents) {
    if (present.width > largestPresentWidth) largestPresentWidth = present.width;
    if (present.height > largestPresentHeight) largestPresentHeight = present.height;
  }

  const presentCount = region.presentsToFit.reduce((a, b) => a + b, 0);
  /**
   * Given the largest theoretical present's dimensions, calculate maximum number of presents that could fit when
   * arranged in a grid. For example:
   *
   * Largest theoretical present dimensions: 3x1
   *
   * Grid:
   *
   * +---+---+---+-+
   * | p | p | p |x|
   * +---+---+---+-+
   * | p | p | p |x|
   * +---+---+---+-+
   * | p | p | p |x|
   * +---+---+---+-+
   *
   * Estimated maximum present count: (region width / largest present width) * (region height / largest present height)
   *                                = (10 / 3) * (3 / 1) # integer division
   *                                = 3 * 3
   *                                = 9
   */
  const estimatedMaximumPresentCount =
    Math.floor(region.width / largestPresentWidth) *
    Math.floor(region.height / largestPresentHeight);

  if (presentCount <= estimatedMaximumPresentCount) return true;

  // Build an empty grid to the tree region's dimensions to fit all the presents as a starting point
  const emptyGrid = buildEmptyRegionGrid(region.height, region.width);

  console.log(`Starting empty grid (${emptyGrid.width}x${emptyGrid.height}):`);
  console.log(serialiseGrid(emptyGrid.cells));
  console.log();

  const validPresentFits = generateAllValidWaysToFitPresentsInGrid(
    emptyGrid,
    presents,
    region.presentsToFit,
  );

  // Retrieve the first element from the valid solutions
  const { value: newGrid, done }: { value: Grid; done?: boolean } = validPresentFits.next();

  // If `done` is true, we have already reached the end, and there are no solution for the given region for the given
  // presents.
  const canAllPresentsFit = !done;

  console.log('Can all presents fit:', canAllPresentsFit);
  if (canAllPresentsFit) {
    console.log('Final grid:');
    console.log(serialiseGrid(newGrid.cells));
  }
  console.log();

  return canAllPresentsFit;
}

function serialiseGrid(shape: Shape): string {
  return shape.map((row) => row.map((cell) => (cell ? '#' : '.')).join('')).join('\n');
}

function rotateShape90DegreesClockwise(originalShape: Shape): Shape {
  const rotatedShape = [];

  for (let col = 0; col < originalShape[0].length; col++) {
    const row = [];
    for (let rowIndex = originalShape.length - 1; rowIndex >= 0; rowIndex--)
      row.push(originalShape[rowIndex][col]);
    rotatedShape.push(row);
  }

  return rotatedShape;
}

/**
 * Compares two shapes to determine if they are identical. Rotations and flips are not considered.
 *
 * @param shape1 The first shape to compare
 * @param shape2 The second shape to compare
 * @returns `true` if the two shapes are identical, `false` otherwise
 */
function areShapesIdentical(shape1: Shape, shape2: Shape): boolean {
  if (shape1.length !== shape2.length) return false;

  for (let i = 0; i < shape1.length; i++) {
    if (shape1[i].join('') !== shape2[i].join('')) return false;
  }

  return true;
}

function flipShapeVertically(originalShape: Shape): Shape {
  return Array.from(originalShape, (_, i) => [...originalShape[originalShape.length - 1 - i]]);
}

function computeShapeVariations(originalShape: Shape): Shape[] {
  const shapes: Shape[] = [];

  const shapesToRotate = [originalShape];

  const verticallyFlippedShape = flipShapeVertically(originalShape);
  if (!areShapesIdentical(originalShape, verticallyFlippedShape))
    shapesToRotate.push(verticallyFlippedShape);

  for (const shape of shapesToRotate) {
    if (shapes.every((existingShape) => !areShapesIdentical(existingShape, shape)))
      shapes.push(shape);

    let rotatedShape = shape;
    for (let i = 0; i < 3; i++) {
      rotatedShape = rotateShape90DegreesClockwise(rotatedShape);

      if (shapes.every((existingShape) => !areShapesIdentical(existingShape, rotatedShape)))
        shapes.push(rotatedShape);
    }
  }

  return shapes;
}

async function parseInput(input: AsyncIterator<string, undefined>) {
  const presents: Present[] = [];
  const treeRegions: TreeRegion[] = [];

  // Read and parse each line
  for (
    let { value: line, done } = await input.next();
    !done && line !== undefined;
    { value: line, done } = await input.next()
  ) {
    const regexp = /^\d+:$/;

    // Present shape to parse
    if (regexp.test(line)) {
      const shape = [];

      for (
        let { value: line } = await input.next();
        line !== '' && line !== undefined;
        { value: line } = await input.next()
      )
        shape.push(line.split('').map((c) => c === '#'));

      presents.push({
        width: shape[0].length,
        height: shape.length,
        coveredArea: shape.flat().filter((cell) => cell).length,
        shapeVariations: computeShapeVariations(shape),
      });

      // Else, tree region to parse
    } else {
      const [dimensions, presentsToFit] = line.split(': ');
      const [width, height] = dimensions.split('x').map(Number);

      treeRegions.push({ width, height, presentsToFit: presentsToFit.split(' ').map(Number) });
    }
  }

  return { presents, treeRegions };
}

/**
 * Solution to [Advent of Code 2025 Day 12 Part 1](https://adventofcode.com/2025/day/12)
 *
 * @param filePath Path to the summary file containing a list of present shapes and tree regions to fill with their
 * given lists of presents
 * @returns Number of tree regions that can fit all their presents
 */
export async function solveDay12(filePath: PathLike): Promise<number> {
  const rl = readline.createInterface({ input: createReadStream(filePath) });

  const { presents, treeRegions } = await parseInput(rl[Symbol.asyncIterator]());

  // Print presents
  for (const present of presents) {
    console.log(
      `Present: covers ${present.coveredArea} cells on a ${present.width}x${present.height} grid.`,
    );
    console.log('Shape variations:');
    for (const shape of present.shapeVariations) {
      console.log(serialiseGrid(shape));
      console.log();
    }
  }

  // Print tree regions
  for (const region of treeRegions) {
    console.log(`Region: ${region.width}x${region.height} grid`);
    console.log('Presents to fit', region.presentsToFit);
    console.log();
  }

  // Find all regions that can fit all their presents
  const largeEnoughRegions = treeRegions.filter((region) =>
    canPresentsFitInRegion(region, presents),
  );

  console.log(
    'Total number of regions that can fit all their presents listed:',
    largeEnoughRegions.length,
  );

  return largeEnoughRegions.length;
}

function main() {
  const filePath = join(process.cwd(), 'assets/day12/input.txt');

  solveDay12(filePath);
}

main();
