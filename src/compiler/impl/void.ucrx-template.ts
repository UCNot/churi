import { CHURI_MODULE } from '../../impl/module-names.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxTemplate } from '../rx/ucrx-template.js';
import { VoidUcSchema } from './void.uc-schema.js';

export class VoidUcrxTemplate extends UcrxTemplate<void> {

  constructor(lib: UcrxLib) {
    super({
      lib,
      schema: VoidUcSchema,
      className: 'VoidUcrx',
      args: ['set'],
    });
  }

  override get base(): string {
    return CHURI_MODULE;
  }

}
