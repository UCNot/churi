import { CHURI_MODULE } from '../../impl/module-names.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxTemplate } from '../rx/ucrx-template.js';
import { VoidUcSchema } from './void.uc-schema.js';

export class VoidUcrxTemplate extends UcrxTemplate<void> {

  constructor(lib: UcrxLib) {
    super({
      lib,
      base: CHURI_MODULE,
      schema: VoidUcSchema,
      className: 'VoidUcrx',
      args: [],
    });
  }

}
