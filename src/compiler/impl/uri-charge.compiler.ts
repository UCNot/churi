import { EsSignature, EsSnippet, esStringLiteral, esline } from 'esgen';
import { UcList } from '../../schema/list/uc-list.js';
import { UcMap } from '../../schema/map/uc-map.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { ucUnknown } from '../../schema/unknown/uc-unknown.js';
import { URICharge } from '../../schema/uri-charge/uri-charge.js';
import { ListUcrxClass } from '../deserialization/list.ucrx.class.js';
import { MapUcrxClass, MapUcrxStore } from '../deserialization/map.ucrx.class.js';
import { UcdSetup } from '../deserialization/ucd-setup.js';
import { ucdSupportDefaults } from '../deserialization/ucd-support-defaults.js';
import { UnknownUcrxClass } from '../deserialization/unknown.ucrx.class.js';
import { UcrxCore } from '../rx/ucrx-core.js';
import { UcrxMethod } from '../rx/ucrx-method.js';
import { UcrxSetter, UcrxSetterSignature, isUcrxSetter } from '../rx/ucrx-setter.js';
import { UC_MODULE_CHURI, UC_MODULE_URI_CHARGE } from './uc-modules.js';

export class URIChargeCompiler extends UcdSetup<{ parseURICharge: UcSchema<URICharge> }, 'sync'> {

  constructor() {
    super({
      models: { parseURICharge: ucUnknown() as UcSchema<URICharge> },
      mode: 'sync',
      features(setup) {
        setup
          .enable(ucdSupportDefaults)
          .useUcrxClass('unknown', (lib, schema) => new URIChargeUcrxClass(lib, schema))
          .useUcrxClass(
            'list',
            (lib, schema: UcList.Schema) => new URIChargeListUcrxClass(lib, schema),
          )
          .useUcrxClass(
            'map',
            (lib, schema: UcMap.Schema) => new URIChargeMapUcrxClass(lib, schema),
          );
      },
    });
  }

}

class URIChargeListUcrxClass extends ListUcrxClass {

  protected override createNullItem(): EsSnippet {
    const URICharge$Single = UC_MODULE_URI_CHARGE.import('URICharge$Single');

    return esline`new ${URICharge$Single}(null, 'null')`;
  }

  protected override createList(): EsSnippet {
    const URICharge$List = UC_MODULE_URI_CHARGE.import('URICharge$List');

    return esline`new ${URICharge$List}(${super.createList()})`;
  }

}

class URIChargeMapUcrxClass extends MapUcrxClass {

  override allocateStore(): MapUcrxStore {
    return new URIChargeMapUcrxStore();
  }

}

class URIChargeMapUcrxStore implements MapUcrxStore {

  init(): EsSnippet {
    return `new Map()`;
  }

  setEntry(map: EsSnippet, key: EsSnippet, value: EsSnippet): EsSnippet {
    return esline`${map}.set(${key}, ${value});`;
  }

  store(map: EsSnippet): EsSnippet {
    const URICharge$Map = UC_MODULE_URI_CHARGE.import('URICharge$Map');

    return esline`new ${URICharge$Map}(${map})`;
  }

  reclaim(_map: EsSnippet): EsSnippet {
    return this.init();
  }

}

class URIChargeUcrxClass extends UnknownUcrxClass {

  protected override setValue<TArgs extends EsSignature.Args>(
    method: UcrxMethod<TArgs>,
    args: EsSignature.ValuesOf<TArgs>,
  ): EsSnippet {
    switch (method as UcrxMethod<any>) {
      case UcrxCore.ent:
        return this.#setEntity(UcrxCore.ent, args as UcrxSetterSignature.Values);
      case UcrxCore.nul:
        return this.#setNull();
      default:
        if (isUcrxSetter(method)) {
          return this.#setValue(method, args as UcrxSetterSignature.Values);
        }

        // istanbul ignore next
        throw new TypeError(`Unsupported URICharge method: ${method}`);
    }
  }

  #setValue(setter: UcrxSetter, { value, reject }: UcrxSetterSignature.Values): EsSnippet {
    const type = esStringLiteral(setter.typeName);
    const URICharge$Single = UC_MODULE_URI_CHARGE.import('URICharge$Single');

    return esline`return ${this.member(setter).call('super', {
      value: esline`new ${URICharge$Single}(${value}, ${type})`,
      reject,
    })};`;
  }

  #setEntity(method: UcrxSetter, { value }: UcrxSetterSignature.Values): EsSnippet {
    const type = esStringLiteral(method.typeName);
    const UcEntity = UC_MODULE_CHURI.import('UcEntity');
    const URICharge$Single = UC_MODULE_URI_CHARGE.import('URICharge$Single');

    return esline`return this.any(new ${URICharge$Single}(new ${UcEntity}(${value}), ${type}));`;
  }

  #setNull(): EsSnippet {
    const URICharge$Single = UC_MODULE_URI_CHARGE.import('URICharge$Single');

    return esline`return this.any(new ${URICharge$Single}(null, 'null'));`;
  }

  protected override addItem<TArgs extends EsSignature.Args>(
    method: UcrxMethod<TArgs>,
    listRx: EsSnippet,
    args: EsSignature.ValuesOf<TArgs>,
  ): EsSnippet {
    if ((method as UcrxMethod<any>) === UcrxCore.nul) {
      return this.#addNull(listRx, args);
    }
    if (isUcrxSetter(method)) {
      return this.#addValue(method, listRx, args as UcrxSetterSignature.Values);
    }

    // istanbul ignore next
    throw new TypeError(`Unsupported URICharge method: ${method}`);
  }

  #addValue(method: UcrxSetter, listRx: EsSnippet, args: UcrxSetterSignature.Values): EsSnippet {
    return esline`return ${this.member(method).call(listRx, args)};`;
  }

  #addNull<TArgs extends EsSignature.Args>(
    listRx: EsSnippet,
    args: EsSignature.ValuesOf<TArgs>,
  ): EsSnippet;

  #addNull(listRx: EsSnippet, { reject }: { reject: EsSnippet }): EsSnippet {
    return esline`return ${listRx}.nul(${reject});`;
  }

}
