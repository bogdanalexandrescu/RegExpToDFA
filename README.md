# RegExpToDFA

A little program that transform a regular expression into a DFA by Direct Method. The program builds the DFA by following the next steps:

The regular expression must be in infix form with alphanumeric characters and '(', ')', '|' and '*' as metacharacters. The input regular expression must be correc formed.
The regular expression is transformed into infix form. The concatenation will me marked with '+'(because '+' is not used as a metacharacter).
The syntax tree is build from the infix regular expression.
The DFA states are build following the rules of direct method transformation(using nullable, firstpos, lastpos, followpos)
The DOTScript is build from the DFA's states in order to show the DFA using Viz.js(https://github.com/mdaines/viz.js)
