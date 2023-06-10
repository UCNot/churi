import { UC_MODULE_DESERIALIZER } from '../impl/uc-modules.js';
import { UccConfig } from '../processor/ucc-config.js';
import { UcdCompiler } from './ucd-compiler.js';
import { UcdEntityFeature, UcdEntitySetup } from './ucd-entity-feature.js';

export function ucdSupportNonFinite(compiler: UcdCompiler.Any): UccConfig {
  return {
    configure() {
      compiler
        .handleEntity('!Infinity', handleUcdNonFinite('ucrxInfinity'))
        .handleEntity('!-Infinity', handleUcdNonFinite('ucrxNegativeInfinity'))
        .handleEntity('!NaN', handleUcdNonFinite('ucrxNaN'));
    },
  };
}

function handleUcdNonFinite(reader: string): UcdEntityFeature {
  return ({ register, refer }: UcdEntitySetup) => {
    const readEntity = UC_MODULE_DESERIALIZER.import(reader);

    refer(readEntity);

    return register(readEntity);
  };
}
