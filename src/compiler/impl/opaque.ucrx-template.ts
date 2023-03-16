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
      methods: {
        any({ prefix, suffix }) {
          return code => {
            code.write(`${prefix}1${suffix}`);
          };
        },
      },
      args: [],
    });
  }

}
