import * as ts from "typescript";
import {
  JSONSchema7,
  JSONSchema7Definition,
  JSONSchema7TypeName,
} from "json-schema";
import * as tsj from "ts-json-schema-generator";
import dereference from 'json-schema-deref-sync'

const getJsonSchemaFromParameter = (
  functionDeclaration: ts.ArrowFunction | ts.FunctionDeclaration
): JSONSchema7 => {
  let functionName = ts.isFunctionDeclaration(functionDeclaration)
    ? functionDeclaration.name.getText()
    : (functionDeclaration.parent as ts.VariableDeclaration).name.getText();

  const config = {
    path: functionDeclaration.getSourceFile().fileName,
    tsconfig: "/Users/simon.johansson/repos/clify/packages/clify/tsconfig.json",
    type: `Parameters<typeof ${functionName}>`,
    jsDoc: 'extended' as const
  };
  console.log(dereference)
  const schema = dereference(tsj.createGenerator(config).createSchema(config.type))
  console.log(schema)
  const parameterSchema = schema.definitions[
    `Parameters<typeof ${functionName}>`
  ] as JSONSchema7;

  return {...parameterSchema, $schema: schema.$schema}
};

export default getJsonSchemaFromParameter;
