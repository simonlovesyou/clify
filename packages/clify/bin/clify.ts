#!/usr/bin/env ts-node
import cling from "@cling/cling";
import { clify } from "../src/index";

try {
  const programSchema = {
    positionals: [
      {
        type: "string",
        description: "The file we should use",
      },
      {
        type: "boolean",
        description: "Whether or not argument names should be kebab cased",
      },
    ],
    options: {
      output: {
        type: "string",
        alias: 'output',
        description:
          "File where the CLI app should be outputted. If omitted it will be printed to stdout",
      },
      project: {
        type: "boolean",
        description: "Compile a project given a valid configuration file.",
      },
      helpArgument: {
        type: "boolean",
        description:
          "Whether or not `--help, -h` should be automatically added",
      },
      positionals: {
        type: "boolean",
        description:
          "Arguments are passed in as positionals. The argument can be a file path to a valid JSON configuration file, or a directory path to a directory containing a tsconfig.json file.",
      },
      forceNamedCommands: {
        type: "boolean",
        description:
          "Arguments are passed in as positionals. The argument can be a file path to a valid JSON configuration file, or a directory path to a directory containing a tsconfig.json file.",
      },
      namedArguments: {
        type: "boolean",
        description: "Arguments must be named",
      },
      optionalArgsRequired: {
        type: "boolean",
        description:
          "Optional arguments in the typescript source file is required by the CLI app.",
      },
      allowUnknownArguments: {
        type: "boolean",
        description: "Allow unknown arguments",
      },
      warnUnknownArguments: {
        type: "boolean",
        description:
          "Output a warning to stderr when an unknown argument is passed in as argument",
      },
      optionsArgumentsName: {
        type: "boolean",
        description: "Specify the argument name of the options object",
      },
      typescript: {
        type: "boolean",
      },
    },
  } as const;

  const { positionals, options } = cling(programSchema, {});

  (async () => {
    const result = await clify.apply(null, [
      positionals["0"],
      {
        ["output"]: options["output"],
        ["project"]: options["project"],
        ["helpArgument"]: options["helpArgument"],
        ["3"]: positionals["3"],
        ["positionals"]: options["positionals"],
        ["forceNamedCommands"]: options["forceNamedCommands"],
        ["namedArguments"]: options["namedArguments"],
        ["optionalArgsRequired"]: options["optionalArgsRequired"],
        ["allowUnknownArguments"]: options["allowUnknownArguments"],
        ["warnUnknownArguments"]: options["warnUnknownArguments"],
        ["optionsArgumentsName"]: options["optionsArgumentsName"],
        ["typescript"]: options["typescript"],
      },
    ]);

    console.log(result);
    return process.exit(0);
  })();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}