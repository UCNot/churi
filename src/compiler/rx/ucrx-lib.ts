import { VoidUcrx } from '../../rx/void.ucrx.js';
import { UcSchemaResolver } from '../../schema/uc-schema-resolver.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccLib } from '../codegen/ucc-lib.js';
import { UccMethod } from '../codegen/ucc-method.js';
import { UccNamespace } from '../codegen/ucc-namespace.js';
import { CustomBaseUcrxTemplate } from '../impl/custom-base.ucrx-template.js';
import { CustomOpaqueUcrxTemplate } from '../impl/custom-opaque.ucrx-template.js';
import { VoidUcrxTemplate } from '../impl/void.ucrx-template.js';
import { BaseUcrxTemplate } from './base.ucrx-template.js';
import { UcrxCore } from './ucrx-core.js';
import { UcrxMethod } from './ucrx-method.js';
import { UcrxTemplate } from './ucrx-template.js';

export abstract class UcrxLib extends UccLib {

  readonly #resolver: UcSchemaResolver;
  #voidUcrx?: BaseUcrxTemplate;
  #opaqueUcrx?: BaseUcrxTemplate | null;
  readonly #methods = new Map<UcrxMethod, UccMethod>();
  readonly #customMethods: UcrxMethod[] = [];

  constructor(options: UcrxLib.Options) {
    super(options);

    const { methods, resolver = new UcSchemaResolver() } = options;

    this.#resolver = resolver;

    const ns = new UccNamespace();

    // Register core methods.
    for (const [key, method] of Object.entries(UcrxCore as Record<keyof UcrxCore, UcrxMethod>)) {
      ns.name(key);
      this.#methods.set(method, new UccMethod(key, method.args));
    }

    // Reserve `VoidUcrx` interface methods not declared in `UcrxCore`.
    for (const key of Object.getOwnPropertyNames(VoidUcrx.prototype)) {
      if (!(key in UcrxCore)) {
        ns.name(key);
      }
    }

    // Register custom methods.
    if (methods) {
      for (const method of methods) {
        if (!this.#methods.has(method)) {
          const name = ns.name(method.preferredKey);

          this.#customMethods.push(method);
          this.#methods.set(method, new UccMethod(name, method.args));
        }
      }
    }
  }

  get resolver(): UcSchemaResolver {
    return this.#resolver;
  }

  get voidUcrx(): BaseUcrxTemplate {
    return (this.#voidUcrx ??= this.#createVoidUcrx());
  }

  #createVoidUcrx(): BaseUcrxTemplate {
    return this.#customMethods.length
      ? new CustomBaseUcrxTemplate(this, this.#customMethods)
      : new VoidUcrxTemplate(this);
  }

  get opaqueUcrx(): BaseUcrxTemplate | undefined {
    if (this.#opaqueUcrx === undefined) {
      this.#opaqueUcrx = this.#createOpaqueUcrx();
    }

    return this.#opaqueUcrx ?? undefined;
  }

  #createOpaqueUcrx(): BaseUcrxTemplate | null {
    return this.#customMethods.length ? new CustomOpaqueUcrxTemplate(this) : null;
  }

  abstract ucrxTemplateFor<T, TSchema extends UcSchema<T> = UcSchema<T>>(
    schema: TSchema,
  ): UcrxTemplate<T, TSchema>;

  ucrxMethod<TArg extends string>(method: UcrxMethod<TArg>): UccMethod<TArg> {
    const uccMethod = this.#methods.get(method as UcrxMethod<any> as UcrxMethod);

    if (!uccMethod) {
      throw new ReferenceError(`Unknown charge receiver method: ${method}`);
    }

    return uccMethod as UccMethod<any> as UccMethod<TArg>;
  }

}

export namespace UcrxLib {
  export interface Options extends UccLib.Options {
    readonly resolver?: UcSchemaResolver | undefined;
    readonly methods?: Iterable<UcrxMethod> | undefined;
  }
}
