import { createReadStream, type PathLike } from 'fs';
import { join } from 'path';
import readline from 'readline/promises';

type Button = number[];

type MachineDiagram = {
  lightDiagram: boolean[];
  buttons: Button[];
  joltageRequirements: number[];
};

type Solution = {
  valid: boolean;
  buttonCombination: number[];
  totalPresses: number;
};

/**
 * Computes the best solution (with the fewest button presses) to a system of equations in row echelon form,
 * given the list of pivot columns, free variables, and constraints for each variable.
 *
 * It uses a recursive approach to assign values to free variables within their constraints, and then back-substitutes
 * to compute the values of the pivot variables. It keeps track of the best valid solution found during the recursion.
 *
 * @param matrix A matrix in row echelon form representing a system of equations to solve
 * @param pivotCols A list of indices of pivot columns in the matrix
 * @param freeVariables A list of indices of the free variables in the pivot column
 * (the indices that are not in the list of pivot column indices)
 * @param constraints A list of constraints (inclusive upper bounds) for each variable (both pivot and free)
 * @param currentFreeVariableIndex The index of the current free variable to assign a value to. Starts at 0.
 * DO NOT OVERRIDE THE DEFAULT VALUE OF THIS PARAMETER WHEN CALLING THE FUNCTION!
 * @param currentSolution An array of the current values of the variables (both pivot and free).
 * DO NOT OVERRIDE THE DEFAULT VALUE OF THIS PARAMETER WHEN CALLING THE FUNCTION!
 * @returns The best solution found (with the fewest button presses), or an invalid solution if none exists
 */
function computeBestSolution(
  matrix: number[][],
  pivotCols: number[],
  freeVariables: number[],
  constraints: number[],
  currentFreeVariableIndex = 0,
  currentSolution: number[] = new Array(matrix[0].length - 1).fill(0),
): Solution {
  // All free variables have been assigned some value
  if (currentFreeVariableIndex >= freeVariables.length) {
    const numVars = matrix[0].length - 1;

    // 1a. With back-substitution, compute pivot variables from the assigned free variables
    for (let i = pivotCols.length - 1; i >= 0; i--) {
      const pivotCol = pivotCols[i];
      const row = i;

      currentSolution[pivotCol] = matrix[row][numVars];

      for (let j = pivotCol + 1; j < numVars; j++)
        currentSolution[pivotCol] -= matrix[row][j] * currentSolution[j];
      currentSolution[pivotCol] /= matrix[row][pivotCol];
    }
    // 1b. Compute the sum of all the button presses
    const sum = currentSolution.reduce((acc, v) => acc + v, 0);

    // 2. Check if solution is valid (we cannot press a button a negative or fractional number of times)
    const noNegativeValues = currentSolution.every((v) => v >= 0);
    const noFractionalValues = currentSolution.every((v) => Math.floor(v) === v);

    const solution: Solution = {
      valid: noNegativeValues && noFractionalValues,
      // Copy array since it is shared between all invocations of this function
      buttonCombination: [...currentSolution],
      totalPresses: sum,
    };

    return solution;
  }

  // Placeholder solution with infinite button presses
  let bestSolution: Solution = { valid: false, buttonCombination: [], totalPresses: Infinity };

  // Select the index of the current free variable to assign
  const freeVar = freeVariables[currentFreeVariableIndex];
  // Iterate through all possible values for the current free variable, given its constraint
  for (let f = 0; f <= constraints[freeVar]; f++) {
    // Assign the current value to the free variable
    currentSolution[freeVar] = f;

    // Now that the current free variable is fixed, move on to the next free variable and recursively compute the
    // solution.
    const solution = computeBestSolution(
      matrix,
      pivotCols,
      freeVariables,
      constraints,
      currentFreeVariableIndex + 1,
      currentSolution,
    );

    // If the computed solution is valid and better than the best one found so far, keep it
    if (solution.valid && solution.totalPresses < bestSolution.totalPresses)
      bestSolution = solution;
  }

  return bestSolution;
}

