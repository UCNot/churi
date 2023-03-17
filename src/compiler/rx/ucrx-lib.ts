import { VoidUcrx } from '../../rx/void.ucrx.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { OpaqueUcrxTemplate } from '../impl/opaque.ucrx-template.js';
import { VoidUcrxTemplate } from '../impl/void.ucrx-template.js';
import { UccLib } from '../ucc-lib.js';
import { UccNamespace } from '../ucc-namespace.js';
import { UcrxMethod } from './ucrx-method.js';
import { UcrxTemplate } from './ucrx-template.js';

export abstract class UcrxLib extends UccLib {

  #voidUcrx?: VoidUcrxTemplate;
  #opaqueUcrx?: OpaqueUcrxTemplate;
  #ucrxMethodNs?: UccNamespace;

  get voidUcrx(): UcrxTemplate<void> {
    return (this.#voidUcrx ??= new VoidUcrxTemplate(this));
  }

  get opaqueUcrx(): UcrxTemplate<void> {
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
