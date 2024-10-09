import { esline } from 'esgen';
import { UcBoolean } from '../../schema/boolean/uc-boolean.js';
import { UcrxBootstrap } from '../rx/ucrx-bootstrap.js';
import { UcrxCore } from '../rx/ucrx-core.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxClass, UcrxSignature } from '../rx/ucrx.class.js';

export class BooleanUcrxClass extends UcrxClass<UcrxSignature.Args, UcBoolean, UcBoolean.Schema> {
  static uccEnable<TBoot extends UcrxBootstrap<TBoot>>(boot: TBoot): void {
    boot.useUcrxClass(Boolean, (lib, schema: UcBoolean.Schema) => new this(lib, schema));
  }

  constructor(lib: UcrxLib, schema: UcBoolean.Schema) {
    super({
      lib,
      schema,
      baseClass: lib.baseUcrx,
    });

    UcrxCore.bol.overrideIn(this, {
      body({
        member: {
          args: { value },
        },
      }) {
        return esline`return this.set(${value});`;
      },
    });
    if (schema.nullable) {
      UcrxCore.nul.overrideIn(this, {
        body: () => `return this.set(null);`,
      });
    }
  }
}
