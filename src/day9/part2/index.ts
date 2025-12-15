import { createReadStream, type PathLike } from 'fs';
import { join } from 'path';
import readline from 'readline/promises';

type Tile = {
  x: number;
  y: number;
};

type Segment = {
  top: number;
  bottom: number;
  left: number;
  right: number;
  direction?: 'horizontal' | 'vertical';
  outsideArea?: 'left' | 'right' | 'above' | 'below';
};

type Rectangle = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

/**
 * Calculates the area of the given rectangle.
 *
 * @param a Coordinates of the first tile
 * @param b Coordinates of the second tile
 * @returns The area of the rectangle delimited by the tiles
 */
function calculateRectangleArea(rectangle: Rectangle): number {
  // Area = |x2 - x1| × |y2 - y1|
  // (Note: adding 1 to each dimension to account for inclusive counting of tiles)
  return (rectangle.right - rectangle.left + 1) * (rectangle.bottom - rectangle.top + 1);
}

/**
 * Given a list of tiles, generates every possible rectangle whose opposite corners are two of the tiles in the list.
 *
 * @param tiles Array of tiles
 * @returns A generator yielding every possible rectangle
 */
function* generateEveryRectangle(tiles: Tile[]): Generator<Rectangle> {
  for (let i = 0; i < tiles.length; i++) {
    // Adding 1 to j to ensure we don't pick the same tile (i === j),
    // and another 1 to avoid adjacent tiles (j === i + 1)
    // because 1x1 or 1xN rectangles are unlikely to be the largest inscribed rectangle.
    for (let j = i + 2; j < tiles.length; j++) {
      const corner1 = tiles[i];
      const corner2 = tiles[j];

      // For each dimension, find which of the two coordinate values is the smallest
      const [top, bottom] = corner1.y < corner2.y ? [corner1.y, corner2.y] : [corner2.y, corner1.y];
      const [left, right] = corner1.x < corner2.x ? [corner1.x, corner2.x] : [corner2.x, corner1.x];

      yield { top, bottom, left, right };
    }
  }
}

/**
 * Given a rectangle and a list of segments, check whether any segment intersects with or is inside the rectangle.
 *
 * @param rectangle Rectangle to check
 * @param segments List of segments to compare with the given rectangle
 * @returns true if any segment intersects with, or is inside, the rectangle, false otherwise
 */
function isRectangleIntersected(rectangle: Rectangle, segments: Segment[]): boolean {
  for (const segment of segments) {
    /**
     * If the segment is in any of those configurations, it is not intersecting and we move on to the next one.
     *
     *           |
     *
     *        +-----+
     *  ---   |     |   ---
     *        +-----+
     *
     *           |
     */
    if (segment.bottom <= rectangle.top) continue; // Segment is too high above rectangle
    if (segment.top >= rectangle.bottom) continue; // Segment is too far below rectangle
    if (segment.right <= rectangle.left) continue; // Segment is too far left of rectangle
    if (segment.left >= rectangle.right) continue; // Segment is too far right of rectangle

    // If none of the above, the segment is intersecting the rectangle
    return true;
  }

  return false;
}

/**
 * Checks whether a given rectangle is outside the polygon using the ray casting method. This can happen if the polygon
 * is concave.
 *
 * @param rectangle Rectangle to check
 * @param verticalSegments List of segments to compare with the rectangle
 * @returns true if the rectangle happens to be fully or partially outside the polygon, false otherwise
 */
function isRectangleOutside(rectangle: Rectangle, verticalSegments: Segment[]): boolean {
  // Calculate the center of the rectangle
  const midX = (rectangle.left + rectangle.right) / 2,
    midY = (rectangle.top + rectangle.bottom) / 2;

  // If the midpoint is on the rectangle (meaning it has a width or a height of 1), the rectangle cannot be outside.
  if (midX === rectangle.left || midY === rectangle.top) return false;

  // Ray casting algorithm: we cast a ray starting from the center of the rectangle towards the right and counts how
  // many times it intersects with a vertical segment (excluding starting on one)
  let counter = 0;
  for (const segment of verticalSegments) {
    // If segment is to the left of or on the starting midpoint, skip it
    if (segment.left <= midX) continue;

    // If the segment crosses the ray
    if (midY >= segment.top && midY <= segment.bottom) counter++;
  }

  // If we have crossed an even number of pairs, we started outside of the polygon, otherwise, inside.
  return counter % 2 === 0;
}

/**
 * Finds the largest rectangle inscribed inside the polygon delimited by the given segments.
 *
 * @param tiles Array of tiles
 * @param segments Array of segments making up the polygon
 * @returns The largest rectangle inscribed the polygon
 */
function findLargestInscribedRectangle(tiles: Tile[], segments: Segment[]): Rectangle {
  let largestInscribedRectangle: Rectangle;
  let maxArea = 0;

  const verticalSegments = segments.filter((segment) => segment.direction === 'vertical');

  for (const rectangle of generateEveryRectangle(tiles)) {
    const area = calculateRectangleArea(rectangle);

    if (
      area > maxArea &&
      !isRectangleIntersected(rectangle, segments) &&
      !isRectangleOutside(rectangle, verticalSegments)
    ) {
      maxArea = area;
      largestInscribedRectangle = rectangle;
    }
  }

  return largestInscribedRectangle!;
}

/**
 * Given a list of tiles forming a polygon, computes the list of axis-aligned segments
 * connecting each point with the next and previous points in the list.
 *
 * @param tiles Array of tiles
 * @returns A list of segments, with they coordinates and direction
 */
