import { createReadStream, type PathLike } from 'fs';
import { join } from 'path';
import readline from 'readline/promises';

type Tile = {
  x: number;
  y: number;
};

/**
 * Calculates the euclidean distance between two points.
 *
 * @param a The first point
 * @param b The second point
 * @returns The euclidean distance between the two points
 */
function calculateDistance(a: Tile, b: Tile) {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
}

/**
 * Calculates the area of a triangle given its three vertices.
 *
 * It uses the cross product method to compute the area: the area of the parallelogram is twice that of the triangle.
 *
 * @param a The first vertex of the triangle
 * @param b The second vertex of the triangle
 * @param c The third vertex of the triangle
 * @returns The area of the triangle
 */
function calculateTriangleArea(a: Tile, b: Tile, c: Tile): number {
  if (!a || !b || !c) {
    console.debug(a, b, c);
  }

  return Math.abs(calculateCrossProduct(a, b, c)) / 2;
}

/**
 * Computes the two points furthest apart on a convex hull using the Rotating Calipers method.
 *
 * TODO: FIX THIS! IT DOES NOT WORK!
 *
 * Thanks to [this article](https://www.baeldung.com/cs/most-distant-pair-of-points#bd-3-convex-polygon-diameter).
 *
 * @param convexHull A list of points making up a convex hull
 * @returns An object representing the two points furthest apart and their distance
 */
function computeFurthestPointsApartUsingRotatingCalipers(convexHull: Tile[]) {
  // Get the number of points in the convex hull
  const n = convexHull.length;

  // Initialize k to find the first antipodal point pair convexHull[0] and convexHull[k]
  // Start with k=1 and increment until we find the point that maximizes the triangle area
  // formed by the first point, last point, and point k
  let k = 1;
  while (
    calculateTriangleArea(convexHull[0], convexHull.at(-1)!, convexHull[k]) <
    calculateTriangleArea(convexHull[0], convexHull.at(-1)!, convexHull[k + 1])
  )
    k++;

  console.debug(
    `Initial antipodal points: point 0 (${convexHull[0].x},${convexHull[0].y}), point ${k} (${convexHull[k].x},${convexHull[k].y})`
  );

  // Initialize variables to track the furthest pair of points
  let i,
    j,
    distance = 0;

  // Use the rotating calipers technique to find all antipodal pairs
  // Iterate through each edge of the convex hull up to the antipodal point index by k (inclusive)
  for (let p = 0, q = k; p <= k && q < n; p++) {
    console.debug('batman');
    // For each edge, rotate the caliper to find the furthest point from that edge
    // The calipers rotate until the triangle area stops increasing
    // This is done by comparing the area of the triangle formed by the edge (convexHull[p], convexHull[p + 1])
    // and the current antipodal point (convexHull[q % n]) with the area of the triangle formed by the same edge
    // and the next point (convexHull[(q + 1) % n])
    //
    // As long as the area increases, we keep rotating the caliper by advancing q.
    // When the area stops increasing, we have found the furthest point for this edge.
    while (
      calculateTriangleArea(convexHull[p], convexHull[p + 1], convexHull[q % n]) <=
      calculateTriangleArea(convexHull[p], convexHull[p + 1], convexHull[(q + 1) % n])
    ) {
      // Advance q to the next point on the hull
      q++;

      console.debug('hello');

      // Calculate the distance between the current edge endpoint and the antipodal point
      const currentDistance = calculateDistance(convexHull[p], convexHull[q % n]);

      // Update the furthest pair if this distance is greater than the previous maximum
      if (currentDistance > distance) {
        i = p;
        j = q % n;
        distance = currentDistance;
      }
    }
  }

  const edge = { i, a: convexHull[i!], j, b: convexHull[j!], distance };

  console.debug(
    `Furthest points apart: point ${i} (${edge.a.x},${edge.a.y}), point ${j} (${edge.b.x},${
      edge.b.y
    }), distance: ${edge.distance.toFixed(2)}`
  );

  return edge;
}

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
  const rl2 = ['7,1', '11,1', '11,7', '9,7', '9,5', '2,5', '2,3', '7,3'];
  // Causes incorrect result with rotating calipers method
  const rl3 = ['0,0', '4,0', '4,3', '3,5', '1, 7', '0,7', '2,2'];

  const tiles: Tile[] = [];

  // Read and parse the coordinates of the tiles one by one
  for await (const line of rl) {
    const [x, y] = line.split(',').map(Number);

    tiles.push({ x, y });
  }

  console.debug('Tiles:');
  console.table(tiles);

  // Compute the convex hull of the red tiles: we know that the tiles forming the rectangle with the largest area
  // must be part of the convex hull.
  const convexHull = computeConvexHull(tiles);

  console.debug('Convex hull:');
  console.table(convexHull);

  const area = computeLargestArea(convexHull);

  console.info(`Largest rectangular area that can be delimited by red tiles: ${area}`);

  return area;
}

function main() {
  const filePath = join(process.cwd(), 'assets/day9/input.txt');

  solveDay9(filePath);
}

main();
