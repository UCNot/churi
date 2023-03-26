import { UccCode } from '../codegen/ucc-code.js';
import { BaseUcrxTemplate } from '../rx/base.ucrx-template.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxMethod } from '../rx/ucrx-method.js';
import { UcrxTemplate } from '../rx/ucrx-template.js';
import { VoidUcrxTemplate } from './void.ucrx-template.js';

export class CustomBaseUcrxTemplate extends BaseUcrxTemplate {

  readonly #base: BaseUcrxTemplate;
  readonly #methods: readonly UcrxMethod[];
  #className?: string;

  constructor(lib: UcrxLib, methods: readonly UcrxMethod[]) {
    super({ lib });

    this.#base = new VoidUcrxTemplate(lib);
    this.#methods = methods;
  }

  override get base(): BaseUcrxTemplate {
    return this.#base;
  }

  override get className(): string {
    return (this.#className ??= this.#declareClass());
  }

  override get customMethods(): readonly UcrxMethod[] {
    return this.#methods;
  }

  protected override overrideMethods(): UcrxTemplate.MethodDecls {
    return {
      custom: this.#methods.map(method => ({ method, body: method.stub })),
    };
  }

  #declareClass(): string {
    return this.lib.declarations.declareClass('BaseUcrx', name => this.#declareBody(name), {
      baseClass: this.base.className,
    });
  }

  #declareBody(_className: string): UccCode.Source {
    return this.declareMethods();
  }

}
