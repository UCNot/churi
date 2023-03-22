import { UccCode } from '../codegen/ucc-code.js';
import { BaseUcrxTemplate } from '../rx/base.ucrx-template.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxTemplate } from '../rx/ucrx-template.js';

export class CustomOpaqueUcrxTemplate extends BaseUcrxTemplate {

  #className?: string;

  constructor(lib: UcrxLib) {
    super({ lib, args: [] });
  }

  override get className(): string {
    return (this.#className ??= this.#declareClass());
  }

  protected override overrideMethods(): UcrxTemplate.MethodDecls {
    return {
      any: () => `return 1;`,
    };
  }

  #declareClass(): string {
    return this.lib.declarations.declareClass('OpaqueUcrx', name => this.#declareBody(name), {
      baseClass: this.base.className,
    });
  }

  #declareBody(_className: string): UccCode.Source {
    return code => {
      code.write(this.#declareConstructor(), this.declareTypes(), this.declareMethods());
    };
  }

  #declareConstructor(): UccCode.Source {
    return code => {
      code
        .write(`constructor() {`)
        .indent(`super(${this.base.args.call({ set: '_ => {}' })});`)
        .write('}');
    };
  }

}

export interface CustomOpaqueUcrxTemplate extends BaseUcrxTemplate {
  get base(): BaseUcrxTemplate;
}