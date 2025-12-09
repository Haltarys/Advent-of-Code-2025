import { createReadStream, type PathLike } from 'fs';
import { join } from 'path';
import readline from 'readline/promises';

type JunctionBox = {
  x: number;
  y: number;
  z: number;
};

type Distance = {
  i: number;
  j: number;
  distance: number;
};

/**
 * Union-Find (Disjoint Set Union) Data Structure
 *
 * This data structure keeps track of elements partitioned into disjoint sets.
 * It efficiently supports two operations:
 * 1. Find: Determine which set an element belongs to
 * 2. Union: Merge two sets together
 *
 * Uses path compression in find() and union by rank for optimal performance.
 * Time Complexity: O(α(n)) amortized for find/union operations
 * Space Complexity: O(n)
 */
class UnionFind {
  /** Array storing parent pointers for each element. Initially, each element is its own parent (root) */
  private parents: number[];
  /** Array storing the size of each tree. Used for union by size optimization */
  private size: number[];

  /**
   * Constructor: Initialize the Union-Find structure
   *
   * Creates n disjoint sets, each containing a single element.
   * Each element is initially its own parent (root of its own set).
   *
   * @param n - The number of elements (0 to n-1)
   *
   * @example
   * const uf = new UnionFind(5); // Creates sets: {0}, {1}, {2}, {3}, {4}
   *
   * Time Complexity: O(n)
   * Space Complexity: O(n)
   */
  constructor(n: number) {
    // Initialize each element as its own parent
    this.parents = Array.from({ length: n }, (_, i) => i);
    // Initialize all sizes to 1 (each element is its own set initially)
    this.size = Array(n).fill(1);
  }

  /**
   * Find the root (representative) of the set containing element x
   *
   * Uses path compression: redirects parent pointers along the path to point
   * directly to the root, flattening the tree structure for faster future lookups.
   *
   * @param x - The element to find the root for
   * @returns The root element of the set containing x
   *
   * @example
   * const root = uf.find(3); // Returns the root of the set containing element 3
   *
   * Time Complexity: O(α(n)) amortized, where α is the inverse Ackermann function (nearly constant)
   */
  find(x: number): number {
    // Keep following parent pointers until we find the root (where parent[x] === x)
    while (x !== this.parents[x]) {
      // Path splitting: make x's parent point to the grandparent, skipping the parent
      [x, this.parents[x]] = [this.parents[x], this.parents[this.parents[x]]];
    }
    // Return the root element
    return x;
  }

  /**
   * Union two sets by connecting their roots
   *
   * Merges the sets containing elements x and y. If they are already in the same set,
   * returns false. Uses union by rank: attaches the smaller tree under the larger tree
   * to keep the overall tree height small.
   *
   * @param x - An element from the first set
   * @param y - An element from the second set
   * @returns true if the sets were merged, false if they were already in the same set
   *
   * @example
   * uf.union(0, 1); // Merges the sets containing 0 and 1
   * uf.union(0, 1); // Returns false, already in same set
   *
   * Time Complexity: O(α(n)) amortized
   */
  union(x: number, y: number): boolean {
    // Find the roots of both elements
    const rootX = this.find(x),
      rootY = this.find(y);

    // If both elements are already in the same set, nothing to do
    if (rootX === rootY) return false;

    // Union by rank: attach the smaller tree under the larger tree
    if (this.size[rootX] < this.size[rootY]) {
      // rootX's tree is smaller, make rootY the parent
      this.parents[rootX] = rootY;
    } else if (this.size[rootX] > this.size[rootY]) {
      // rootX's tree is larger, make rootX the parent
      this.parents[rootY] = rootX;
    } else {
      // Trees have equal size, make rootY the parent
      this.parents[rootX] = rootY;
    }

    // Update the size of both trees
    // (Note: only the size at the index of the root element is updated for efficiency)
    this.size[rootX] += this.size[rootY];
    this.size[rootY] = this.size[rootX];

    // Union was successful
    return true;
  }

  /**
   * Check if two elements are in the same set
   *
   * Determines whether elements a and b belong to the same connected component
   * by comparing their roots.
   *
   * @param a - The first element
   * @param b - The second element
   * @returns true if a and b are in the same set, false otherwise
   *
   * @example
   * uf.union(0, 1);
   * uf.areConnected(0, 1); // Returns true
   * uf.areConnected(0, 2); // Returns false
   *
   * Time Complexity: O(α(n)) amortized
   */
  areConnected(a: number, b: number): boolean {
    // Two elements are connected if they have the same root
    return this.find(a) === this.find(b);
  }

