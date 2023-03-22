import { VoidUcrx } from '../../rx/void.ucrx.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccLib } from '../codegen/ucc-lib.js';
import { UccNamespace } from '../codegen/ucc-namespace.js';
import { VoidUcrxTemplate } from '../impl/void.ucrx-template.js';
import { BaseUcrxTemplate } from './base.ucrx-template.js';
import { UcrxMethod } from './ucrx-method.js';
import { UcrxTemplate } from './ucrx-template.js';

export abstract class UcrxLib extends UccLib {

  #voidUcrx?: VoidUcrxTemplate;
  #ucrxMethodNs?: UccNamespace;

  get voidUcrx(): BaseUcrxTemplate {
    return (this.#voidUcrx ??= new VoidUcrxTemplate(this));
  }

  abstract ucrxTemplateFor<T, TSchema extends UcSchema<T> = UcSchema<T>>(
    schema: TSchema,
  ): UcrxTemplate<T, TSchema>;

  ucrxMethodKey<TArg extends string>(method: UcrxMethod<TArg>): string;
  ucrxMethodKey<TArg extends string>({ method: { name } }: UcrxMethod<TArg>): string {
    if (!this.#ucrxMethodNs) {
      this.#ucrxMethodNs = new UccNamespace();

      // Reserve `VoidUcrx` interface methods.
      for (const key of Object.keys(VoidUcrx.prototype)) {
        this.#ucrxMethodNs.name(key);
      }
    }

    return this.#ucrxMethodNs.name(name);
  }

}

export namespace UcrxLib {
  export type Options = UccLib.Options;
}
