import { createReadStream, type PathLike } from 'fs';
import { join } from 'path';
import readline from 'readline/promises';

type Button = number[];

type MachineDiagram = {
  lightDiagram: boolean[];
  buttons: Button[];
  joltageRequirements: number[];
};

/**
 * Checks whether a given array of indicator lights are all off or not.
 * A light is on if its corresponding boolean value is true, off if its corresponding
 * boolean value is false.
 *
 * The trick is that, the right combination of buttons will turn all lights off, when starting
 * from the target configuration. If all lights are off, then whichever combination of buttons produced it is valid.
 *
 * @param lights Array of boolean values representing indicator lights
 * @returns true if all lights are off (all boolean values are false), false otherwise
 */
function areAllLightsOff(lights: boolean[]): boolean {
  return lights.every((light) => !light);
}

/**
 * Given some light indicators, some of which are turned on, some of which are turned off,
 * press each given button in sequence, which will toggle some lights on or off. The
 * altered configuration is returned.
 *
 * The original `lights` array is untouched.
 *
 * @param lights Array of boolean values representing indicator lights
 * @param buttons Array of array of numbers representing a list of buttons that will
 * each toggle one or several lights on or off. Each button is a list of indices of light indicators.
 * @returns The new configuration of lights after the buttons have been pressed.
 */
function toggleLights(lights: boolean[], buttons: Button[]) {
  const newLights = Array.from(lights);

  // Iterate through each button, and, for each button, toggle each of the light indicators it affects
  for (const button of buttons) {
    for (const i of button) newLights[i] = !newLights[i];
  }

  return newLights;
}

/**
 * Given an array of N buttons, recursively generates all the different ways to pick K buttons from the set
 * of N buttons, K varying from 0 to N inclusive.
 *
 * @param buttons Array of buttons (each button is a list indices of lights to toggle on or off)
 * @param acc Accumulator array. DO NOT OVERRIDE THE DEFAULT VALUE OF THIS PARAMETER WHEN CALLING THE FUNCTION!
 */
function* generateCombinations(buttons: Button[], acc: Button[] = []): Generator<Button[]> {
  // Base case check: if there are buttons remaining to process
  if (buttons.length > 0) {
    // Extract the first button from the buttons array
    const first = buttons[0];
    // Get the remaining buttons by slicing off the first one
    const rest = buttons.slice(1);

    // Recursively generate combinations without including the first button
    const res1 = generateCombinations(rest, acc);
    // Recursively generate combinations that include the first button in the accumulator
    const res2 = generateCombinations(rest, acc.concat([first]));

    // Initialize iterators for both generator results
    let a = res1.next(),
      b = res2.next();

    // Continue yielding values from both generators while either has values remaining
    while (!a.done || !b.done) {
      // If both generators have values and the first generator's value is shorter in length, yield from first
      if (!a.done && a.value.length < b.value.length) {
        yield a.value;
        // Advance the first generator to the next value
        a = res1.next();
      } else if (!b.done) {
        // Otherwise, if the second generator has values, yield from it
        yield b.value;
        // Advance the second generator to the next value
        b = res2.next();
      }
    }
  } else {
    // Base case: no more buttons to process, yield the accumulated combination
    yield acc;
  }
}

/**
 * Given a configuration of lights and a list of buttons, iterate through all combinations of buttons until it finds
 * one that, when pressed in sequence, will produce a configuration identical to the target configuration.
 *
 * @param lights  The target configuration. Array of boolean values representing indicator lights.
 * @param buttons Array of array of numbers representing a list of buttons that will toggle one or several lights on or
 * off. Each button is a list of indices of light indicators.
 * @returns The combination of buttons that, when pressed in sequence, will produce the target configuration. If no
 * such combination exists, returns undefined.
 */
function computeCorrectButtonCombination(
  lights: boolean[],
  buttons: Button[]
): Button[] | undefined {
  for (const combination of generateCombinations(buttons)) {
    if (areAllLightsOff(toggleLights(lights, combination))) return combination;
  }

  return undefined;
}

/**
 * Given a line from the input file, parses its contents into structured data: a light indicator diagram (as a boolean
 * array), a list of buttons (array of array of light indicator indices), and some joltage requirements (array of
 * numbers, unused in this part of the challenge).
 *
 * @param line Raw line to parse from the input file
 * @returns The parsed contents from the given line as an object
 */
function parseLine(line: string) {
  const res: MachineDiagram = {
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

      // (number,number...) in parenthesis indicate the button switches
    } else if (element.startsWith('(') && element.endsWith(')')) {
      res.buttons.push(s.split(',').map(Number));
    }
  }

  return res;
}

/**
 * Solution to [Advent of Code 2025 Day 10 Part 1](https://adventofcode.com/2025/day/10)
 *
 * @param filePath Path to the manual
 * @returns The fewest number of button presses required to configure the lights as specified
 */
export async function solveDay10(filePath: PathLike): Promise<number> {
  const rl = readline.createInterface({ input: createReadStream(filePath) });

  let sum = 0;
  // Process each line in the input file
  for await (const line of rl) {
    const { lightDiagram, buttons } = parseLine(line);

    console.debug(`Lights:`, lightDiagram);
    console.debug(`Buttons: (${buttons.join(') (')})`);

    // Compute the correct combination of buttons to turn off all lights
    const combination = computeCorrectButtonCombination(lightDiagram, buttons);

    if (combination) sum += combination.length;

    console.debug(`Combination (${combination?.length ?? 0} buttons long):`);
    console.debug(combination);
    console.debug();
  }

  console.debug(`Sum of lengths of correct combinations: ${sum}`);

  return sum;
}

function main() {
  const filePath = join(process.cwd(), 'assets/day10/input.txt');

  solveDay10(filePath);
}

main();
