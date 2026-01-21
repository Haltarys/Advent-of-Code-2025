import { createReadStream, type PathLike } from 'fs';
import { join } from 'path';
import readline from 'readline/promises';

type Tile = {
  x: number;
  y: number;
};

/**
 * Calculate the cross product of two vectors, represented by three points.
 *
 * @param origin The origin point for the two vectors
 * @param v The first vector
 * @param w The second vector
 * @returns The cross product of the two vectors
 */
function calculateCrossProduct(origin: Tile, v: Tile, w: Tile): number {
  return (v.x - origin.x) * (w.y - origin.y) - (v.y - origin.y) * (w.x - origin.x);
}

/**
 * Computes the convex hull of a given set of points (tile coordinates.)
 *
 * Modifies the list in place.
 *
 * Thanks to [this tutorial](https://youtu.be/B2AJoQSZf4M) and its associated [source code][1].
 *
 * [1]: https://bitbucket.org/StableSort/play/src/master/src/com/stablesort/convexhull/ConvexHullGrahamScan.java
 *
 * @param tiles A list of tile coordinates
 * @returns An array of tile coordinates representing the convex hull of those tiles
 */
function computeConvexHull(tiles: Tile[]): Tile[] {
  // Create a shallow copy to avoid modifying the array
  tiles = [...tiles];

  // Find the closest to the top, leftmost tile
  let start = tiles[0],
    lowestIndex = 0;
  for (let i = 1; i < tiles.length; i++) {
    const tile = tiles[i];
    if (tile.y < start.y || (tile.y === start.y && tile.x < start.x)) {
      start = tile;
      lowestIndex = i;
    }
  }

  // Remove it from the list
  tiles.splice(lowestIndex, 1);

  // Sort the list of tiles by polar coordinates (most acute angle first)
  tiles.sort((a, b) => {
    const crossProduct = calculateCrossProduct(start, a, b);

    // If the cross product is negative, this indicates a right turn (clockwise) from vector a to vector b.
    // Therefore, we return 1 to indicate that b comes before a.
    if (crossProduct < 0) {
      return 1;
      // If the cross product is positive, this indicates a left turn : a comes before b.
    } else if (crossProduct > 0) {
      return -1;
      // Else, if the cross product is exactly 0, the two points are colinear (meaning parallel.)
    } else {
      // If the two points have the same abscissa (they are on the same vertical line),
      if (a.x === b.x) {
        // the point which is closest to the origin comes first
        return a.y - b.y;
      } else {
        // If the slope is positive, then a.x - b.x will prioritise the point closest to the origin
        // If the slope is negative, then a.x - b.x will prioritise the point furthest from the origin
        // The case of the slope being vertical has already been handled above.
        return a.x - b.x;
      }
    }
  });

  // Hull starts with the starting point
  const hull = [start];

  for (const currentTile of tiles) {
    // We need at least 3 points (the current tile plus the last two added to the hull) to adjust the shape of the hull
    while (hull.length >= 2) {
      const lastTileAdded = hull.at(-1)!,
        secondToLastTileAdded = hull.at(-2)!;

      // Calculate the cross product between the vectors of the last tile added and the current tile
      const crossProduct = calculateCrossProduct(secondToLastTileAdded, lastTileAdded, currentTile);

      // If the cross product is positive, we are making a left (counter clockwise) turn, therefore we need do nothing.
      // The current tile can be added to the hull as is.
      if (crossProduct > 0) break;

      // Else the cross product is either negative: we are making a right (clockwise) turn,
      // or it equals zero, meaning we are going straight (the three points are colinear).
      // If it is zero, because the points have been sorted, we know that the current tile is further away from the
      // origin than the last tile added to the hull, therefore the last tile added to the hull should be removed.

      // We are making a right (clockwise) turn or going straight : we need to remove the last tile added to the
      // hull. The loop will then re-evaluate with the new last tile added to the hull.
      // We keep repeating this until we are making a left turn again : this ensures the convexity of the hull.
      // With each iteration of the while loop, the current tile proves to be a better fit for the hull so we remove
      // the previously added tile that were deemed fit at the time they were evaluated.
      hull.splice(-1, 1);
    }

    // Add the current tile to the hull
    hull.push(currentTile);
  }

  return hull;
}

/**
 * Given two tiles representing the opposite corners of a rectangle,
 * calculates the area of the rectangle.
 *
 * @param a Coordinates of the first tile
 * @param b Coordinates of the second tile
 * @returns The area of the rectangle delimited by the tiles
 */
function calculateRectangleArea(a: Tile, b: Tile): number {
  // Area = |x2 - x1| × |y2 - y1|
  // (Note: adding 1 to each dimension to account for inclusive counting of tiles)
  return (Math.abs(b.x - a.x) + 1) * (Math.abs(b.y - a.y) + 1);
}

/**
 * Using brute force, computes the the area of the largest rectangle whose opposite corners are two of the tiles in the
 * given list.
 *
 * @param tiles Array of tile coordinates
 * @returns The area of the largest rectangle whose opposite corners are two of the tiles in the list
 */
function computeLargestArea(tiles: Tile[]) {
  let maxArea = 0;

  for (let i = 0; i < tiles.length; i++) {
    for (let j = i + 1; j < tiles.length; j++) {
      const area = calculateRectangleArea(tiles[i], tiles[j]);
      if (area > maxArea) {
        maxArea = area;
      }
    }
  }

  return maxArea;
}

/**
 * Solution to [Advent of Code 2025 Day 9 Part 1](https://adventofcode.com/2025/day/9)
 *
 * @param filePath path to the list of red tile coordinates
 * @returns The product of the sizes of the three largest circuits
 */
export async function solveDay9(filePath: PathLike): Promise<number> {
  const rl = readline.createInterface({ input: createReadStream(filePath) });

  const tiles: Tile[] = [];

  // Read and parse the coordinates of the tiles one by one
  for await (const line of rl) {
    const [x, y] = line.split(',').map(Number);

    tiles.push({ x, y });
  }

  console.log('Tiles:');
  console.table(tiles);

  // Compute the convex hull of the red tiles: we know that the tiles forming the rectangle with the largest area
  // must be part of the convex hull.
  const convexHull = computeConvexHull(tiles);

  console.log('Convex hull:');
  console.table(convexHull);

  const area = computeLargestArea(convexHull);

  console.log(`Largest rectangular area that can be delimited by red tiles: ${area}`);

  return area;
}

function main() {
  const filePath = join(process.cwd(), 'assets/day9/input.txt');

  solveDay9(filePath);
}

main();
