import { EsExternalModule } from 'esgen';
import { CHURI_MODULE, SPEC_MODULE } from '../../impl/module-names.js';

export const UC_MODULE_CHURI = /*#__PURE__*/ EsExternalModule.byName(CHURI_MODULE);
export const UC_MODULE_DESERIALIZER =
  /*#__PURE__*/ EsExternalModule.byName('churi/deserializer.js');
export const UC_MODULE_DESERIALIZER_DEFAULTS = /*#__PURE__*/ EsExternalModule.byName(
  'churi/deserializer/defaults.js',
);
export const UC_MODULE_DESERIALIZER_META = /*#__PURE__*/ EsExternalModule.byName(
  'churi/deserializer/meta.js',
);
export const UC_MODULE_SERIALIZER = /*#__PURE__*/ EsExternalModule.byName('churi/serializer.js');
export const UC_MODULE_VALIDATOR = /*#__PURE__*/ EsExternalModule.byName('churi/validator.js');
export const UC_MODULE_SPEC = /*#__PURE__*/ EsExternalModule.byName(SPEC_MODULE);
export const UC_MODULE_UC_VALUE_DESERIALIZER = /*#__PURE__*/ EsExternalModule.byName(
  '#churi/uc-value/deserializer.js',
);
export const UC_MODULE_URI_CHARGE = /*#__PURE__*/ EsExternalModule.byName('#churi/uri-charge.js');
