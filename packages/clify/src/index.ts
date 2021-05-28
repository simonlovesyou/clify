import parseProgram from "@clify/program-parser";
import cliCodeGenerator from "@clify/cli-program-code-generator";
import * as fs from "fs-extra";
import { resolve } from "path";

/**
 * The file we should use
 */
export type File = string;

export type Options = {
  /**
   * File where the CLI app should be outputted. If omitted it will be printed to stdout
   * @alias o
   */
  output?: string;
  /**
   * Compile a project given a valid configuration file.
   */
  project?: boolean;
  /**
   * Whether or not `--help, -h` should be automatically added
   */
  helpArgument?: boolean;
  /**
   * Whether or not argument names should be kebab cased
   */
  kebabCaseKeys?: boolean;
  /**
   * Arguments are passed in as positionals.
   * The argument can be a file path to a valid JSON configuration file, or a directory path to a directory containing a tsconfig.json file.
   */
  positionals?: boolean;
  /**
   * Arguments are passed in as positionals.
   * The argument can be a file path to a valid JSON configuration file, or a directory path to a directory containing a tsconfig.json file.
   */
  forceNamedCommands?: boolean;
  /**
   * Arguments must be named
   */
  namedArguments?: boolean;
  /**
   * Optional arguments in the typescript source file is required by the CLI app.
   */
  optionalArgsRequired?: boolean;
  /**
   * Allow unknown arguments
   */
  allowUnknownArguments?: boolean;
  /**
   * Output a warning to stderr when an unknown argument is passed in as argument
   */
  warnUnknownArguments?: boolean;
  /**
   * Specify the argument name of the options object
   */
  optionsArgumentsName?: boolean;
  /*
   * Whether or not the output CLI should be in typescript
   */
  typescript?: boolean;
};

export const clify = async (
  file: File,
  options: Options = {
    positionals: true,
    typescript: true,
    kebabCaseKeys: true,
    helpArgument: true,
  }
) => {
  const parsedProgram = parseProgram(resolve(file)).map((parsedFunction) => ({
    ...parsedFunction,
  }));

  const cli = cliCodeGenerator(parsedProgram, {
    positionals: options.positionals,
    typescript: options.typescript,
    helpArgument: options.helpArgument,
  });

  if (options.output) {
    try {
      await fs.outputFile(options.output, cli);
    } catch (error) {
      console.error(error.message);
      return process.exit(1);
    }
    return process.exit(0);
  }
  console.log(cli);
  debugger;
};

clify(process.argv[2], {
  positionals: true,
  typescript: true,
  kebabCaseKeys: true,
});

export default clify;
