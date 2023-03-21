import { VoidUcrx } from '../../rx/void.ucrx.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccLib } from '../codegen/ucc-lib.js';
import { UccNamespace } from '../codegen/ucc-namespace.js';
import { OpaqueUcrxTemplate } from '../impl/opaque.ucrx-template.js';
import { VoidUcrxTemplate } from '../impl/void.ucrx-template.js';
import { BaseUcrxTemplate } from './base.ucrx-template.js';
import { UcrxMethod } from './ucrx-method.js';
import { UcrxTemplate } from './ucrx-template.js';

export abstract class UcrxLib extends UccLib {

  #voidUcrx?: VoidUcrxTemplate;
  #opaqueUcrx?: OpaqueUcrxTemplate;
  #ucrxMethodNs?: UccNamespace;

  get voidUcrx(): BaseUcrxTemplate {
    return (this.#voidUcrx ??= new VoidUcrxTemplate(this));
  }

  get opaqueUcrx(): BaseUcrxTemplate {
    return (this.#opaqueUcrx ??= new OpaqueUcrxTemplate(this));
  }

  abstract ucrxTemplateFor<T, TSchema extends UcSchema<T> = UcSchema<T>>(
    schema: TSchema,
  ): UcrxTemplate<T, TSchema>;

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

}

export namespace UcrxLib {
  export type Options = UccLib.Options;
}
