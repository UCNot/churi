import { CHURI_MODULE } from '../../impl/module-names.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxTemplate } from '../rx/ucrx-template.js';
import { VoidUcSchema } from './void.uc-schema.js';

export class OpaqueUcrxTemplate extends UcrxTemplate {

  constructor(lib: UcrxLib) {
    super({
      lib,
      schema: VoidUcSchema,
      className: 'OpaqueUcrx',
      args: [],
    });
  }

  override get base(): string {
    return CHURI_MODULE;
  }

  protected override declareMethods(): UcrxTemplate.MethodDecls {
    return {
      any(_location) {
        return `return 1;`;
      },
    };
  }

}
