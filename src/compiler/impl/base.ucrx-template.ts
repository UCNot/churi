import { asis } from '@proc7ts/primitives';
import { CHURI_MODULE } from '../../impl/module-names.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxTemplate } from '../rx/ucrx-template.js';

export class BaseUcrxTemplate extends UcrxTemplate<void> {

  constructor(lib: UcrxLib) {
    super({
      lib,
      base: CHURI_MODULE,
      schema: UcSchema$Void,
      className: 'VoidUcrx',
      args: [],
    });
  }

}

const UcSchema$Void: UcSchema<void> = {
  type: 'void',
  asis: asis,
};
