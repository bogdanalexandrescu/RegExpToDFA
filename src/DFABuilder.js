// helper, top element of an array w/o removing it
Array.prototype.peek = function() {
    return this[this.length - 1];
};

class DFABuilder {
    constructor(regex) {
        this.regex = regex;
        this.infixRegex = null;
        this.syntax_tree = null;
        /* followpos calculated for every id in the syntax tree */
        this.followpos = {};
        this.alphabet = [];
        /* the id of the leafs where a character appears; a character can appear multiple times*/
        this.alphabetIDs = {};
        this.DFATransitions = [];
        this.DFAStates = {};
        this.DFAFinalStates = [];
        this.DOTScript = null;
    }
}

DFABuilder.prototype.precedenceMap = {
    '(': 1,
    '|': 2, // alternate
    '+': 3, // concatenate
    '*': 4 // Kleene star
};

DFABuilder.prototype.operands = '()+|*';

/**
 * Check if an element is an object or not
 * @param {*} element
 */
DFABuilder.prototype.isObject = function(element) {
    if (typeof element === 'object' && element !== null) {
        return true;
    }
    return false;
};

/**
 * @param {String} char
 * @param {number} id
 */
DFABuilder.prototype.buildAlphabet = function(char, id) {
    if (this.alphabet.includes(char)) {
        this.alphabetIDs[char].push(id);
    } else {
        this.alphabet.push(char);
        this.alphabetIDs[char] = [id];
    }
};

/**
 * Check if two arrays are equal
 * @param {Array} array1
 * @param {Array} array2
 */
DFABuilder.prototype.areArraysEqual = function(array1, array2) {
    let array1Length = array1.length;
    if (array1Length !== array2.length) return false;

    for (let i = array1Length - 1; i >= 0; i--) {
        if (array1[i] !== array2[i]) return false;
    }

    return true;
};
/**
 * Add explicit concatenation in a regex as a '+'
 */
DFABuilder.prototype.processRegex = function() {
    const operands = this.operands;
    let processedRegex = this.regex;

    for (let i = 0; i < processedRegex.length - 1; i++) {
        if (
            (operands.indexOf(processedRegex[i]) === -1 &&
                (operands.indexOf(processedRegex[i + 1]) === -1 ||
                    processedRegex[i + 1] === '(')) ||
            (processedRegex[i] === ')' &&
                operands.indexOf(processedRegex[i + 1]) === -1) ||
            (processedRegex[i] === '*' &&
                (operands.indexOf(processedRegex[i + 1]) === -1 ||
                    processedRegex[i + 1] === '('))
        ) {
            processedRegex =
                processedRegex.substring(0, i + 1) +
                '+' +
                processedRegex.substring(i + 1);
            i = i + 1;
        }
    }

    //add #
    processedRegex = '(' + processedRegex + ')+#';

    this.regex = processedRegex;
};

/**
 * Get precedence of a character from the RegExp
 * @param {String} character
 */
DFABuilder.prototype.precedenceOf = function(character) {
    return this.precedenceMap[character] || 99;
};

/**
 * Transform the RegExp from postfix to infix form
 */
DFABuilder.prototype.infixToPostfixRe = function() {
    const stack = [];
    let infixRegex = [];
    let regex = this.regex;

    for (let k = 0; k < regex.length; k++) {
        // current char
        var c = regex[k];

        if (c == '(') {
            stack.push(c);
        } else if (c == ')') {
            while (stack.peek() != '(') {
                infixRegex.push(stack.pop());
            }
            // pop '('
            stack.pop();
        }
        // else work with the stack
        else {
            while (stack.length) {
                let peekedChar = stack.peek();

                let peekedCharPrecedence = this.precedenceOf(peekedChar);
                let currentCharPrecedence = this.precedenceOf(c);

                if (peekedCharPrecedence >= currentCharPrecedence) {
                    infixRegex.push(stack.pop());
                } else {
                    break;
                }
            }
            stack.push(c);
        }
    }

    while (stack.length) {
        infixRegex.push(stack.pop());
    }

    infixRegex = infixRegex.join('');

    //console.log(regex, "=>", infixRegex);

    this.infixRegex = infixRegex;
};

/**
 * Create the syntax tree from the infix RegExp
 */
