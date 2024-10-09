import { EsFunction, EsVarSymbol, esline } from 'esgen';
import { UccFeature } from '../compiler/bootstrap/ucc-feature.js';
import { UcdBootstrap } from '../compiler/deserialization/ucd-bootstrap.js';
import { UC_MODULE_CHURI } from '../compiler/impl/uc-modules.js';
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

export function ucdProcessTimestampFormat(boot: UcdBootstrap): void {
  boot.declareUcrxMethod(TimestampUcrxMethod).enable(ucdProcessTimestampFormatOnly);
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

export function ucdProcessTimestampFormatOnly(boot: UcdBootstrap): void {
  boot.handleFormat('timestamp', ({ register, refer }) => code => {
    refer(readTimestampEntityFn);

    code.write(register(readTimestampEntityFn.symbol));
  });
}

export const UcdProcessTimestamp: UccFeature.Object<UcdBootstrap> = {
  uccEnable(boot) {
    boot
      .enable(ucdProcessTimestampFormat)
      .useUcrxClass<number>('timestamp', (lib, schema) => new TimestampUcrxClass(lib, schema));
  },
};

export const UcdProcessTimestampSchema: UccFeature.Object<UcdBootstrap> = {
  uccEnable(boot) {
    return {
      constrain() {
        boot.enable(UcdProcessTimestamp);
      },
    };
  },
};

export function ucdProcessTimestampSchema(boot: UcdBootstrap): void {
  boot.enable(UcdProcessTimestamp);
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
