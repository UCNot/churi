import { VoidUcrx } from '../../rx/void.ucrx.js';
import { OpaqueUcrxTemplate } from '../impl/opaque.ucrx-template.js';
import { VoidUcrxTemplate } from '../impl/void.ucrx-template.js';
import { UccDeclarations } from '../ucc-declarations.js';
import { UccImports } from '../ucc-imports.js';
import { UccNamespace } from '../ucc-namespace.js';
import { UcrxMethod } from './ucrx-method.js';
import { UcrxTemplate } from './ucrx-template.js';

export abstract class UcrxLib {

  readonly #ns: UccNamespace;
  readonly #imports: UccImports;
  readonly #declarations: UccDeclarations;
  #voidUcrx?: VoidUcrxTemplate;
  #opaqueUcrx?: OpaqueUcrxTemplate;
  #ucrxMethodNs?: UccNamespace;

  constructor(options?: UcrxLib.Options);

  constructor({
    ns = new UccNamespace(),
    imports = new UccImports(ns),
    declarations = new UccDeclarations(ns),
  }: UcrxLib.Options) {
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

  get voidUcrx(): UcrxTemplate<void> {
    return (this.#voidUcrx ??= new VoidUcrxTemplate(this));
  }

  get opaqueUcrx(): UcrxTemplate<void> {
    return (this.#opaqueUcrx ??= new OpaqueUcrxTemplate(this));
  }

  ucrxMethodKey<TArg extends string>(method: UcrxMethod<TArg>): string;
  ucrxMethodKey<TArg extends string>({ key }: UcrxMethod<TArg>): string {
    if (!this.#ucrxMethodNs) {
      this.#ucrxMethodNs = new UccNamespace();

      // Reserve `VoidUcrx` interface methods.
      for (const key of Object.keys(VoidUcrx.prototype)) {
        this.#ucrxMethodNs.name(key);
      }
    }

    return this.#ucrxMethodNs.name(key);
  }

  import(from: string, name: string): string {
    return this.imports.import(from, name);
  }

}

export namespace UcrxLib {
  export interface Options {
    readonly ns?: UccNamespace | undefined;
    readonly imports?: UccImports | undefined;
    readonly declarations?: UccDeclarations | undefined;
  }
}