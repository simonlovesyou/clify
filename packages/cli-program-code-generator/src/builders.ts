import * as path from "path";
import dedent = require("dedent");
import { pipe, identity } from "fp-ts/lib/function";
import { Options, ParsedFunction, ParsedProgram } from ".";
import { JSONSchema7 } from "json-schema";
import { mergeDeepRight } from "ramda";
import type { Schema as CommandLineSchema } from "@cling/parser";
import { convertJSONSchemaToArgument } from "@cling/utils";

export const fileHeaders = (options: Options) => () =>
  ({
    ts: `#!/usr/bin/env ts-node`,
    js: `#!/usr/bin/env node`,
  }[options.typescript ? "ts" : "js"]);

const createCommandSchemaFromJSONSchema = (options: Options) => (
  jsonSchema: JSONSchema7
) => {
  return Object.entries(jsonSchema.properties).reduce(
    (acc: CommandLineSchema, [propertyName, property]): CommandLineSchema => {
      if (property === true || property === false) {
        throw new Error("Cannot parse property as boolean");
      }
      const requiredList = jsonSchema.required || [];
      const required = requiredList.includes(propertyName);
      if (property.type === "object") {
        const nestedSchema = createCommandSchemaFromJSONSchema(options)(
          property
        );

        if (options.positionals) {
          return {
            ...acc,
            positionals: [
              ...(acc.positionals || []),
              ...(nestedSchema.positionals || []),
            ],
            options: {
              ...(acc.options || {}),
              ...(nestedSchema.options || {}),
            },
          };
        }
        return mergeDeepRight(acc, {
          arguments: nestedSchema["arguments"] || {},
          options: nestedSchema.options || {},
        });
      }
      if (required) {
        if (options.positionals) {
          return {
            ...acc,
            positionals: [
              ...(acc.positionals || []),
              convertJSONSchemaToArgument(property),
            ],
          };
        }
        return mergeDeepRight(acc, {
          arguments: {
            [propertyName]: convertJSONSchemaToArgument(property),
          }
        });
      }
      return mergeDeepRight(acc, {
        options: {
          [propertyName]: convertJSONSchemaToArgument(property),
        }
      });
    },
    {}
  );
};

export const getCliProgramForProgram = (options: Options) => (
  parsedProgram: ParsedProgram
): string => {
  const parsedFunction = parsedProgram[0];

  const commandSchema = createCommandSchemaFromJSONSchema(options)(
    parsedProgram[0].schema
  );
  return dedent`
    const programSchema = ${JSON.stringify(commandSchema, null, 2).replace(
      /("type": "\w+")/g,
      "$1 as const"
    )}

    const { ${Object.keys(commandSchema).join(", ")} } = parser(programSchema);
    
    ${pipe(
      parsedFunction,
      () => getUserlandExecution(options)(parsedFunction, commandSchema),
      parsedFunction.async
        ? wrapCodeBlockWithIEAsyncFunction(options)
        : identity
    )}
  `;
};

export const getImports = (options: Options) => (
  parsedProgram: ParsedProgram
) => dedent`
  import parser from '@cling/parser'
  import { ${parsedProgram.map((parsedFunction) =>
    parsedFunction.defaultExport
      ? `default as ${parsedFunction.name}`
      : parsedFunction.name
  )} } from '${path.dirname(parsedProgram[0].filePath)}/${
  path.parse(parsedProgram[0].filePath).name
}'`;

type ArgumentPosition =
  | {
      type: "variable";
      parent: string;
      key: string;
    }
  | {
      type: "object";
      properties: ArgumentPosition[];
    };

const getArgumentPosition = (options: Options) => (
  jsonSchema: JSONSchema7,
  commandSchema: CommandLineSchema
): ArgumentPosition[] =>
  Object.entries(jsonSchema.properties).reduce(
    (acc, [propertyName, property], index) => {
      const requiredList = jsonSchema.required || [];
      const required = requiredList.includes(propertyName);
      if (property === true || property === false) {
        throw new Error("Cannot parse property as boolean");
      }
      if (property.type === "object") {
        return [
          ...acc,
          {
            type: "object",
            properties: getArgumentPosition(options)(property, commandSchema),
          },
        ];
      }
      if (required) {
        const objectPropertyName = options.positionals
          ? "positionals"
          : "arguments";
        const objectPropertyKey = options.positionals ? index : propertyName;
        return [
          ...acc,
          {
            type: "variable",
            parent: objectPropertyName,
            key: objectPropertyKey,
          },
        ];
      }
      return [
        ...acc,
        {
          type: "variable",
          parent: "options",
          key: propertyName,
        },
      ];
    },
    []
  );

export const getUserlandExecution = (options: Options) => (
  parsedFunction: ParsedFunction,
  commandSchema: CommandLineSchema
) => {
  const argumentPositions = getArgumentPosition(options)(
    parsedFunction.schema,
    commandSchema
  );

  return dedent`
  const result = ${parsedFunction.async ? "await" : ""} ${
    parsedFunction.name
  }.apply(null, [${argumentPositions
    .map((argumentPosition) => {
      if (argumentPosition.type === "variable") {
        return `${argumentPosition.parent}["${argumentPosition.key}"]`;
      }
      return `{
    ${argumentPosition.properties.map((nestedArgPosition) => {
      if (nestedArgPosition.type === "object") {
        throw new Error(
          "Cannot deal with nested objects atm. Please create an issue"
        );
      }
      return `["${nestedArgPosition.key}"]: ${nestedArgPosition.parent}["${nestedArgPosition.key}"]`;
    })}
  }`;
    })
    .join(",")}])

  console.log(result)
  return process.exit(0)
`;
};

export const wrapCodeExecutionWithErrorHandler = (options: Options) => (
  code: string
): string => dedent`
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
