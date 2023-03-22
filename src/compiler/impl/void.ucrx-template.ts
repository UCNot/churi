import { CHURI_MODULE } from '../../impl/module-names.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { ExternalUcrxTemplate } from './external.ucrx-template.js';

export class VoidUcrxTemplate extends ExternalUcrxTemplate {

  constructor(lib: UcrxLib) {
    super({
      lib,
      importFrom: CHURI_MODULE,
      className: 'VoidUcrx',
      args: ['set'],
    });
  }

  override get base(): undefined {
    return;
  }

}
