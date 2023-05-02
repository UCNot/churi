import { lazyValue } from '@proc7ts/primitives';
import { UccCode, UccFragment, UccSource } from './ucc-code.js';
import { UccDeclarations } from './ucc-declarations.js';
import { UccImports } from './ucc-imports.js';
import { UccNamespace } from './ucc-namespace.js';
import { UccOutputFormat } from './ucc-output-format.js';

export class UccBundle {

  readonly #ns: UccNamespace;
  readonly #imports: UccImports;
  readonly #declarations: UccDeclarations;
  readonly #body: UccCode;
  readonly #compiled: { [format in UccOutputFormat]?: UccBundle.Compiled } = {};

  constructor(options?: UccBundle.Options);

  constructor({
    ns = new UccNamespace(),
    imports = new UccImports(ns),
    declarations = new UccDeclarations(ns),
    body = new UccCode(),
  }: UccBundle.Options = {}) {
    this.#ns = ns;
    this.#imports = imports;
    this.#declarations = declarations;
    this.#body = body;
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

  get body(): UccCode {
    return this.#body;
  }

  compile(format: UccOutputFormat = UccOutputFormat.Default): UccBundle.Compiled {
    const cached = this.#compiled[format];

    if (cached) {
      return cached;
    }

    const toCode = lazyValue(() => this.#toCode(format));
    const toText = lazyValue(async () => await new UccCode().write(toCode()).toText());

    return (this.#compiled[format] = {
      toCode,
      toText,
    });
  }

  #toCode(format: UccOutputFormat): UccSource {
    if (format === UccOutputFormat.IIFE) {
      return code => {
        code.write('return (async () => {').indent(this.#toBody(format)).write('})();');
      };
    }

    return this.#toBody(format);
  }

  #toBody(format: UccOutputFormat): UccSource {
    return code => {
      const declarations = this.declarations.compile(format);

      code.write(
        this.imports.compile(format),
        '',
        declarations.body,
        '',
        this.body,
        '',
        declarations.exports,
      );
    };
  }

}

export namespace UccBundle {
  export interface Options {
    readonly ns?: UccNamespace | undefined;
    readonly imports?: UccImports | undefined;
    readonly declarations?: UccDeclarations | undefined;
    readonly body?: UccCode | undefined;
  }

  export interface Compiled extends UccFragment {
    toText(): Promise<string>;
  }
}
