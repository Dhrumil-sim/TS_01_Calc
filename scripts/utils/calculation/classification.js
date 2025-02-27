// Tokenizer: Splitting the expression into tokens
export function tokenize(expression) {
    const regex = /\d+(\.\d+)?|[a-zA-Z]+|[+\-*\/^()|]|[^a-zA-Z0-9\s]|\b(sin|cos|tan|sec|csc|cot|log|ln|sqrt|rand|ceil|floor|abs)\b/g;
    return expression.match(regex);
}
// Function to classify each token
export function classifyToken(token, previousToken) {
    if (/\d+(\.\d+)?/.test(token)) {
        return { type: 'Number', value: token };
    }
    const trigFunctions = ['sin', 'cos', 'tan', 'cot', 'sec', 'csc'];
    if (trigFunctions.includes(token)) {
        return { type: 'TrigonometricFunction', value: token };
    }
    if (['+', '*', '/', '^', '%'].includes(token)) {
        return { type: 'Operator', value: token };
    }
    if (token === '-') {
        // Handle consecutive minus signs
        if (!previousToken || ['+', '-', '*', '/', '^', '(', '%'].includes(previousToken)) {
            // Treat `--` as addition or as a unary plus
            return { type: 'UnaryOperator', value: '+' }; // Treat `--` as `+`
        } else {
            return { type: 'UnaryOperator', value: '-' }; // Normal subtraction
        }
    }
    if (['(', ')'].includes(token)) {
        return { type: 'Parenthesis', value: token };
    }
    if (token === '|') {
        if (!previousToken || previousToken === '(' || ['+', '-', '*', '/', '^', '%'].includes(previousToken)) {
            return { type: 'ModulusOpen', value: token };
        }
        else {
            return { type: 'ModulusClose', value: token };
        }
    }
    if (token === '√') {
        return { type: 'Root', value: token };
    }
    if (token === '!') {
        return { type: 'Factorial', value: token };
    }
    if (token === 'log') {
        return { type: 'Log', value: token };
    }
    if (token === 'ln') {
        return { type: 'Ln', value: token };
    }
    if (['rand', 'ceil', 'floor', 'abs'].includes(token)) {
        return { type: 'MathFunction', value: token };
    }
    throw new Error(`Unknown token: ${token}`);
}
export function processExpression(expression) {
    const tokens = tokenize(expression);
    let previousToken = undefined;
    if (tokens) {
        try {
            tokens.forEach(token => {
                const classifiedToken = classifyToken(token, previousToken);
                console.log(`${classifiedToken.type}: ${classifiedToken.value}`);
                previousToken = token;
            });
        }
        catch (error) {
            const errorMessage = error.message;
            console.error(errorMessage);
        }
    }
    else {
        console.log("Invalid expression.");
    }
}
