import { EsClass, EsField, esImportClass } from 'esgen';
import { VoidUcrx } from '../../rx/void.ucrx.js';
import { UcrxCore } from '../rx/ucrx-core.js';
import { UcrxMethod } from '../rx/ucrx-method.js';
import { UcrxClassSignature1 } from '../rx/ucrx.class.js';
import { UC_MODULE_CHURI } from './uc-modules.js';

export class VoidUcrxClass extends EsClass<UcrxClassSignature1.Args> {

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
      if (member instanceof UcrxMethod) {
        member.declareStub(this);
      } else {
        member.declareIn(this, { get: () => `return ['void'];` });
      }
    }

    // Reserve `VoidUcrx` members not declared in `UcrxCore`.
    for (const key of Object.getOwnPropertyNames(VoidUcrx.prototype)) {
      if (!(key in UcrxCore)) {
        new EsField(key).declareIn(this);
      }
    }
  }

}
