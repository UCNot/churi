import { UC_MODULE_DESERIALIZER } from '../impl/uc-modules.js';
import { UccConfig } from '../processor/ucc-config.js';
import { UcdCompiler } from './ucd-compiler.js';
import { UcdDefaultsFeature, UcdDefaultsSetup } from './ucd-defaults-feature.js';

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

function handleUcdNonFinite(reader: string): UcdDefaultsFeature {
  return ({ register, refer }: UcdDefaultsSetup) => {
    const readEntity = UC_MODULE_DESERIALIZER.import(reader);

    refer(readEntity);

    return register(readEntity);
  };
}