DFABuilder.prototype.createSyntaxTree = function() {
    const stack = [];
    const operands = this.operands;
    let infixRegex = this.infixRegex;
    let idCount = 1;

    for (let i = 0; i < infixRegex.length; i++) {
        let currentChar = infixRegex[i];
        if (operands.indexOf(currentChar) === -1) {
            stack.push(currentChar);
        } else if (currentChar === '+' || currentChar === '|') {
            let peek = stack.pop();
            let peek2 = stack.pop();
            let node1;
            let node2;
            if (!this.isObject(peek2)) {
                node1 = new Leaf(peek2, idCount);
                this.buildAlphabet(peek2, idCount);
                idCount += 1;
            } else {
                node1 = peek2;
            }

            if (!this.isObject(peek)) {
                node2 = new Leaf(peek, idCount);
                this.buildAlphabet(peek, idCount);
                idCount += 1;
            } else {
                node2 = peek;
            }

            let newNode;
            if (currentChar === '+') {
                newNode = new Cat(node1, node2);
                let leftLastpos = node1.lastpos();
                let rightFirstpos = node2.lastpos();
                const callback = function(element) {
                    if (this.followpos[element]) {
                        this.followpos[element] = this.followpos[
                            element
                        ].concat(rightFirstpos);
                    } else {
                        this.followpos[element] = rightFirstpos;
                    }
                }.bind(this);

                leftLastpos.forEach(callback);
            } else {
                newNode = new OR(node1, node2);
            }

            stack.push(newNode);
        } else {
            let peek = stack.pop();
            let node;
            if (!this.isObject(peek)) {
                node = new Leaf(peek, idCount);
                this.buildAlphabet(peek, idCount);
                idCount += 1;
            } else {
                node = peek;
            }

            let newNode = new Star(node);

            stack.push(newNode);

            let nodeLastpos = node.lastpos();
            let nodeFirstpos = node.firstpos();

            const callback = function(element) {
                if (this.followpos[element]) {
                    this.followpos[element] = this.followpos[element].concat(
                        nodeFirstpos
                    );
                } else {
                    this.followpos[element] = nodeFirstpos;
                }
            }.bind(this);

            nodeLastpos.forEach(callback);
        }
    }

    this.syntax_tree = stack.pop();
};

DFABuilder.prototype.buildDFAFromSyntaxTree = function() {
    this.DFAStates[1] = this.syntax_tree.firstpos();
    if (this.DFAStates[1].includes(this.alphabetIDs['#'][0])) {
        this.DFAFinalStates.push(1);
    }
    let unmarkedStates = [1];

    while (unmarkedStates.peek()) {
        let currentState = unmarkedStates.pop();

        for (let i = 0; i < this.alphabet.length; i++) {
            let alphabetElem = this.alphabet[i];
            if (alphabetElem != '#') {
                let union = [];
                let elementAlphabetIDs = this.alphabetIDs[alphabetElem];
                for (let j = 0; j < elementAlphabetIDs.length; j++) {
                    let ID = elementAlphabetIDs[j];
                    if (this.DFAStates[currentState].includes(ID)) {
                        let left = new Set(union);
                        let right = new Set(this.followpos[ID]);
                        union = Array.from(new Set([...left, ...right]));
                    }
                }

                if (union.length === 0) {
                    continue;
                }

                if (
                    !Object.values(this.DFAStates).some(array =>
                        this.areArraysEqual(array, union)
                    )
                ) {
                    let newState =
                        parseInt(Object.keys(this.DFAStates).peek()) + 1;
                    this.DFAStates[newState] = union;
                    unmarkedStates.push(newState);

                    if (
                        this.DFAStates[newState].includes(
                            this.alphabetIDs['#'][0]
                        )
                    ) {
                        this.DFAFinalStates.push(newState);
                    }

                    this.DFATransitions.push({
                        from: currentState,
                        to: newState,
                        label: alphabetElem
                    });
                } else {
                    let existingState = Object.keys(this.DFAStates).find(key =>
                        this.areArraysEqual(this.DFAStates[key], union)
                    );
                    existingState = parseInt(existingState);
                    this.DFATransitions.push({
                        from: currentState,
                        to: existingState,
                        label: alphabetElem
                    });
                }
            }
        }
    }
};

/**
 * Build DOT Language script
 */
DFABuilder.prototype.buildDOTScript = function() {
    this.DOTScript = 'digraph { \nrankdir = LR;\n';

    //add final states
    this.DOTScript += 'node[shape=doublecircle];';
    this.DFAFinalStates.forEach(state => (this.DOTScript += state + ';'));
    this.DOTScript += '\n';

    //add start state
    this.DOTScript += 'node[shape=circle];1;\n';
    this.DOTScript += 'node[shape=plaintext];\n';
    this.DOTScript += '"" -> 1 [label="start"];\n';

    //add the other nodes
    this.DOTScript += 'node[shape=circle];\n';
    this.DFATransitions.forEach(
        transition =>
            (this.DOTScript +=
                transition['from'] +
                '->' +
                transition['to'] +
                '[label=' +
                transition['label'] +
                '];\n')
    );

    this.DOTScript += '}';
};

DFABuilder.prototype.build = function() {
    this.processRegex();
    this.infixToPostfixRe();
    this.createSyntaxTree();
    this.buildDFAFromSyntaxTree();
    this.buildDOTScript();
};
