import assert from "node:assert/strict";
import * as path from "node:path";

import { minimatch } from "minimatch";
import ts from "typescript";

import type { TypeDeclarationSpecifier } from "./types";

/**
 * Test if the type matches the given specifier.
 */
export function typeMatchesSpecifier(
  program: ts.Program,
  specifier: Readonly<TypeDeclarationSpecifier>,
  type: Readonly<ts.Type>,
): boolean {
  const [declarations, declarationFiles] = getDeclarations(type);

  switch (specifier.from) {
    case "lib": {
      return isTypeDeclaredInDefaultLib(program, declarationFiles);
    }

    case "package": {
      return (
        isTypeDeclaredInPackage(program, declarations, declarationFiles, specifier.package) &&
        !isTypeDeclaredInDefaultLib(program, declarationFiles)
      );
    }

    case "file": {
      return (
        isTypeDeclaredInLocalFile(program, declarationFiles, specifier.path) &&
        !isTypeDeclaredInDefaultLib(program, declarationFiles) &&
        !isTypeDeclaredInPackage(program, declarations, declarationFiles)
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
function getDeclarations(type: Readonly<ts.Type>): [ts.Declaration[], ts.SourceFile[]] {
  const declarations = type.getSymbol()?.getDeclarations() ?? [];
  const declarationFiles = declarations.map((declaration) => declaration.getSourceFile());

  return [declarations, declarationFiles];
}

/**
 * Test if the type is declared in a TypeScript default lib.
 */
function isTypeDeclaredInDefaultLib(program: ts.Program, declarationFiles: ReadonlyArray<ts.SourceFile>): boolean {
  // Intrinsic type (i.e. string, number, boolean, etc).
  if (declarationFiles.length === 0) {
    return true;
  }
  return declarationFiles.some((declaration) => program.isSourceFileDefaultLibrary(declaration));
}

/**
 * Test if the type is declared in a package.
 */
function isTypeDeclaredInPackage(
  program: ts.Program,
  declarations: Readonly<ts.Node[]>,
  declarationFiles: Readonly<ts.SourceFile[]>,
  packageName?: string,
): boolean {
  return (
    isTypeDeclaredInDeclareModule(declarations, packageName) ||
    isTypeDeclaredInPackageDeclarationFile(program, declarationFiles, packageName)
  );
}

/**
 * Test if the type is declared in a declare module.
 */
function isTypeDeclaredInDeclareModule(declarations: Readonly<ts.Node[]>, packageName?: string): boolean {
  return declarations.some((declaration) => {
    const moduleDeclaration = findParentModuleDeclaration(declaration);
    return (
      moduleDeclaration !== undefined && (packageName === undefined || moduleDeclaration.name.text === packageName)
    );
  });
}

/**
 * Test if the type is declared in a TypeScript Declaration file of a package.
 */
function isTypeDeclaredInPackageDeclarationFile(
  program: ts.Program,
  declarationFiles: ReadonlyArray<ts.SourceFile>,
  packageName?: string,
): boolean {
  // Handle scoped packages - if the name starts with @, remove it and replace / with __
  const typesPackageName = packageName?.replace(/^@([^/]+)\//u, "$1__");

  const matcher =
    packageName === undefined
      ? undefined
      : (assert(typesPackageName !== undefined), new RegExp(`${packageName}|${typesPackageName}`, "u"));

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
  const typeRoots = ts.getEffectiveTypeRoots(program.getCompilerOptions(), program);

  // Filter out type roots.
  const filteredDeclarationFiles =
    typeRoots === undefined
      ? declarationFiles
      : declarationFiles.filter((declaration) => !typeRoots.some((typeRoot) => declaration.path.startsWith(typeRoot)));

  if (globPattern === undefined) {
    return filteredDeclarationFiles.some((declaration) => !declaration.path.includes("/node_modules/"));
  }

  return filteredDeclarationFiles.some((declaration) => {
    const canonicalPath = getCanonicalFilePath(declaration.path);
    return (
      canonicalPath.startsWith(cwd) &&
      (minimatch(canonicalPath, globPattern) || minimatch(`./${path.relative(cwd, canonicalPath)}`, globPattern))
    );
  });
}

/**
 * Search up the tree for a module declaration.
 */
function findParentModuleDeclaration(node: ts.Node): ts.ModuleDeclaration | undefined {
  switch (node.kind) {
    case ts.SyntaxKind.ModuleDeclaration: {
      return ts.isStringLiteral((node as ts.ModuleDeclaration).name) ? (node as ts.ModuleDeclaration) : undefined;
    }
    case ts.SyntaxKind.SourceFile: {
      return undefined;
    }
    default: {
      return findParentModuleDeclaration(node.parent);
    }
  }
}

/**
 * Clean up a file path so it can be matched against as users expect.
 */
function getCanonicalFilePath(filePath: string) {
  const normalized = path.normalize(filePath);
  const normalizedWithoutTrailingSlash = normalized.endsWith(path.sep) ? normalized.slice(0, -1) : normalized;

  const useCaseSensitiveFileNames =
    // eslint-disable-next-line ts/no-unnecessary-condition
    ts.sys === undefined ? true : ts.sys.useCaseSensitiveFileNames;

  if (useCaseSensitiveFileNames) {
    return normalizedWithoutTrailingSlash;
  }

  return normalizedWithoutTrailingSlash.toLowerCase();
}