/**
 * Determines the additional constraints (inclusive upper bounds) for each variable (both pivot and free) in the system
 * of equations represented by the given joltage requirements and buttons.
 *
 * @param joltageRequirements  The target joltage requirements. Array of numbers representing joltage level to meet
 * exactly.
 * @param buttons Array of array of numbers representing a list of buttons that will increase one or several joltage
 * counters. Each button is a list of indices of joltage counters.
 * @returns Array of constraints (inclusive upper bounds) for each variable (both pivot and free)
 */
function computeConstraints(joltageRequirements: number[], buttons: Button[]): number[] {
  return buttons.map((button) =>
    Math.min(...button.map((requirementIndex) => joltageRequirements[requirementIndex])),
  );
}

/**
 * Finds the free variables in a system of equations, given the number of variables and the list of pivot columns.
 *
 * @param numVars The number of variables in the system of equations (the number of buttons)
 * @param pivotColumns Array of indices corresponding to pivot columns in a previously calculated matrix in row echelon
 * form.
 * @returns An array of indices of the free variables in the system of equations (all the indices that are not in the
 * `pivotColumns` array from 0 to `numVars` exclusive)
 */
function findFreeVariables(numVars: number, pivotColumns: number[]): number[] {
  const freeVariables = [];

  // If the current variable's index is not in the array of pivot variables, that variable must be free
  for (let i = 0; i < numVars; i++) {
    if (!pivotColumns.includes(i)) freeVariables.push(i);
  }

  return freeVariables;
}

/**
 * Computes the greatest common divisor (GCD) of a list of numbers using the Euclidean algorithm.
 *
 * @param numbers A list of numbers to compute the GCD for
 * @returns The GCD of the given numbers
 */
function gcd(...numbers: number[]): number {
  if (numbers.length < 2) throw new Error('Need at least 2 values to calculate GCD!');

  // For every two adjacent numbers in the list, compute their GCD using the Euclidean algorithm, and replace the second
  // number with the computed GCD.
  for (let i = 0; i < numbers.length - 1; i++) {
    let a = Math.abs(numbers[i]);
    let b = Math.abs(numbers[i + 1]);

    while (b !== 0) {
      const temp = b;
      b = a % b;
      a = temp;
    }

    // Store the GCD in the second number's position
    numbers[i + 1] = a;
  }

  // After processing all numbers, the last number will be the GCD of all original numbers.
  return numbers[numbers.length - 1];
}

/**
 * Reduces a row in place by subtracting a scalar multiple of another row.
 *
 * `reducingRow` will be subtracted `factor` times from `rowToReduce`.
 *
 * @param rowToReduce - The row to be reduced
 * @param reducingRow - The reducing row
 * @param factor - The number of times by which to reduce the row
 */
function reduce(rowToReduce: number[], reducingRow: number[], factor: number): void {
  // For each element in the row, subtract the corresponding element in the reducing row multiplied by the given factor
  for (let i = 0; i < rowToReduce.length; i++) rowToReduce[i] -= factor * reducingRow[i];
}

/**
 * Scales a row in place by a given scalar.
 *
 * @param row The row to scale
 * @param s A scalar, factor by which to scale the row
 */
function scale(row: number[], s: number): void {
  // For each element in the row, multiply it by the given scalar
  for (let i = 0; i < row.length; i++) row[i] *= s;
}

/**
 * Swaps two rows in a given matrix in place, given the rows' indices.
 *
 * @param matrix An augmented matrix representing a system of equations
 * @param i Index of the first row to swap
 * @param j Index of the second row to swap
 */
function swap(matrix: number[][], i: number, j: number): void {
  // Swap rows i and j
  const temp = matrix[i];
  matrix[i] = matrix[j];
  matrix[j] = temp;
}

/**
 * Converts a matrix to row echelon form, modifying the matrix in place, and returns the indices of the pivot
 * columns.
 *
 * @example
 *
 * ```plain
 * Augmented matrix:
 * [ 1 1 1 0 | 10 ]
 * [ 1 0 1 1 | 11 ]
 * [ 1 0 1 1 | 11 ]
 * [ 1 1 0 0 | 5  ]
 * [ 1 1 1 0 | 10 ]
 * [ 0 0 1 0 | 5  ]
 *
 * Row echelon form matrix:
 * [ 1 1 1  0 | 10 ]
 * [ 0 1 0 -1 | -1 ]
 * [ 0 0 1  0 |  5 ]
 * [ 0 0 0  0 |  0 ]
 * [ 0 0 0  0 |  0 ]
 * [ 0 0 0  0 |  0 ]
 *
 * Pivot columns: [0,1,2]
 * ```
 *
 * @param matrix The matrix to reduce to row echelon form
 * @returns An array corresponding to the indices of the pivot columns of the matrix
 */
