import { EsClass } from 'esgen';
import { UcrxSignature } from '../rx/ucrx.class.js';
import { VoidUcrxClass } from './void.ucrx.class.js';

export class CustomBaseUcrxClass extends EsClass<UcrxSignature.Args> {

  constructor() {
    super('BaseUcrx', {
      baseClass: VoidUcrxClass.instance,
      declare: {
        at: 'bundle',
      },
    });
  }

}