function computeSegments(tiles: Tile[]): Segment[] {
  const segments: Segment[] = [];
  let leftmostVerticalSegmentIndex: number | undefined;

  // Iterate over every point, select it and the next one
  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i % tiles.length],
      nextTile = tiles[(i + 1) % tiles.length];

    const top = Math.min(tile.y, nextTile.y),
      bottom = Math.max(tile.y, nextTile.y),
      left = Math.min(tile.x, nextTile.x),
      right = Math.max(tile.x, nextTile.x);

    const segment: Segment = { top, bottom, left, right };
    // If the 2 points are on the same row, the segment they form is horizontal
    if (tile.y === nextTile.y) segment.direction = 'horizontal';
    // Else, if the 2 points are on the same column, the segment they form is vertical
    else if (tile.x === nextTile.x) segment.direction = 'vertical';
    // In the given problem, segment cannot be diagonal

    segments.push(segment);

    // Keep track of the leftmost vertical segment's index
    if (
      segment.direction === 'vertical' &&
      (leftmostVerticalSegmentIndex === undefined ||
        segment.left < segments[leftmostVerticalSegmentIndex].left)
    )
      leftmostVerticalSegmentIndex = segments.length - 1;
  }

  if (leftmostVerticalSegmentIndex !== undefined) {
    // Initialize the outside area of the leftmost vertical segment to 'left'
    segments[leftmostVerticalSegmentIndex].outsideArea = 'left';

    for (
      let i = leftmostVerticalSegmentIndex;
      i < segments.length + leftmostVerticalSegmentIndex;
      i++
    ) {
      // Select the current segment and the next one (wrapping around the array)
      const segment = segments[i % segments.length],
        nextSegment = segments[(i + 1) % segments.length];

      /**
       * There are 4 possible segment pair configurations:
       *
       * 1. Top left corner
       *
       * +---+
       * |
       * +
       *
       * 2. Top right corner
       *
       * +---+
       *     |
       *     +
       *
       * 3. Bottom left corner
       *
       * +
       * |
       * +---+
       *
       * 4. Bottom right corner
       *
       *     +
       *     |
       * +---+
       *
       * For each segment pair, the current and next segments could either be horizontal and vertical
       * or vertical and horizontal.
       * For the current segment, the outside area could either be above or below it if the segment if horizontal,
       * or it could be either to its left or to its right if the segment is vertical.
       */

      if (segment.direction === 'horizontal' && nextSegment.direction === 'vertical') {
        if (segment.top === nextSegment.top) {
          if (segment.left === nextSegment.left) {
            // Top left corner
            nextSegment.outsideArea = segment.outsideArea === 'above' ? 'left' : 'right';
          } else if (segment.right === nextSegment.right) {
            // Top right corner
            nextSegment.outsideArea = segment.outsideArea === 'above' ? 'right' : 'left';
          }
        } else if (segment.bottom === nextSegment.bottom) {
          if (segment.left === nextSegment.left) {
            // Bottom left corner
            nextSegment.outsideArea = segment.outsideArea === 'above' ? 'right' : 'left';
          } else if (segment.right === nextSegment.right) {
            // Bottom right corner
            nextSegment.outsideArea = segment.outsideArea === 'above' ? 'left' : 'right';
          }
        }
      } else if (segment.direction === 'vertical' && nextSegment.direction === 'horizontal') {
        if (segment.top === nextSegment.top) {
          if (segment.left === nextSegment.left) {
            // Top left corner
            nextSegment.outsideArea = segment.outsideArea === 'left' ? 'above' : 'below';
          } else if (segment.right === nextSegment.right) {
            // Top right corner
            nextSegment.outsideArea = segment.outsideArea === 'left' ? 'below' : 'above';
          }
        } else if (segment.bottom === nextSegment.bottom) {
          if (segment.left === nextSegment.left) {
            // Bottom left corner
            nextSegment.outsideArea = segment.outsideArea === 'left' ? 'below' : 'above';
          } else if (segment.right === nextSegment.right) {
            // Bottom right corner
            nextSegment.outsideArea = segment.outsideArea === 'left' ? 'above' : 'below';
          }
        }
      }
    }
  }

  return segments;
}

/**
 * Solution to [Advent of Code 2025 Day 9 Part 2](https://adventofcode.com/2025/day/9#part2)
 *
 * @param filePath path to the list of red tile coordinates
 * @returns The product of the sizes of the three largest circuits
 */
export async function solveDay9Part2(filePath: PathLike): Promise<number> {
  const rl = readline.createInterface({ input: createReadStream(filePath) });
  // Causes incorrect result with rotating calipers method

  const tiles: Tile[] = [];

  // Read and parse the coordinates of the tiles one by one
  for await (const line of rl) {
    const [x, y] = line.split(',').map(Number);

    tiles.push({ x, y });
  }

  console.debug('Tiles:');
  console.table(tiles);

  const segments = computeSegments(tiles);

  console.debug('Segments:');
  console.table(segments);

  const rectangle = findLargestInscribedRectangle(tiles, segments);
  const area = calculateRectangleArea(rectangle);

  console.debug(
    `Largest rectangle inscribed in the polygon: (${rectangle.left},${rectangle.top}) (${rectangle.right},${rectangle.bottom})`
  );

  console.debug(`Area: ${area}`);

  return area;
}

function main() {
  const filePath = join(process.cwd(), 'assets/day9/input.txt');

  solveDay9Part2(filePath);
}

main();
