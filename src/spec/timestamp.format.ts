import { EsFunction, EsVarSymbol, esline } from 'esgen';
import { UcdSetup } from '../compiler/deserialization/ucd-setup.js';
import { UC_MODULE_CHURI } from '../compiler/impl/uc-modules.js';
import { UccConfig } from '../compiler/processor/ucc-config.js';
import { UccFeature } from '../compiler/processor/ucc-feature.js';
import { UcrxCore } from '../compiler/rx/ucrx-core.js';
import { UcrxLib } from '../compiler/rx/ucrx-lib.js';
import { UcrxSetter } from '../compiler/rx/ucrx-setter.js';
import { UcrxClass } from '../compiler/rx/ucrx.class.js';
import { UcSchema } from '../schema/uc-schema.js';
import { printUcTokens } from '../syntax/print-uc-token.js';

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

export function ucdProcessTimestampFormat(setup: UcdSetup): UccConfig {
  return {
    configure() {
      setup.declareUcrxMethod(TimestampUcrxMethod).enable(ucdProcessTimestampFormatOnly);
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
          const printTokens = UC_MODULE_CHURI.import(printUcTokens.name);
          const setDate = lib.baseUcrx.member(TimestampUcrxMethod);

          code
            .line(date.declare({ value: () => esline`new Date(${printTokens}(${data}))` }), ';')
            .line('return ', setDate.call(rx, { value: date, cx }), ';');
        };
      },
    },
  },
);

export function ucdProcessTimestampFormatOnly(setup: UcdSetup): UccConfig {
  return {
    configure() {
      setup.handleFormat('timestamp', ({ register, refer }) => code => {
        refer(readTimestampEntityFn);

        code.write(register(readTimestampEntityFn.symbol));
      });
    },
  };
}

export const UcdProcessTimestamp: UccFeature.Object<UcdSetup> = {
  uccProcess(setup) {
    return {
      configure() {
        setup
          .enable(ucdProcessTimestampFormat)
          .useUcrxClass<number>('timestamp', (lib, schema) => new TimestampUcrxClass(lib, schema));
      },
    };
  },
};

export const UcdProcessTimestampSchema: UccFeature.Object<UcdSetup> = {
  uccProcess(setup) {
    return {
      configureSchema() {
        setup.enable(UcdProcessTimestamp);
      },
    };
  },
};

export function ucdProcessTimestampSchema(setup: UcdSetup, _schema: UcSchema<number>): UccConfig {
  return {
    configure() {
      setup.enable(UcdProcessTimestamp);
    },
  };
}

class TimestampUcrxClass extends UcrxClass {

  constructor(lib: UcrxLib, schema: UcSchema<number>) {
    super({
      lib,
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
