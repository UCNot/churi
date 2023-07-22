import { esline } from 'esgen';
import { UcString } from '../../schema/string/uc-string.js';
import { UccConfig } from '../processor/ucc-config.js';
import { UcrxCore } from '../rx/ucrx-core.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxProcessor } from '../rx/ucrx-processor.js';
import { UcrxClass, UcrxSignature } from '../rx/ucrx.class.js';
import { UcdCompiler } from './ucd-compiler.js';

export class StringUcrxClass extends UcrxClass<UcrxSignature.Args, UcString, UcString.Schema> {

  static uccProcess(compiler: UcdCompiler.Any): UccConfig {
    return {
      configure: () => {
        compiler.useUcrxClass<UcString, UcString.Schema>(
          String,
          (lib, schema) => new this(lib, schema),
        );
      },
    };
  }

  static uccProcessSchema(
    processor: UcrxProcessor.Any,
    schema: UcString.Schema,
  ): UccConfig<UcString.Variant> {
    return {
      configure: variant => {
        processor.useUcrxClass(schema, (lib, schema) => new this(lib, schema, variant));
      },
    };
  }

  constructor(lib: UcrxLib, schema: UcString.Schema, { raw = 'escape' }: UcString.Variant = {}) {
    super({
      lib,
      schema,
      baseClass: lib.baseUcrx,
    });
    if (raw !== 'parse') {
      UcrxCore.raw.overrideIn(this, {
        body({
          member: {
            args: { value, cx },
          },
        }) {
          return code => {
            if (schema.nullable) {
              code
                .write(esline`if (${value} === '--') {`)
                .indent(esline`return this.nul(${cx});`)
                .write('}');
            }

            code.write(esline`return this.str(${value}, ${cx});`);
          };
        },
      });
    }

    UcrxCore.str.overrideIn(this, {
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
