import { UccBundle } from './ucc-bundle.js';
import { UccDeclarations } from './ucc-declarations.js';
import { UccImports } from './ucc-imports.js';
import { UccNamespace } from './ucc-namespace.js';

export class UccLib {

  readonly #bundle: UccBundle;

  constructor(options?: UccLib.Options);

  constructor({ bundle = new UccBundle() }: UccLib.Options = {}) {
    this.#bundle = bundle;
  }

  get bundle(): UccBundle {
    return this.#bundle;
  }

  get ns(): UccNamespace {
    return this.bundle.ns;
  }

  get imports(): UccImports {
    return this.bundle.imports;
  }

  get declarations(): UccDeclarations {
    return this.bundle.declarations;
  }

  import(from: string, name: string): string {
    return this.imports.import(from, name);
  }

}

export namespace UccLib {
  export interface Options {
    readonly bundle?: UccBundle;
  }
}
