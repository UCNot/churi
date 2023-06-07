import { EsClass } from 'esgen';
import { UcrxClassSignature1 } from '../rx/ucrx.class.js';
import { VoidUcrxClass } from './void.ucrx.class.js';

export class CustomBaseUcrxClass extends EsClass<UcrxClassSignature1.Args> {

  constructor() {
    super('BaseUcrx', {
      baseClass: VoidUcrxClass.instance,
      declare: {
        at: 'bundle',
      },
    });
  }

}