function convertToRowEchelonForm(matrix: number[][]): number[] {
  const numRows = matrix.length;
  const numCols = matrix[0].length;
  const numVars = numCols - 1; // Last column is the constants
  const pivotCols: number[] = [];

  // Gaussian elimination: forward elimination to convert to row echelon form
  let currentRow = 0;
  for (let col = 0; col < numVars && currentRow < numRows; col++) {
    let pivotRow = currentRow;

    // Search down the current column until we find a row with a non-zero element
    while (pivotRow < numRows && matrix[pivotRow][col] === 0) pivotRow++;

    // No non-zero element found, skip this column (will be a free variable)
    if (pivotRow === numRows) continue;

    // Swap the current row with the pivot row if it isn't already the pivot row
    if (currentRow !== pivotRow) swap(matrix, currentRow, pivotRow);

    // Record the current column as a pivot column
    pivotCols.push(col);

    // If the pivot is negative, make it positive by scaling the row by -1
    if (matrix[currentRow][col] < 0) scale(matrix[currentRow], -1);

    // Reduce every row below the pivot row to set all elements below the pivot value to zero
    for (let row = currentRow + 1; row < numRows; row++) {
      const factor = matrix[row][col];

      // Scale the row by the pivot value before reducing it to keep integer values when assigning values to parameters
      scale(matrix[row], matrix[currentRow][col]);

      // Reduce the current row using the pivot row
      reduce(matrix[row], matrix[currentRow], factor);

      // After reduction, simplify the row by dividing by the GCD of all its values to keep the numbers small
      const gcdRow = gcd(...matrix[row]);
      if (gcdRow > 1) scale(matrix[row], 1 / gcdRow);
    }

    currentRow++;
  }

  // Check if the system is inconsistent (has no solution)
  // (This should never happen, given the input of the challenge guarantees one or more solutions)
  for (let row = 0; row < numRows; row++) {
    if (matrix[row].slice(0, numVars).every((v) => v === 0) && matrix[row][numVars] !== 0)
      throw new Error(`No solution for matrix at row ${row}, 0 = ${matrix[row][numVars]} !`);
  }

  return pivotCols;
}

/**
 * Given a list of joltage requirements and a list of buttons, build an augmented matrix representing a system of
 * equations that models the problem for the current machine.
 *
 * Each button represents a parameter in the system whose value to determine. Each joltage requirement represents an
 * equation that depends on one or more parameters.
 *
 * @example
 *
 * ```plain
 * Joltage requirements: {10, 11, 11, 5, 10, 5}
 * Buttons: (0,1,2,3,4) (0,3,4) (0,1,2,4,5) (1,2)
 *
 * Equation: a * (0,1,2,3,4) + b * (0,3,4) + c * (0,1,2,4,5) + d * (1,2) = [10,11,11,5,10,5]
 *
 * System of equations:
 * { a + b + c + 0d = 10
 * { a + 0b + c + d = 11
 * { a + 0b + c + d = 11
 * { a + b + 0c + 0d = 5
 * { a + b + c + 0d = 10
 * { 0a + 0b + c + 0d = 5
 *
 * Augmented matrix:
 * [ 1 1 1 0 | 10 ]
 * [ 1 0 1 1 | 11 ]
 * [ 1 0 1 1 | 11 ]
 * [ 1 1 0 0 | 5  ]
 * [ 1 1 1 0 | 10 ]
 * [ 0 0 1 0 | 5  ]
 * ```
 *
 * @param joltageRequirements  The target joltage requirements. Array of numbers representing joltage level to meet
 * exactly.
 * @param buttons Array of array of numbers representing a list of buttons that will increase one or several joltage
 * counters. Each button is a list of indices of joltage counters.
 * @returns An augmented matrix representing a system of equations for the set of buttons and joltage requirements.
 */
