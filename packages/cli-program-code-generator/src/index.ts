import parseProgram from "@clify/program-parser";
import {
  fileHeaders,
  getImports,
  getCliProgramForProgram,
  wrapCodeExecutionWithErrorHandler,
} from "./builders";
import { pipe } from "fp-ts/function";
import { format } from "prettier";

export type Options = {
  positionals?: boolean;
  typescript?: boolean;
  helpArgument?: boolean;
};

export type ParsedFunction = ReturnType<typeof parseProgram>[0];

export type ParsedProgram = ReturnType<typeof parseProgram>;

const createCli = (
  parsedProgram: ReturnType<typeof parseProgram>,
  options: Options
) => {
  return format(
    `
    ${fileHeaders(options)()}
    ${getImports(options)(parsedProgram)}

    ${pipe(
      parsedProgram,
      getCliProgramForProgram(options),
      wrapCodeExecutionWithErrorHandler(options)
    )}
  `.trim(),
    { parser: "typescript" }
  );
};

export default createCli;
