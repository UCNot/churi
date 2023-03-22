import { jsStringLiteral } from '../../impl/quote-property-key.js';
import { UccArgs } from '../codegen/ucc-args.js';
import { UccCode } from '../codegen/ucc-code.js';
import { UccMethod } from '../codegen/ucc-method.js';
import { UcrxCore } from './ucrx-core.js';
import { UcrxLib } from './ucrx-lib.js';
import { UcrxMethod } from './ucrx-method.js';
import { UcrxTemplate } from './ucrx-template.js';
import { UcrxArgs } from './ucrx.args.js';

export abstract class BaseUcrxTemplate {

  readonly #lib: UcrxLib;

  readonly #args: () => UcrxArgs;
  #ownMethods?: UcrxTemplate.Methods;
  #definedMethods?: UcrxTemplate.Methods;
  #expectedTypes?: readonly [set: ReadonlySet<string>, sameAsBase: boolean];

  constructor(options: UcrxTemplate.Options);
  constructor({ lib, args }: UcrxTemplate.Options) {
    this.#lib = lib;

    if (args) {
      this.#args = () => UccArgs.by(args);
    } else {
      this.#args = () => this.base?.args ?? new UccArgs<UcrxArgs.Arg>('set');
    }
  }

  get lib(): UcrxLib {
    return this.#lib;
  }

  get base(): BaseUcrxTemplate | undefined {
    return this.lib.voidUcrx;
  }

  abstract get className(): string;

  get args(): UcrxArgs {
    return this.#args();
  }

  get expectedTypes(): ReadonlySet<string> {
    return this.#getExpectedTypes()[0];
  }

  get overriddenTypes(): ReadonlySet<string> {
    const [types, sameAsBase] = this.#getExpectedTypes();

    return sameAsBase ? new Set() : types;
  }

  #getExpectedTypes(): readonly [set: ReadonlySet<string>, sameAsBase: boolean] {
    return (this.#expectedTypes ??= this.#buildExpectedTypes());
  }

  #buildExpectedTypes(): readonly [set: ReadonlySet<string>, sameAsBase: boolean] {
    const types = new Set<string>();

    for (const {
      method: { typeName, stub },
      body,
    } of Object.values(this.ownMethods)) {
      if (typeName && body !== stub) {
        types.add(typeName);
      }
    }

    const { base } = this;
    const sameAsBase = !types.size;

    if (base) {
      base.expectedTypes.forEach(type => types.add(type));
    }

    return [types, sameAsBase];
  }

  get ownMethods(): UcrxTemplate.Methods {
    return (this.#ownMethods ??= this.#buildOwnMethods());
  }

  get definedMethods(): UcrxTemplate.Methods {
    return (this.#definedMethods ??= this.base
      ? { ...this.base.definedMethods, ...this.ownMethods }
      : this.ownMethods);
  }

  #buildOwnMethods(): UcrxTemplate.Methods {
    const methods: Record<string, UcrxTemplate.Method<string>> = {};
    const methodDecls = this.overrideMethods();

    if (methodDecls) {
      for (const [key, value] of Object.entries(methodDecls)) {
        if (value) {
          if (key === 'custom') {
            for (const { method, body: body } of value as UcrxTemplate.Method<string>[]) {
              methods[this.#lib.ucrxMethod(method).name] = {
                method,
                body,
              };
            }
          } else {
            methods[key] = {
              method: UcrxCore[key as keyof UcrxCore] as UcrxMethod<any>,
              body: value as UccMethod.Body,
            };
          }
        }
      }
    }

    return methods as UcrxTemplate.Methods;
  }

  newInstance(args: UcrxArgs.ByName): string {
    return `new ${this.className}(${this.args.call(args)})`;
  }

  protected overrideMethods(): UcrxTemplate.MethodDecls | undefined {
    return;
  }

  protected declareMethods(): UccCode.Source {
    return code => {
      for (const { method, body } of Object.values(this.ownMethods)) {
        code.write(method.declare(this, body as UccMethod.Body<any>));
      }
    };
  }

  protected declareTypes(): UccCode.Source {
    return code => {
      const types = this.overriddenTypes;

      if (types.size) {
        code
          .write('get types() {')
          .indent(code => {
            const typeNames = [...types].map(type => jsStringLiteral(type)).join(', ');

            code.write(`return [${typeNames}];`);
          })
          .write('}');
      }
    };
  }

}