  /**
   * Get all disjoint sets as separate arrays
   *
   * Partitions all elements into groups based on their connected components.
   * Each returned array contains all elements in one set.
   *
   * @returns An array of arrays, where each inner array is a distinct set
   *
   * @example
   * uf.union(0, 1);
   * uf.union(2, 3);
   * uf.getSets(); // Returns [[0, 1], [2, 3], [4]]
   *
   * Time Complexity: O(n × α(n))
   * Space Complexity: O(n)
   */
  getSets() {
    // Map to group elements by their root
    const sets: Record<number, number[]> = {};

    // Iterate through all elements
    for (let i = 0; i < this.parents.length; i++) {
      // Find the root of the current element
      const root = this.find(i);

      // Add element i to the set corresponding to its root
      if (sets[root]) {
        sets[root].push(i);
      } else {
        sets[root] = [i];
      }
    }

    // Return only the arrays (values) from the map, discarding the root keys
    return Object.values(sets);
  }

  /**
   * Get the size of the set containing element x
   *
   * Returns the number of elements in the connected component that contains x.
   * This is useful for determining the size of a circuit without having to retrieve all elements.
   *
   * @param x - The element to query
   * @returns The number of elements in the set containing x
   *
   * @example
   * uf.union(0, 1);
   * uf.union(1, 2);
   * uf.findSize(0); // Returns 3 (elements 0, 1, 2)
   * uf.findSize(3); // Returns 1 (element 3 is alone)
   *
   * Time Complexity: O(α(n)) amortized
   */
  findSize(x: number): number {
    // Find the root of the set containing x
    const root = this.find(x);
    // Return the size stored at the root
    return this.size[root];
  }
}

/**
 * Calculate the square of the distance between two given junction boxes.
 * (The exact distance value does not matter, so we skip calculating the square root to increase performance.)
 *
 * @param a A junction box
 * @param b Another junction box
 * @returns The square of the distance between junction boxes `a` and `b`
 */
function calculateDistanceSquared(a: JunctionBox, b: JunctionBox): number {
  return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2);
}

/**
 * Solution to [Advent of Code 2025 Day 8 Part 2](https://adventofcode.com/2025/day/8#part2)
 *
 * @param filePath path to the list of junction boxes coordinates
 * @returns The product of the X coordinates of the last connexion made
 */
export async function day8(filePath: PathLike): Promise<number> {
  const rl = readline.createInterface({ input: createReadStream(filePath) });

  const junctionBoxes: JunctionBox[] = [];

  // Read and parse the coordinates of the junction boxes one by one
  for await (const line of rl) {
    const [x, y, z] = line.split(',').map(Number);

    junctionBoxes.push({ x, y, z });
  }

  console.debug('Junction boxes:');
  console.table(junctionBoxes);

  const edges: Distance[] = [];

  // Calculate the distance between every junction box from any other
  for (let i = 0; i < junctionBoxes.length; i++) {
    const a = junctionBoxes[i];
    for (let j = i + 1; j < junctionBoxes.length; j++) {
      const b = junctionBoxes[j];

      edges.push({ i, j, distance: calculateDistanceSquared(a, b) });
    }
  }
  // Sort the connexions in ascending order to get the junction boxes closest to each other first
  edges.sort((a, b) => a.distance - b.distance);

  console.debug('Connexions:');
  console.table(edges);

  // The UnionFind data structure helps keep track of the sets as they are being joined together
  const unionFind = new UnionFind(junctionBoxes.length);

  // Join junction boxes that are closest to each other together until they form a single circuit
  let i = 0;
  // While the size of the circuit of the first junction box (index 0 here, but it could be
  // any junction box) is less than the total number of junction boxes, keep connecting boxes
  while (unionFind.findSize(0) < junctionBoxes.length) {
    unionFind.union(edges[i].i, edges[i].j);
    i++;
  }
  console.debug(`All junction boxes are connected after ${i} connexions.`);

  // Calculate the product of the X coordinates of the last connexion made
  const res = junctionBoxes[edges[i - 1].i].x * junctionBoxes[edges[i - 1].j].x;

  console.debug(`Product of the X coordinates of the last connexion made: ${res}`);

  return 0;
}

function main() {
  const filePath = join(process.cwd(), 'assets/day8/input.txt');

  day8(filePath);
}

main();
