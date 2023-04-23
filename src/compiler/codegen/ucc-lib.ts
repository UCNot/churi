import { UccDeclarations } from './ucc-declarations.js';
import { UccImports } from './ucc-imports.js';
import { UccNamespace } from './ucc-namespace.js';

export abstract class UccLib {

  readonly #ns: UccNamespace;
  readonly #imports: UccImports;
  readonly #declarations: UccDeclarations;

  constructor(options?: UccLib.Options);

  constructor({
    ns = new UccNamespace(),
    imports = new UccImports(ns),
    declarations = new UccDeclarations(ns),
  }: UccLib.Options = {}) {
    this.#ns = ns;
    this.#imports = imports;
    this.#declarations = declarations;
  }

  get ns(): UccNamespace {
    return this.#ns;
  }

  get imports(): UccImports {
    return this.#imports;
  }

  get declarations(): UccDeclarations {
    return this.#declarations;
  }

  import(from: string, name: string): string {
    return this.imports.import(from, name);
  }

}

export namespace UccLib {
  export interface Options {
    readonly ns?: UccNamespace | undefined;
    readonly imports?: UccImports | undefined;
    readonly declarations?: UccDeclarations | undefined;
  }
}
