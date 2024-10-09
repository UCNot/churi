import { EsClass, EsSignature } from 'esgen';
import { VoidUcrxClass } from './void.ucrx.class.js';

export class CustomOpaqueUcrxClass extends EsClass<EsSignature.NoArgs> {
  constructor() {
    super('OpaqueUcrx', {
      baseClass: VoidUcrxClass.instance,
      declare: {
        at: 'bundle',
      },
    });

    this.declareConstructor({ body: () => 'super(_ => {});' });
  }
}
