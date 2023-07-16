import { EsFunction, EsVarSymbol, esline } from 'esgen';
import { UcdCompiler } from '../compiler/deserialization/ucd-compiler.js';
import { UC_MODULE_CHURI } from '../compiler/impl/uc-modules.js';
import { UccConfig } from '../compiler/processor/ucc-config.js';
import { UccFeature } from '../compiler/processor/ucc-feature.js';
import { UccSchemaFeature } from '../compiler/processor/ucc-schema-feature.js';
import { UcrxCore } from '../compiler/rx/ucrx-core.js';
import { UcrxLib } from '../compiler/rx/ucrx-lib.js';
import { UcrxSetter } from '../compiler/rx/ucrx-setter.js';
import { UcrxClass } from '../compiler/rx/ucrx.class.js';
import { UcSchema } from '../schema/uc-schema.js';

export const TimestampUcrxMethod = new UcrxSetter('date', {
  stub: {
    body({
      member: {
        args: { value, cx },
      },
    }) {
      return esline`return this.num(${value}.getTime(), ${cx});`;
    },
  },
  typeName: 'date',
});

export function ucdSupportTimestampFormat(compiler: UcdCompiler.Any): UccConfig {
  return {
    configure() {
      compiler.declareUcrxMethod(TimestampUcrxMethod).enable(ucdSupportTimestampFormatOnly);
    },
  };
}

const readTimestampEntityFn = new EsFunction(
  'readTimestampFormat',
  {
    cx: {},
    rx: {},
    format: {},
    data: {},
  },
  {
    declare: {
      at: 'bundle',
      body({ args: { cx, rx, data } }) {
        return (code, scope) => {
          const lib = scope.get(UcrxLib);
          const date = new EsVarSymbol('date');
          const printTokens = UC_MODULE_CHURI.import('printUcTokens');
          const setDate = lib.baseUcrx.member(TimestampUcrxMethod);

          code
            .line(date.declare({ value: () => esline`new Date(${printTokens}(${data}))` }), ';')
            .line('return ', setDate.call(rx, { value: date, cx }), ';');
        };
      },
    },
  },
);

export function ucdSupportTimestampFormatOnly(compiler: UcdCompiler.Any): UccConfig {
  return {
    configure() {
      compiler.handleFormat('timestamp', ({ register, refer }) => code => {
        refer(readTimestampEntityFn);

        code.write(register(readTimestampEntityFn.symbol));
      });
    },
  };
}

export const UcdSupportTimestamp: UccFeature.Object<UcdCompiler.Any> = {
  uccProcess(compiler) {
    return {
      configure() {
        compiler
          .enable(ucdSupportTimestampFormat)
          .useUcrxClass<number>('timestamp', (lib, schema) => new TimestampUcrxClass(lib, schema));
      },
    };
  },
};

export const UcdSupportTimestampSchema: UccSchemaFeature.Object<UcdCompiler.Any> = {
  uccProcessSchema(compiler, _schema) {
    return {
      configure() {
        compiler.enable(UcdSupportTimestamp);
      },
    };
  },
};

export function ucdSupportTimestampSchema(
  compiler: UcdCompiler.Any,
  _schema: UcSchema<number>,
): UccConfig {
  return {
    configure() {
      compiler.enable(UcdSupportTimestamp);
    },
  };
}

class TimestampUcrxClass extends UcrxClass {

  constructor(lib: UcrxLib, schema: UcSchema<number>) {
    super({
      schema,
      typeName: 'Timestamp',
      baseClass: lib.baseUcrx,
    });

    UcrxCore.num.declareIn(this, {
      body({
        member: {
          args: { value },
        },
      }) {
        return esline`return this.set(${value});`;
      },
    });
    if (schema.nullable) {
      UcrxCore.nul.declareIn(this, {
        body: () => `return this.set(null);`,
      });
    }
  }

}