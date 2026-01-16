import { createReadStream, type PathLike } from 'fs';
import { join } from 'path';
import readline from 'readline/promises';

type Graph = Map<string, string[]>;

/**
 * Computes the number of paths from a given vertex to a given destination vertex.
 *
 * @param graph Graph representing the devices and their connexions
 * @param current The current vertex in the graph
 * @param destination The vertex to reach
 * @param mandatoryIntermediateVertices List of vertices that must be visited before the path can be declared valid
 * @param memo Map to memoise the result to improve performance
 * DO NOT OVERRIDE THE DEFAULT VALUE OF THIS PARAMETER WHEN CALLING THE FUNCTION!
 * @returns The number of paths leading from the current vertex to the destination
 */
function computePathCount(
  graph: Graph,
  current: string,
  destination: string,
  mandatoryIntermediateVertices: string[],
  memo = new Map<string, number>()
): number {
  // Base case: if we reached the destination and all mandatory intermediate paths have been visited, count this as a
  // valid path, else we discard it.
  if (current === destination) return mandatoryIntermediateVertices.length === 0 ? 1 : 0;

  const key = `${current}-${mandatoryIntermediateVertices.join(',')}`;

  // Return cached result if available
  if (memo.has(key)) return memo.get(key)!;

  // Remove the current vertex from the list of intermediate vertices to visit if it is in it
  const remainingMandatoryIntermediateVertices = mandatoryIntermediateVertices.filter(
    (vertex) => vertex !== current
  );

  // Get the outgoing vertices from the current vertex
  const outputs = graph.get(current);

  // If there are no outputs from the current vertex, no path can be formed
  if (!outputs) return Infinity;

  // From each outgoing vertex from the current vertex, compute, sum, and return the number of paths to the destination
  const res = outputs.reduce(
    (acc, output) =>
      acc +
      computePathCount(graph, output, destination, remainingMandatoryIntermediateVertices, memo),
    0
  );

  // Update cache and return the result
  memo.set(key, res);
  return res;
}

/**
 * Builds a graph from the given input
 *
 * @param input Lines representing each device and its outputs
 * @returns Graph representing the devices and their connexions
 */
async function buildGraph(input: AsyncIterable<string>): Promise<Graph> {
  const graph: Graph = new Map<string, string[]>();

  // Read and parse each line and populate the graph
  for await (const line of input) {
    const [device, outputs] = line.split(': ');

    graph.set(device, outputs.split(' '));
  }

  return graph;
}

/**
 * Solution to [Advent of Code 2025 Day 11 Part 2](https://adventofcode.com/2025/day/11#part2)
 *
 * @param filePath path to the list of devices and their outputs
 * @returns The number of paths leading from device 'svr' to device 'out' going through devices 'dac' and 'fft'
 */
export async function solveDay11Part2(filePath: PathLike): Promise<number> {
  const rl = readline.createInterface({ input: createReadStream(filePath) });

  const graph = await buildGraph(rl[Symbol.asyncIterator]());

  const pathCount = computePathCount(graph, 'svr', 'out', ['dac', 'fft']);

  console.log("Total number of paths from 'svr' to 'out':", pathCount);

  return pathCount;
}

function main() {
  const filePath = join(process.cwd(), 'assets/day11/input.txt');

  solveDay11Part2(filePath);
}

main();
