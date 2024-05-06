import assert from "node:assert/strict";

import { minimatch } from "minimatch";
import ts from "typescript";

import { type TypeDeclarationSpecifier } from "./types";

/**
 * Test if the type matches the given specifier.
 */
export function typeMatchesSpecifier(
  program: ts.Program,
  specifier: Readonly<TypeDeclarationSpecifier>,
  type: Readonly<ts.Type>,
): boolean {
  const declarationFiles = getDeclarationFiles(type);

  switch (specifier.from) {
    case "file": {
      return isTypeDeclaredInLocalFile(
        program,
        declarationFiles,
        specifier.path,
      );
    }

    case "lib": {
      return isTypeDeclaredInDefaultLib(program, declarationFiles);
    }

    case "package": {
      return isTypeDeclaredInPackage(
        program,
        declarationFiles,
        specifier.package,
      );
    }
    default: {
      assert.fail();
    }
  }
}

/**
 * Get the source files that declare the type.
 */
function getDeclarationFiles(type: Readonly<ts.Type>) {
  return (
    type
      .getSymbol()
      ?.getDeclarations()
      ?.map((declaration) => declaration.getSourceFile()) ?? []
  );
}

/**
 * Test if the type is declared in a TypeScript default lib.
 */
function isTypeDeclaredInDefaultLib(
  program: ts.Program,
  declarationFiles: ReadonlyArray<ts.SourceFile>,
): boolean {
  // Intrinsic type (i.e. string, number, boolean, etc).
  if (declarationFiles.length === 0) {
    return true;
  }
  return declarationFiles.some((declaration) =>
    program.isSourceFileDefaultLibrary(declaration),
  );
}

/**
 * Test if the type is declared in a TypeScript package.
 */
function isTypeDeclaredInPackage(
  program: ts.Program,
  declarationFiles: ReadonlyArray<ts.SourceFile>,
  packageName?: string,
): boolean {
  // Handle scoped packages - if the name starts with @, remove it and replace / with __
  const typesPackageName = packageName?.replace(/^@([^/]+)\//u, "$1__");

  const matcher =
    packageName === undefined
      ? undefined
      : (assert(typesPackageName !== undefined),
        new RegExp(`${packageName}|${typesPackageName}`, "u"));

  return declarationFiles.some((declaration) => {
    const packageIdName = program.sourceFileToPackageName.get(declaration.path);
    return (
      packageIdName !== undefined &&
      (matcher === undefined || matcher.test(packageIdName)) &&
      program.isSourceFileFromExternalLibrary(declaration)
    );
  });
}

/**
 * Test if the type is declared in a local file.
 */
function isTypeDeclaredInLocalFile(
  program: ts.Program,
  declarationFiles: ReadonlyArray<ts.SourceFile>,
  globPattern?: string,
): boolean {
  const cwd = program.getCurrentDirectory();
  const typeRoots = ts.getEffectiveTypeRoots(
    program.getCompilerOptions(),
    program,
  );

  // Filter out type roots.
  const filteredDeclarationFiles =
    typeRoots === undefined
      ? declarationFiles
      : declarationFiles.filter(
          (declaration) =>
            !typeRoots.some((typeRoot) =>
              declaration.path.startsWith(typeRoot),
            ),
        );

  if (globPattern === undefined) {
    return filteredDeclarationFiles.some(
      (declaration) => !declaration.path.includes("/node_modules/"),
    );
  }

  return filteredDeclarationFiles.some(
    (declaration) =>
      declaration.path.startsWith(cwd) &&
      minimatch(declaration.path, globPattern),
  );
}
