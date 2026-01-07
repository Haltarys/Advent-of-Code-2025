import { createReadStream, type PathLike } from 'fs';
import { join } from 'path';
import readline from 'readline/promises';

type JoltageCounters = number[];
type Button = number[];

/**
 * Checks whether a given array of joltage counters are all at zero or not.
 *
 * The trick is that, the right combination of buttons will lower all the counters down to
 * zero, when starting from the target configuration. If so, then that combination of
 * buttons is a correct one.
 *
 * @param joltageCounters Array of numbers representing joltage counters
 * @returns true if all joltage counters are at zero, false otherwise
 */
function areAllCountersAtZero(joltageCounters: JoltageCounters): boolean {
  return joltageCounters.every((counter) => counter === 0);
}

/**
 * Checks whether a given array of joltage counters is invalid or not.
 *
 * @param joltageCounters Array of numbers representing joltage counters
 * @returns true if any joltage counter is negative (invalid), false otherwise
 */
function isAnyCounterInvalid(joltageCounters: JoltageCounters): boolean {
  return joltageCounters.some((counter) => counter < 0);
}

/**
 * Simulates pressing a button, decreasing the joltage counters whose indices are given
 * by the button.
 *
 * The given `joltageCounters` array parameter is left unmodified.
 *
 * @param joltageCounters Array of numbers representing joltage counters
 * @param button Array of numbers representing a button. Each number is the index of a
 * joltage counter to decrease.
 * @returns The new joltage levels after the button has been pressed.
 */
function pressButton(joltageCounters: JoltageCounters, button: Button) {
  const newJoltageCounters = Array.from(joltageCounters);

  for (const i of button) newJoltageCounters[i]--;

  return newJoltageCounters;
}

let bruh = 0;

/**
 * Given a list of joltage requirements and a list of buttons, computes a combination of buttons
 * that, when pressed in sequence, will increase the joltage level counters to meet the joltage requirements.
 *
 * @param joltageRequirements  The target joltage requirements. Array of numbers representing joltage level to meet
 * exactly.
 * @param buttons Array of array of numbers representing a list of buttons that will toggle one or several lights on or
 * off. Each button is a list of indices of light indicators.
 * @returns The combination of buttons that, when pressed in sequence, will increase the joltage level counter to meet
 * the requirements. If no such combination exists, returns undefined.
 */
function computeCorrectButtonCombination(
  joltageRequirements: JoltageCounters,
  buttons: Button[],
  memo = new Map<string, Button[]>(),
  acc: Button[] = []
): Button[] | undefined {
  if (areAllCountersAtZero(joltageRequirements)) return acc; // Found a valid combination

  if (isAnyCounterInvalid(joltageRequirements)) return undefined; // No valid path

  const key = `${joltageRequirements}`;
  if (memo.has(key)) return memo.get(key);

  let smallestCombination: Button[] | undefined;
  const combinations = buttons
    .map((button) => {
      const newJoltageCounters = pressButton(joltageRequirements, button);

      return computeCorrectButtonCombination(
        newJoltageCounters,
        buttons,
        memo,
        acc.concat([button])
      );
    })
    .filter((combination) => combination !== undefined);

  for (const combination of combinations) {
    if (!smallestCombination || combination.length < smallestCombination.length)
      smallestCombination = combination;
  }

  if (smallestCombination) memo.set(key, smallestCombination);

  return smallestCombination;
}

/**
 * Given a line from the input file, parses its contents into structured data: a light indicator diagram (as a boolean
 * array, unused in this part of the challenge), a list of buttons (array of array of joltage level counter indices),
 * and some joltage requirements (array of numbers).
 *
 * @param line Line from the input file
 * @returns The parsed contents from the given line
 */
function parseLine(line: string) {
  const res: {
    lightDiagram: boolean[];
    buttons: number[][];
    joltageRequirements: number[];
  } = {
    lightDiagram: [],
    buttons: [],
    joltageRequirements: [],
  };

  // Split the line into elements separated by spaces
  for (const element of line.split(' ')) {
    // Extract the content inside the enclosing brackets/parentheses
    const s = element.slice(1, -1);

    // [.##.] in brackets indicate the lights diagram
    if (element.startsWith('[') && element.endsWith(']')) {
      res.lightDiagram = s.split('').map((c) => c === '#');

      // {number,number...} in curly braces indicate the joltage requirements
    } else if (element.startsWith('{') && element.endsWith('}')) {
      res.joltageRequirements = s.split(',').map(Number);

      // (number,number...) in curly braces indicate the button switches
    } else if (element.startsWith('(') && element.endsWith(')')) {
      res.buttons.push(s.split(',').map(Number));
    }
  }

  return res;
}

/**
 * Solution to [Advent of Code 2025 Day 10 Part 2](https://adventofcode.com/2025/day/10#part2)
 *
 * @param filePath Path to the manual
 * @returns The fewest number of button presses required to meet the joltage requirements for all machines
 */
export async function solveDay10Part2(filePath: PathLike): Promise<number> {
  const rl = readline.createInterface({ input: createReadStream(filePath) });

  let sum = 0;
  // Process each line in the input file
  for await (const line of rl) {
    const { joltageRequirements, buttons } = parseLine(line);

    // Sort buttons by length in descending order to try larger buttons first, which
    // reduces the overall number of button presses needed
    buttons.sort((a, b) => b.length - a.length);

    console.debug(`Joltage requirements: [${joltageRequirements}]`);
    console.debug(`Buttons: (${buttons.join(') (')})`);

    // Compute the correct combination of buttons to meet the joltage requirements
    const combination = computeCorrectButtonCombination(joltageRequirements, buttons);

    if (combination !== undefined) sum += combination.length;

    console.debug(`Combination (${combination?.length ?? 0} buttons long):`);
    console.debug(combination);
    console.debug();

    // break;
  }

  console.debug(`Sum of lengths of correct combinations: ${sum}`);

  return 0;
}

function main() {
  const filePath = join(process.cwd(), 'assets/day10/small.txt');

  solveDay10Part2(filePath);
}

main();
