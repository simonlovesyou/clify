import * as ts from "typescript";
import getJsonSchemaForFunction from "./getJsonSchemaForFunction";
import * as path from "path";

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

const createFunctionDeclarationParser = (checker: ts.TypeChecker) => {
  return (functionDeclaration: ts.FunctionDeclaration | ts.ArrowFunction) => {
    const signature = checker.getSignatureFromDeclaration(functionDeclaration);
    if (!signature) {
      throw new Error(
        "Could not find function signature from function declaration"
      );
    }
    // Assuming that there's only one comment. Will probably bite me in the ass later.
    const comment = signature.getDocumentationComment(checker)[0];

    const jsDocTags = ts.getJSDocTags(functionDeclaration);
    const name = ts.isFunctionDeclaration(functionDeclaration)
      ? functionDeclaration.name?.getText()
      : (functionDeclaration.parent as ts.VariableDeclaration).name.getText() ||
        "anonymous";
    const schema = getJsonSchemaForFunction(functionDeclaration);
    return {
      name,
      schema,
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

const parseFile = (file: string) => {
  const program = ts.createProgram([path.resolve(file)], {
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
    if (path.resolve(sourceFile.fileName) === path.resolve(file)) {
      if (
        ts.isVariableDeclaration(node) &&
        node.initializer &&
        ts.isArrowFunction(node.initializer)
      ) {
        const result = createFunctionDeclarationParser(checker)(
          node.initializer
        );
        collection.push(result);
      } else if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node)) {
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

export default parseFile;
