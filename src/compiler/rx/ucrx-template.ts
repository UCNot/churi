import { jsStringLiteral } from '../../impl/quote-property-key.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccCode } from '../ucc-code.js';
import { UcrxLib } from './ucrx-lib.js';
import { UcrxLocation } from './ucrx-location.js';
import { UcrxMethod } from './ucrx-method.js';

export class UcrxTemplate<out T = unknown, out TSchema extends UcSchema<T> = UcSchema<T>> {

  readonly #lib: UcrxLib;
  readonly #schema: TSchema;
  readonly #base: UcrxTemplate | string;
  readonly #className: string;
  readonly #needsContext: boolean;
  readonly #methodDecls: UcrxTemplate.Options<T, TSchema>['methods'];
  #ownMethods?: UcrxTemplate.Methods;

  constructor(options: UcrxTemplate.Options<T, TSchema>);
  constructor({
    lib,
    schema,
    base = lib.baseUcrxTemplate,
    className,
    needsContext,
    methods,
  }: UcrxTemplate.Options<T, TSchema>) {
    this.#lib = lib;
    this.#schema = schema;
    this.#base = base;
    this.#methodDecls = methods;

    if (typeof base === 'string') {
      this.#needsContext = needsContext ?? false;
      this.#className = this.lib.import(base, className);
    } else {
      this.#needsContext = needsContext ?? base.needsContext;
      this.#className = lib.ns.name(className);
    }
  }

  get lib(): UcrxLib {
    return this.#lib;
  }

  get schema(): TSchema {
    return this.#schema;
  }

  get base(): UcrxTemplate | string {
    return this.#base;
  }

  get className(): string {
    return this.#className;
  }

  get needsContext(): boolean {
    return this.#needsContext;
  }

  get ownMethods(): UcrxTemplate.Methods {
    return (this.#ownMethods ??= this.#buildOwnMethods());
  }

  #buildOwnMethods(): UcrxTemplate.Methods {
    const methods: Record<string, UcrxTemplate.Method<string[]>> = {};

    if (this.#methodDecls) {
      for (const [key, value] of Object.entries(this.#methodDecls)) {
        if (value) {
          if (key === 'custom') {
            for (const { method, declare } of value as UcrxTemplate.Method<string[]>[]) {
              methods[this.#lib.ucrxMethodKey(method)] = {
                method,
                declare,
              };
            }
          } else {
            methods[key] = {
              method: UcrxMethod.predefined[key as keyof UcrxMethod.Predefined] as UcrxMethod<any>,
              declare: value as UcrxMethod.Decl<string[]>,
            };
          }
        }
      }
    }

    return methods as UcrxTemplate.Methods;
  }

  newInstance(location: UcrxLocation): UccCode.Source;
  newInstance({ context, setter, prefix, suffix }: UcrxLocation): UccCode.Source {
    return `${prefix}new ${this.className}(${setter}${
      this.needsContext ? ', ' + context : ''
    })${suffix}`;
  }

  declare(): UccCode.Source {
    return code => {
      const base = typeof this.base === 'string' ? this.base : this.base.className;

      code
        .write(`class ${this.className} extends ${base} {`)
        .indent(code => {
          code.write(this.#declareTypes());
          for (const [key, { method, declare }] of Object.entries(this.ownMethods)) {
            code.write(method.declare(this, key, declare as UcrxMethod.Decl<string[]>));
          }
        })
        .write(`}`);
    };
  }

  #declareTypes(): UccCode.Source {
    return code => {
      const types = this.#expectedTypes();

      if (types) {
        code
          .write('get types() {')
          .indent(code => {
            const typeNames = types.map(type => jsStringLiteral(type)).join(', ');

            code.write(`return [${typeNames}];`);
          })
          .write('}');
      }
    };
  }

  #expectedTypes(full?: false): readonly string[] | undefined;
  #expectedTypes(full: true): readonly string[];
  #expectedTypes(full = false): readonly string[] | undefined {
    const types: string[] = [];

    for (const {
      method: { typeName },
    } of Object.values(this.ownMethods)) {
      if (typeName) {
        types.push(typeName);
      }
    }

    if (!types.length && !full) {
      return;
    }

    const { base } = this;

    if (typeof base !== 'string') {
      types.push(...base.#expectedTypes(true));
    }

    return types;
  }

}

export namespace UcrxTemplate {
  export interface Options<out T, out TSchema extends UcSchema<T>> {
    readonly lib: UcrxLib;
    readonly schema: TSchema;
    readonly base?: UcrxTemplate | string | undefined;
    readonly className: string;
    readonly needsContext?: boolean | undefined;

    readonly methods?: {
      readonly [key in keyof UcrxMethod.Predefined]?:
        | UcrxMethod.Decl<UcrxMethod.ArgsType<UcrxMethod.Predefined[key]>>
        | undefined;
    } & {
      readonly custom?: Method<string[]>[] | undefined;
    };
  }

  export type Methods = {
    readonly [key in keyof UcrxMethod.Predefined]?:
      | Method<UcrxMethod.ArgsType<UcrxMethod.Predefined[key]>>
      | undefined;
  } & {
    readonly [key in Exclude<string, keyof UcrxMethod.Predefined>]: Method<string[]>;
  };

  export interface Method<in out TArgs extends string[] = [string]> {
    readonly method: UcrxMethod<TArgs>;
    readonly declare: UcrxMethod.Decl<TArgs>;
  }
}
