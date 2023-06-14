import { EsClass } from 'esgen';
import { UcrxSignature1 } from '../rx/ucrx.class.js';
import { VoidUcrxClass } from './void.ucrx.class.js';

export class CustomBaseUcrxClass extends EsClass<UcrxSignature1.Args> {

  constructor() {
    super('BaseUcrx', {
      baseClass: VoidUcrxClass.instance,
      declare: {
        at: 'bundle',
      },
    });
  }

}
