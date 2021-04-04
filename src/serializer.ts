import * as ts from "typescript";

function isNodeExported(node: ts.Node): boolean {
  return (
    (ts.getCombinedModifierFlags(node as ts.Declaration) &
      ts.ModifierFlags.Export) !==
      0 ||
    (!!node.parent && node.parent.kind === ts.SyntaxKind.SourceFile)
  );
}

const isJSDocTagName = (tagName: string) => (jsDocTag: ts.JSDocTag) =>
  jsDocTag.tagName.escapedText === tagName;

type Type = string | Record<string, string>;

const getType = (
  type: ts.TypeNode,
  checker: ts.TypeChecker
): Type | Record<string, Type> => {
  if (!type) {
    return "any";
  }
  if (ts.isTypeReferenceNode(type)) {
    const typel = checker.getTypeAtLocation(type);
    debugger;
    console.log();
    return "something";
    throw new Error("isTypeReferenceNode");
  }
  if (ts.isTypeLiteralNode(type)) {
    return type.members.reduce(
      (acc, member) => ({
        ...acc,
        [member.name.getText()]: ts.isPropertySignature(member)
          ? getType(member.type, checker)
          : "any",
      }),
      {}
    );
  }
  if (ts.SyntaxKind.NumberKeyword === type.kind) {
    return "number";
  }
  if (ts.SyntaxKind.StringKeyword === type.kind) {
    return "string";
  }
  if (ts.SyntaxKind.AnyKeyword === type.kind) {
    return "any";
  }
  if (ts.SyntaxKind.BooleanKeyword === type.kind) {
    return "boolean";
  }
  if (ts.SyntaxKind.UndefinedKeyword === type.kind) {
    return "undefined";
  }
  if (ts.SyntaxKind.NullKeyword === type.kind) {
    return "null";
  }
};

const declarationHasModifier = (
  modifierKind: Partial<ts.ModifierSyntaxKind>
) => (declaration: ts.Declaration) =>
  Boolean(
    Array.from(declaration.modifiers || []).find(
      (modifier) => modifier.kind === modifierKind
    )
  );

const isDeclarationExported = declarationHasModifier(
  ts.SyntaxKind.ExportKeyword
);

const isFunctionAsynchronous = declarationHasModifier(
  ts.SyntaxKind.AsyncKeyword
);

const parseParameter = (parameter: ts.ParameterDeclaration, checker: ts.TypeChecker) => {

  const parent = parameter.parent

  const jsDocTags = ts.getJSDocTags(parent);

  return {
    name: parameter.name.getText(),
    optional: Boolean(parameter.questionToken),
    type: ts.isTypeLiteralNode(parameter.type) ? parameter.type.members.map(member => parseParameter(member, checker)),
    description: jsDocTags.filter(ts.isJSDocParameterTag).find((jsDocTag) => {
      return jsDocTag.name.getText() === parameter.name.getText();
    })?.comment,
  };
};

const createFunctionDeclarationParser = (checker: ts.TypeChecker) => {
  return (functionDeclaration: ts.FunctionDeclaration | ts.ArrowFunction) => {
    const signature = checker.getSignatureFromDeclaration(functionDeclaration);
    // Assuming that there's only one comment. Will probably bite me in the ass later.
    const comment = signature.getDocumentationComment(checker)[0];

    const jsDocTags = ts.getJSDocTags(functionDeclaration);
    const name = ts.isFunctionDeclaration(functionDeclaration)
      ? functionDeclaration.name.text
      : (functionDeclaration.parent as ts.VariableDeclaration).name.getText();
    const parameters = functionDeclaration.parameters.map((parameter) => ({
      name: parameter.name.getText(),
      optional: Boolean(parameter.questionToken),
      type: getType(parameter.type, checker) as ReturnType<typeof getType>,
      description: jsDocTags.filter(ts.isJSDocParameterTag).find((jsDocTag) => {
        return jsDocTag.name.getText() === parameter.name.getText();
      })?.comment,
    }));
    debugger;
    return {
      name,
      parameters,
      async: isFunctionAsynchronous(functionDeclaration),
      filePath: functionDeclaration.getSourceFile().fileName,
      exported: isDeclarationExported(functionDeclaration),
      defaultExport: declarationHasModifier(ts.SyntaxKind.DefaultKeyword)(
        functionDeclaration
      ),
      internal: Boolean(jsDocTags.find(isJSDocTagName("internal"))),
      public: Boolean(jsDocTags.find(isJSDocTagName("public"))),
      description:
        // If there's both a description at the beginning of a JSDoc comment and a
        // description provided with the @description tag, the description specified
        // with the @description will override the description at the beginning of the comment.
        jsDocTags.find(isJSDocTagName("description"))?.comment || comment,
    };
  };
};

const parseProgram = (file: string) => {
  const program = ts.createProgram([file], {
    setParentNodes: true,
  });
  const checker = program.getTypeChecker();

  const collection: ReturnType<
    ReturnType<typeof createFunctionDeclarationParser>
  >[] = [];

  const shallowVisitor = (node: ts.Node) => {
    if (!isNodeExported(node)) {
      return;
    }
    const sourceFile = node.getSourceFile();
    if (sourceFile.fileName === file) {
      if (
        ts.isVariableDeclaration(node) &&
        ts.isArrowFunction(node.initializer)
      ) {
        debugger;
        const result = createFunctionDeclarationParser(checker)(
          node.initializer
        );
        collection.push(result);
      } else if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node)) {
        debugger;
        const result = createFunctionDeclarationParser(checker)(node);
        collection.push(result);
      }
    }
    ts.forEachChild(node, shallowVisitor);
  };
  // Visit every sourceFile in the program
  for (const sourceFile of program.getSourceFiles()) {
    if (!sourceFile.isDeclarationFile) {
      // Walk the tree to search for classes
      ts.forEachChild(sourceFile, shallowVisitor);
    }
  }
  return collection;
};

export default parseProgram;
