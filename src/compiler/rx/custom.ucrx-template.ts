import { capitalize } from '../../impl/capitalize.js';
import { jsStringLiteral } from '../../impl/quote-property-key.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { ucSchemaSymbol } from '../impl/uc-schema-symbol.js';
import { UccArgs } from '../ucc-args.js';
import { UccCode } from '../ucc-code.js';
import { UccMethodRef } from '../ucc-method-ref.js';
import { UccNamespace } from '../ucc-namespace.js';
import { BaseUcrxTemplate } from './base.ucrx-template.js';
import { UcrxMethod } from './ucrx-method.js';
import { UcrxTemplate } from './ucrx-template.js';
import { UcrxArgs } from './ucrx.args.js';

export class CustomUcrxTemplate<
  out T = unknown,
  out TSchema extends UcSchema<T> = UcSchema<T>,
> extends UcrxTemplate<T, TSchema> {

  readonly #preferredClassName: string;
  readonly #schema: TSchema;

  #className?: string;

  #privateNs?: UccNamespace;
  readonly #privates = new UccCode();
  readonly #privateMethods = new UccCode();

  constructor(options: CustomUcrxTemplate.Options<T, TSchema>) {
    super(options);

    const { schema, className = capitalize(ucSchemaSymbol(schema)) + 'Ucrx' } = options;

    this.#preferredClassName = className;
    this.#schema = schema;
  }

  get schema(): TSchema {
    return this.#schema;
  }

  get className(): string {
    return (this.#className ??= this.#declare());
  }

  #declare(): string {
    const { base } = this;

    return this.lib.declarations.declareClass(
      this.#preferredClassName,
      name => this.#declareClass(name),
      { baseClass: base.className },
    );
  }

  #declareClass(_className: string): UccCode.Source {
    return code => {
      code.write(
        this.#privates,
        this.#declareConstructor(),
        this.#privateMethods,
        this.#declareTypes(),
      );
      for (const [key, { method, declare }] of Object.entries(this.ownMethods)) {
        code.write(method.declare(this as UcrxTemplate, key, declare as UcrxMethod.Body<string>));
      }
    };
  }

  #declareConstructor(): UccCode.Source {
    return code => {
      const { base } = this;
      const args = this.args.declare(this.lib.ns.nest());
      const callSuperConstr = this.callSuperConstructor(base, args.args);
      const constr = this.declareConstructor(args.args);

      if (constr || callSuperConstr || !this.args.equals(base.args)) {
        code
          .write(`constructor(${args}) {`)
          .indent(code => {
            code.write(callSuperConstr ?? `super(${base.args.call(args.args)});`);
            if (constr) {
              code.write(constr);
            }
          })
          .write(`}`);
      }
    };
  }

  protected callSuperConstructor(
    _base: BaseUcrxTemplate,
    _args: UcrxArgs.ByName,
  ): UccCode.Source | undefined {
    return;
  }

  protected declareConstructor(_args: UcrxArgs.ByName): UccCode.Source | undefined {
    return;
  }

  protected declareMethods(): UcrxTemplate.MethodDecls | undefined {
    return;
  }

  declarePrivate(
    preferredName: string,
    init?: string | ((prefix: string, suffix: string) => UccCode.Source),
  ): string {
    const name = this.#privateName(preferredName);

    if (!init) {
      this.#privates.write(`#${name};`);
    } else if (typeof init === 'string') {
      this.#privates.write(`#${name} = ${init};`);
    } else {
      this.#privates.write(init(`#${name} = `, `;`));
    }

    return `this.#${name}`;
  }

  declarePrivateMethod<TArg extends string>(
    preferredName: string,
    args: UccArgs<TArg>,
    body: (args: UccArgs.ByName<TArg>) => UccCode.Source,
  ): UccMethodRef<TArg> {
    const name = this.#privateName(preferredName);
    const methodRef = new UccMethodRef(`#${name}`, args);

    this.#privateMethods.write(methodRef.declare(this.lib.ns.nest(), body));

    return methodRef;
  }

  #privateName(preferred: string): string {
    return (this.#privateNs ??= this.lib.ns.nest()).name(preferred);
  }

  #declareTypes(): UccCode.Source {
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

export interface CustomUcrxTemplate<out T = unknown, out TSchema extends UcSchema<T> = UcSchema<T>>
  extends BaseUcrxTemplate {
  get base(): BaseUcrxTemplate;
}

export namespace CustomUcrxTemplate {
  export interface Options<out T, out TSchema extends UcSchema<T>> extends UcrxTemplate.Options {
    readonly className?: string | undefined;
    readonly schema: TSchema;
  }
}
