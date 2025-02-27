import { tokenize, classifyToken } from "./classification.js";
import { storeHistory } from "../history_store.js";

// Helper function to calculate factorial (n!)
function factorial(n: number): number {
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

function log(n: number): number {
    if (n <= 0) throw new Error("Logarithm undefined for non-positive values.");
    return Math.log10(n);  // Logarithm base 10
}

// Track current mode (DEG or RAD)
let currentMode: "DEG" | "RAD" = "DEG";  // Default is DEG (degree)

// Function to get the current mode
function getCurrentMode(): "DEG" | "RAD" {
    const degButton = document.getElementById("deg-toggle");
    const radButton = document.getElementById("rad-toggle");
    
    if (degButton && degButton.innerHTML === "DEG") {
        currentMode = "DEG";
    } else if (radButton && radButton.innerHTML === "RAD") {
        currentMode = "RAD";
    }
    return currentMode;
}

// Helper function to convert degrees to radians
function degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

function evaluateFunction(fn: string, arg: number): number {
    const mode = getCurrentMode();
    
    if (mode === "DEG") {
        arg = degreesToRadians(arg);
    }
    switch (fn) {
        case "sin": return Math.sin(arg);
        case "cos": return Math.cos(arg);
        case "tan": return Math.tan(arg);
        case "sec": return 1 / Math.cos(arg);
        case "cot": return 1 / Math.tan(arg);
        case "ln": return Math.log(arg);
        case "sqrt": return Math.sqrt(arg);
        case "rand": return Math.random();
        case "ceil": return Math.ceil(arg);
        case "floor": return Math.floor(arg);
        case "abs": return Math.abs(arg);
        default: throw new Error(`Unknown function: ${fn}`);
    }
}
export function calculate(expression: string): number | string {
    try {
        if (!expression.trim()) throw new Error("Empty expression.");

        let tokens: string[] | null = tokenize(expression);
        if (!tokens) throw new Error("Invalid tokenization.");
        console.log(tokens);

        let stack: string[] = [];
        let outputQueue: (number | string)[] = [];
        let resultStack: number[] = [];

        const operators: Set<string> = new Set(["+", "-", "*", "/", "^", "%"]);
        const precedence: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2, "^": 3, "%": 2 };
        const functions: Set<string> = new Set(["sin", "cos", "tan", "sqrt", "rand", "ceil", "floor", "log", "ln", "abs"]);

        let previousToken: string | undefined = undefined;

        tokens.forEach(token => {
            const classifiedToken = classifyToken(token, previousToken);
            previousToken = token;

            if (classifiedToken.type === "Number") {
                outputQueue.push(parseFloat(classifiedToken.value));
            } else if (classifiedToken.type === "UnaryOperator") {
                // Handling unary operators like negation
                if (previousToken === undefined || operators.has(previousToken) || previousToken === "(") {
                    // This is a unary operator (e.g., -3, -(2+3))
                    outputQueue.push("NEG");
                }
            } else if (classifiedToken.type === "Operator") {
                while (
                    stack.length &&
                    operators.has(stack[stack.length - 1]) &&
                    precedence[stack[stack.length - 1]] >= precedence[classifiedToken.value]
                ) {
                    outputQueue.push(stack.pop() as string);
                }
                stack.push(classifiedToken.value);
            } else if (classifiedToken.type === "Factorial") {
                let number = outputQueue.pop() as number;
                outputQueue.push(factorial(number));
            } else if (functions.has(classifiedToken.value)) {
                stack.push(classifiedToken.value);
            } else if (classifiedToken.type === "Parenthesis") {
                if (classifiedToken.value === "(") {
                    stack.push("(");
                } else {
                    while (stack.length && stack[stack.length - 1] !== "(") {
                        outputQueue.push(stack.pop() as string);
                    }
                    stack.pop(); // Pop the '('
                    if (stack.length && functions.has(stack[stack.length - 1])) {
                        outputQueue.push(stack.pop() as string); // Move function to output queue
                    }
                }
            }
        });

        // Pop remaining operators from stack to outputQueue
        while (stack.length) {
            let poppedOperator = stack.pop();
            if (poppedOperator === "(") throw new Error("Mismatched parentheses.");
            outputQueue.push(poppedOperator as string);
        }

        console.log("Postfix Notation: ", outputQueue);

        // Evaluate Postfix Expression
        outputQueue.forEach(token => {
            if (typeof token === "number") {
                resultStack.push(token);
            } else if (token === "NEG") {
                let value = resultStack.pop() as number;
                resultStack.push(-value); // Apply negation
            } else if (operators.has(token as string)) {
                let b = resultStack.pop() as number;
                let a = resultStack.pop() as number;
                if (a === undefined || b === undefined) throw new Error("Invalid expression result.");
                switch (token) {
                    case "+": resultStack.push(a + b); break;
                    case "-": resultStack.push(a - b); break;
                    case "*": resultStack.push(a * b); break;
                    case "/": if (b === 0) throw new Error("Division by zero."); resultStack.push(a / b); break;
                    case "^": resultStack.push(Math.pow(a, b)); break;
                    case "%": resultStack.push(a % b); break;
                }
            } else if (functions.has(token as string)) {
                let arg = resultStack.pop() as number;
                resultStack.push(evaluateFunction(token as string, arg)); // Handle abs, sin, etc.
            }
        });

        if (resultStack.length !== 1) throw new Error("Invalid expression result.");

        const finalResult = resultStack[0]; // Final computed result
        storeHistory(new Date(), expression, finalResult.toString()); // Store in history
        return finalResult;
    } catch (error: any) {
        console.error("Error: ", error.message);
        return `Error: ${error.message}`;
    }
}
