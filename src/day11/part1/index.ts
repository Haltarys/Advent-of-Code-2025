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
 * @returns The number of paths leading from the current vertex to the destination
 */
function computePathCount(graph: Graph, current: string, destination: string): number {
  // Base case: if we reached the destination, count this as a valid path
  if (current === destination) return 1;

  // Get the outgoing vertices from the current vertex
  const outputs = graph.get(current);

  // If there are no outputs from the current vertex, no path can be formed
  if (!outputs) return Infinity;

  // From each outgoing vertex from the current vertex, compute, sum, and return the number of paths to the destination
  return outputs.reduce((acc, output) => acc + computePathCount(graph, output, destination), 0);
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
 * Solution to [Advent of Code 2025 Day 11 Part 1](https://adventofcode.com/2025/day/11)
 *
 * @param filePath path to the list of devices and their outputs
 * @returns The number of paths leading from device 'you' to device 'out'
 */
export async function solveDay11(filePath: PathLike): Promise<number> {
  const rl = readline.createInterface({ input: createReadStream(filePath) });

  const graph = await buildGraph(rl[Symbol.asyncIterator]());

  const pathCount = computePathCount(graph, 'you', 'out');

  console.log("Total number of paths from 'you' to 'out':", pathCount);

  return pathCount;
}

function main() {
  const filePath = join(process.cwd(), 'assets/day11/input.txt');

  solveDay11(filePath);
}

main();
