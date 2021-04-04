import * as path from "path";
import dedent = require("dedent");
import { pipe, identity } from "fp-ts/lib/function";
import { Options, ParsedFunction, ParsedProgram } from ".";
import { getUniqueTypes } from "./utils";

export const fileHeaders = (options: Options) => () =>
  ({
    ts: `#!/usr/bin/env ts-node`,
    js: `#!/usr/bin/env node`,
  }[options.typescript ? "ts" : "js"]);

export const positionalValidation = (options: Options) => () => dedent`
  type ValidationFunction = (arg: unknown) => any

  const validatePositions = (validationFunctions: ValidationFunction[]) => {
    let count = 0;
    return (value: unknown): boolean => {
      console.log(value)
      const result = validationFunctions[count](value)
      count++
      return result
    };
  }
`;

const VALIDATION_METHODS = {
  number: {
    body: dedent`
      const parseNumber = (arg: unknown): number => {
        if (!isNaN(+arg)) {
          return Number(arg);
        }
        throw new Error(\`Argument \${arg} cannot be parsed as a number\`);
      };
    `,
    functionName: "parseNumber",
  },
  string: { body: "", functionName: "parseString" },
  any: { body: "", functionName: "parseAny" },
  boolean: { body: "", functionName: "parseBoolean" },
  undefined: { body: "", functionName: "parseUndefined" },
  null: { body: "", functionName: "parseNull" },
  something: {body: '', functionName: 'something'}
};

export const getValidationMethod = (options: Options) => (
  type: keyof typeof VALIDATION_METHODS
) => VALIDATION_METHODS[type];

export const getCliProgramForProgram = (options: Options) => (
  parsedProgram: ParsedProgram
) => dedent`
  const subCommandDefinition = [
    { name: 'command', defaultOption: true },
    ${options.helpArgument ? `{ name: 'help', type: Boolean }` : ""}
  ]

  const subCommandOptions = commandLineArgs(subCommandDefinition, { stopAtFirstUnknown: true })
  const argv = subCommandOptions._unknown || []

  ${parsedProgram.reduce(
    (acc, parsedFunction) =>
      acc +
      "\n" +
      dedent`
    if(subCommandOptions.command === '${parsedFunction.name}') {
      ${getCliProgramForFunctionDeclaration({ ...options, argv: "argv" })(
        parsedFunction
      )}
    }
  `,
    ""
  )}
`;

export const getTypeValidationMethods = (options: Options) => (
  parsedFunction: ParsedFunction
): string =>
  getUniqueTypes(parsedFunction).reduce(
    //@ts-ignore
    (acc, type) => acc + "\n" + getValidationMethod(options)(type).body,
    ""
  );

export const getUserLandOptions = (
  options: Options & { argv: string }
) => () => dedent`
  const options = commandLineArgs(optionDefinitions${
    options.argv ? `, { argv: ${options.argv} }` : ""
  }) as Options
`;

export const getCliProgramForFunctionDeclaration = (
  options: Options & { argv: string }
) => (parsedFunction: ParsedFunction) => dedent`
${getTypeValidationMethods(options)(parsedFunction)}
    ${options.positionals ? positionalValidation(options)() : ""}
    ${
      options.positionals
        ? getPositionalLengthValidator(options)(parsedFunction)
        : ""
    }
    ${getOptionDefinitions(options)(parsedFunction)}
    ${getOptionsType(options)(parsedFunction)}
    ${wrapCodeExecutionWithErrorHandler(options)(dedent`
      ${getUserLandOptions(options)()}
      ${
        options.positionals
          ? `validateNumberOfPositionals(options.positionals || []);`
          : ""
      }
      ${pipe(
        parsedFunction,
        getUserlandExecution(options),
        parsedFunction.async
          ? wrapCodeBlockWithIEAsyncFunction(options)
          : identity
      )}
    `)}
`;

export const getOptionDefinitions = (options: Options) => (
  parsedFunction: ParsedFunction
) => dedent`
  const optionDefinitions = [
    ${
      options.positionals
        ? `{ name: 'positionals', defaultOption: true, multiple: true, type: validatePositions([${parsedFunction.parameters
            //@ts-ignore
            .map(({ type }) => getValidationMethod(options)(type).functionName)
            .join(", ")}]) },`
        : ""
    }
    ${
      !options.positionals
        ? parsedFunction.parameters.map(
            ({ name, type }) =>
              `{ name: '${name}', type: ${
                // @ts-ignore
                getValidationMethod(options)(type).functionName
              } }`
          )
        : ""
    }
    ${options.helpArgument ? `{ name: 'help', alias: 'h', type: Boolean }` : ""}
  ]
`;

export const getImports = (options: Options) => (
  parsedProgram: ParsedProgram
) => dedent`
  import * as commandLineArgs from 'command-line-args'
  import * as commandLineUsage from 'command-line-usage'
  import { ${parsedProgram.map((parsedFunction) =>
    parsedFunction.defaultExport
      ? `default as ${parsedFunction.name}`
      : parsedFunction.name
  )} } from '${path.dirname(parsedProgram[0].filePath)}/${
  path.parse(parsedProgram[0].filePath).name
}'
`;

export const getPositionalLengthValidator = (options: Options) => (
  parsedFunction: ParsedFunction
) => dedent`
const validateNumberOfPositionals = (positionals: unknown[]) => {
  if(positionals.length !== ${parsedFunction.parameters.length}) {
    throw new Error('Lol')
  }
  return true
}
`;

export const getOptionsType = (options: Options) => (
  parsedFunction: ParsedFunction
) => dedent`
  type Options = {
    ${
      options.positionals
        ? `positionals: [${parsedFunction.parameters
            .map(({ type }) => type)
            .join(", ")}]`
        : parsedFunction.parameters.map(
            ({ name, type }) => `'${name}': ${type}\n`
          )
    }
    ${options.helpArgument ? `help?: boolean` : ""}
  }
`;

export const getUserlandExecution = (options: Options) => (
  parsedFunction: ParsedFunction
) => dedent`
  const result = ${parsedFunction.async ? "await" : ""} ${
  parsedFunction.name
}.apply(null, ${
  options.positionals
    ? "options.positionals"
    : `[${parsedFunction.parameters
        .map(({ name }) => `options['${name}']`)
        .join(", ")}]`
})
  console.log(result)
  process.exit(0)
`;

export const wrapCodeExecutionWithErrorHandler = (options: Options) => (
  code: string
) => dedent`
try {
  ${code}
} catch(error) {
  console.error(error.message)
  process.exit(1)
}
`;

export const wrapCodeBlockWithIEAsyncFunction = (options: Options) => (
  code: string
) => dedent`
  (async () => {
    ${code}
  })()
`;
