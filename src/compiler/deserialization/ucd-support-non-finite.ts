import { UC_MODULE_DESERIALIZER } from '../impl/uc-modules.js';
import { UccConfig } from '../processor/ucc-config.js';
import { UcdCompiler } from './ucd-compiler.js';
import { UcdHandlerFeature, UcdHandlerSetup } from './ucd-handler-feature.js';

export function ucdSupportNonFinite(compiler: UcdCompiler.Any): UccConfig {
  return {
    configure() {
      compiler
        .handleEntity('Infinity', handleUcdNonFinite('ucdInfinity'))
        .handleEntity('-Infinity', handleUcdNonFinite('ucdNegativeInfinity'))
        .handleEntity('NaN', handleUcdNonFinite('ucdNaN'));
    },
  };
}

function handleUcdNonFinite(reader: string): UcdHandlerFeature {
  return ({ register, refer }: UcdHandlerSetup) => {
    const readEntity = UC_MODULE_DESERIALIZER.import(reader);

    refer(readEntity);

    return register(readEntity);
  };
}
