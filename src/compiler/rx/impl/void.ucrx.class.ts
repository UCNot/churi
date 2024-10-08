import { EsClass, EsField, esImportClass } from 'esgen';
import { VoidUcrx } from '../../../rx/void.ucrx.js';
import { UC_MODULE_CHURI } from '../../impl/uc-modules.js';
import { UcrxCore } from '../ucrx-core.js';
import { UcrxSignature } from '../ucrx.class.js';

export class VoidUcrxClass extends EsClass<UcrxSignature.Args> {
  static #instance: VoidUcrxClass | undefined;

  static get instance(): VoidUcrxClass {
    return (this.#instance ??= new VoidUcrxClass());
  }

  private constructor() {
    super(esImportClass(UC_MODULE_CHURI, 'VoidUcrx', { set: {} }), {
      classConstructor: {
        args: {
          set: {},
        },
      },
    });

    // Register core methods.
    for (const member of Object.values(UcrxCore)) {
      member.declareStub(this);
    }

    // Reserve `VoidUcrx` members not declared in `UcrxCore`.
    for (const key of Object.getOwnPropertyNames(VoidUcrx.prototype)) {
      if (!(key in UcrxCore)) {
        new EsField(key).declareIn(this);
      }
    }
  }
}
