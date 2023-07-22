import { esline } from 'esgen';
import { UcBoolean } from '../../schema/boolean/uc-boolean.js';
import { UccConfig } from '../processor/ucc-config.js';
import { UcrxCore } from '../rx/ucrx-core.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxClass, UcrxSignature } from '../rx/ucrx.class.js';
import { UcdCompiler } from './ucd-compiler.js';

export class BooleanUcrxClass extends UcrxClass<UcrxSignature.Args, UcBoolean, UcBoolean.Schema> {

  static uccProcess(processor: UcdCompiler.Any): UccConfig {
    return {
      configure: () => {
        processor.useUcrxClass<UcBoolean, UcBoolean.Schema>(
          Boolean,
          (lib, schema) => new this(lib, schema),
        );
      },
    };
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