function buildAugmentedMatrix(joltageRequirements: number[], buttons: Button[]): number[][] {
  const matrix = Array.from(joltageRequirements, () => Array(buttons.length + 1).fill(0));

  // For each button, set a 1 for each equation (each joltage requirement) where the button is used
  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];
    for (let j = 0; j < button.length; j++) {
      matrix[button[j]][i] = 1;
    }
  }

  // For each equation (each joltage requirement), set the constant value in the last column
  for (let i = 0; i < joltageRequirements.length; i++) {
    const requirement = joltageRequirements[i];
    matrix[i][buttons.length] = requirement;
  }

  return matrix;
}

/**
 * Given a list of joltage requirements and a list of buttons, computes the smallest combination of buttons
 * that, when pressed in sequence, will increase the joltage level counters to meet the joltage requirements.
 * (Multiple smallest solutions might exist.)
 *
 * Inspired by [this Reddit post][1] about augmented matrices and Gaussian elimination. Thanks also to these videos for
 * explaining the concepts used here:
 * - [The Row Reduction Algorithm (Linear Algebra)](https://youtu.be/f1e2Zij6W3s)
 * - [Basic Variables & Free Variables (Linear Algebra)](https://youtu.be/WhH660cLDkA)
 *
 * [1]: https://www.reddit.com/r/adventofcode/comments/1pp98cr/2025_day_10_part_2_solution_without_using_a_3rd/
 *
 * @param joltageRequirements  The target joltage requirements. Array of numbers representing joltage level to meet
 * exactly.
 * @param buttons Array of array of numbers representing a list of buttons that will increase one or several joltage
 * counters. Each button is a list of indices of joltage counters.
 * @returns The combination of buttons that, when pressed in sequence, will increase the joltage level counter to meet
 * the requirements. If no such combination exists, returns undefined.
 */
function findOptimalButtonCombination(joltageRequirements: number[], buttons: Button[]): Solution {
  // Each button represents a parameter in a system of equations
  const numVars = buttons.length;
  // Build a matrix representing a system of equations that models the problem to solve.
  // Each joltage requirement represents an equation (specifically, the constant, target value of that equation)
  const matrix: number[][] = buildAugmentedMatrix(joltageRequirements, buttons);

  console.log('Augmented matrix:');
  console.table(matrix);
  console.log();

  // Transform the matrix to row echelon form, and note the pivot variables and the free variables
  const pivotColumns = convertToRowEchelonForm(matrix);
  const freeVariables = findFreeVariables(numVars, pivotColumns);

  console.log('Reduced row echelon form matrix:');
  console.table(matrix);
  console.log();

  console.log('Pivot columns:', pivotColumns);
  console.log('Free variables:', freeVariables);
  console.log();

  // Determine the additional constraints (upper bounds) for the parameters of the system
  const constraints = computeConstraints(joltageRequirements, buttons);

  console.log('Constraints:', constraints);
  console.log();

  // Solve the system given the matrix in row echelon form, the free and the pivot variables, and the constraints
  const solution = computeBestSolution(matrix, pivotColumns, freeVariables, constraints, 0);

  console.log('Solution:');
  console.table(solution);

  console.log('Total number of button presses:', solution.totalPresses);
  console.log();

  return solution;
}

/**
 * Given a line from the input file, parses its contents into structured data: a light indicator diagram (as a boolean
 * array, unused in this part of the challenge), a list of buttons (array of array of joltage level counter indices),
 * and some joltage requirements (array of numbers).
 *
 * @param line Line from the input file
 * @returns The parsed contents from the given line
 */
function parseLine(line: string): MachineDiagram {
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

    console.log(`Joltage requirements: {${joltageRequirements.join(',')}}`);
    console.log(`Buttons: (${buttons.join(') (')})\n`);

    // Compute the correct combination of buttons to meet the joltage requirements
    const solution = findOptimalButtonCombination(joltageRequirements, buttons);

    sum += solution.totalPresses;
  }

  console.log(`Sum of lengths of correct combinations:`, sum);

  return sum;
}

function main() {
  const filePath = join(process.cwd(), 'assets/day10/input.txt');

  solveDay10Part2(filePath);
}

main();
