import { UccArgs } from '../codegen/ucc-args.js';
import { UccCode } from '../codegen/ucc-code.js';
import { UcrxCore } from './ucrx-core.js';
import { UcrxLib } from './ucrx-lib.js';
import { UcrxLocation } from './ucrx-location.js';
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
      this.#args = () => new UccArgs(...args);
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
      method: { typeName },
    } of Object.values(this.ownMethods)) {
      if (typeName) {
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
    const methodDecls = this.declareMethods();

    if (methodDecls) {
      for (const [key, value] of Object.entries(methodDecls)) {
        if (value) {
          if (key === 'custom') {
            for (const { method, declare } of value as UcrxTemplate.Method<string>[]) {
              methods[this.#lib.ucrxMethodKey(method)] = {
                method,
                declare,
              };
            }
          } else {
            methods[key] = {
              method: UcrxCore[key as keyof UcrxCore] as UcrxMethod<any>,
              declare: value as UcrxMethod.Body<string>,
            };
          }
        }
      }
    }

    return methods as UcrxTemplate.Methods;
  }

  newInstance(location: UcrxLocation): UccCode.Source;
  newInstance({ args, prefix, suffix }: UcrxLocation): UccCode.Source {
    return `${prefix}new ${this.className}(${this.args.call(args)})${suffix}`;
  }

  protected declareConstructor(_args: UcrxArgs.ByName): UccCode.Source | undefined {
    return;
  }

  protected declareMethods(): UcrxTemplate.MethodDecls | undefined {
    return;
  }

}
