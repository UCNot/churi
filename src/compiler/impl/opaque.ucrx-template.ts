import { CHURI_MODULE } from '../../impl/module-names.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxTemplate } from '../rx/ucrx-template.js';
import { VoidUcSchema } from './void.uc-schema.js';

export class OpaqueUcrxTemplate extends UcrxTemplate {

  constructor(lib: UcrxLib) {
    super({
      lib,
      base: CHURI_MODULE,
      schema: VoidUcSchema,
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
