/**
 * How a type declaration can be matched.
 */
export type TypeDeclarationSpecifier =
  | TypeDeclarationFileSpecifier
  | TypeDeclarationLibSpecifier
  | TypeDeclarationPackageSpecifier;

/**
 * Type declaration defined in a file.
 */
export type TypeDeclarationFileSpecifier = {
  from: "file";

  /**
   * The path to look in for the type, relative to project directory.
   */
  path?: string;
};

/**
 * Type declaration defined in the ts lib.
 */
export type TypeDeclarationLibSpecifier = {
  from: "lib";
};

/**
 * Type declaration defined in a package.
 */
export type TypeDeclarationPackageSpecifier = {
  from: "package";

  /**
   * The package to look in.
   */
  package?: string;
};
