# clify

Automagically generate a CLI for your typescript project.

## Installation

## Usage

Execute clify in your terminal and point to a typescript file and specify where it should output your app using the `--output` flag.

### Example
```ts
// add.ts
/**
 * Add two numbers together.
 */
export default function add(numberA: number, numberB: number) { 
  return numberA + numberB 
}
```
And in your terminal:
```
yarn clify ./add.ts --output bin/add.js
```

You can then run your CLI app using `ts-node`:
```bash
ts-node bin/add.js 20 4
> 24
ts-node bin/add.js --numberA 40 --numberB 2
> 42
ts-node bin/add.js --help
> Usage: add <number> <number>
> Options:
> --help, -h
```

#### Multiple commands

```ts
// math.ts
export const add = (numberA: number, numberB: number) => numberA + numberB

export const subtract = (numberA: number, numberB: number) => numberA - numberB
```

```bash
npx clify ./math.ts --emit bin/add.js
ts-node bin/add.js add 20 4
> 24
ts-node bin/add.js subtract --numberA 40 --numberB 2
> 38
```

## Configuration
### CLI API
```
clify <sourceFile> [options]

Options:
  -h, --help
  --output                    File where the CLI app should be outputted. If omitted it will be printed to stdout
  --project                   Compile a project given a valid configuration file.
The argument can be a file path to a valid JSON configuration file, or a directory path to a directory containing a tsconfig.json file.
See tsconfig.json documentation for more details.
  --positionals               Arguments are passed in as positionals. [default=true]
  --named-arguments           Arguments must be named
  --optional-args-required    Optional arguments in the typescript source file is required by the      
  --allow-unknown-arguments   Allow unknown arguments
  --warn-unknown-arguments    Output to stderr when an unknown argument is passed in as argument
  --options-arguments-name    Specify the argument name of the options object

```
## Clify Config Reference
