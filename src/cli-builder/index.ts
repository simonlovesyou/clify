import dedent = require("dedent");
import * as path from "path";
import { pipe, identity } from "fp-ts/lib/function";
import parseProgram from "../serializer";
import {
  fileHeaders,
  positionalValidation,
  getValidationMethod,
  getOptionDefinitions,
  getImports,
  getPositionalLengthValidator,
  getOptionsType,
  wrapCodeBlockWithIEAsyncFunction,
  wrapCodeExecutionWithErrorHandler,
  getUserlandExecution,
  getTypeValidationMethods,
  getUserLandOptions,
  getCliProgramForFunctionDeclaration,
  getCliProgramForProgram,
} from "./builders";

export type Options = {
  positionals: boolean;
  typescript: boolean;
  helpArgument: boolean;
};

export type ParsedFunction = ReturnType<typeof parseProgram>[0];

export type ParsedProgram = ReturnType<typeof parseProgram>;

const createCli = (
  parsedProgram: ReturnType<typeof parseProgram>,
  options: Options
) => {
  return dedent`
    ${fileHeaders(options)()}
    ${getImports(options)(parsedProgram)}
    ${
      /* getCliProgramForFunctionDeclaration(options)(parsedFunction) */ getCliProgramForProgram(
        options
      )(parsedProgram)
    }
  `;
};

export default createCli;
