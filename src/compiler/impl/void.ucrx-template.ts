import { CHURI_MODULE } from '../../impl/module-names.js';
import { BaseUcrxTemplate } from '../rx/base.ucrx-template.js';
import { UcrxLib } from '../rx/ucrx-lib.js';

export class VoidUcrxTemplate extends BaseUcrxTemplate {

  #className?: string;

  constructor(lib: UcrxLib) {
    super({ lib });
  }

  override get base(): undefined {
    return;
  }

  override get typeName(): string {
    return 'Void';
  }

  override get className(): string {
    return (this.#className ??= this.#importClass());
  }

  #importClass(): string {
    return this.lib.import(CHURI_MODULE, `${this.typeName}Ucrx`);
  }

}
