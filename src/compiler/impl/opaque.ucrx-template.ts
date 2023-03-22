import { CHURI_MODULE } from '../../impl/module-names.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxTemplate } from '../rx/ucrx-template.js';
import { ExternalUcrxTemplate } from './external.ucrx-template.js';

export class OpaqueUcrxTemplate extends ExternalUcrxTemplate {

  constructor(lib: UcrxLib) {
    super({
      lib,
      importFrom: CHURI_MODULE,
      className: 'OpaqueUcrx',
      args: [],
    });
  }

  protected override declareMethods(): UcrxTemplate.MethodDecls {
    return {
      any(_location) {
        return `return 1;`;
      },
    };
  }

}
