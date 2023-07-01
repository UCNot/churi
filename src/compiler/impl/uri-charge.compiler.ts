import { EsCode, EsSignature, EsSnippet, esStringLiteral, esline } from 'esgen';
import { UcList } from '../../schema/list/uc-list.js';
import { UcMap } from '../../schema/map/uc-map.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { ucUnknown } from '../../schema/unknown/uc-unknown.js';
import { URICharge } from '../../schema/uri-charge/uri-charge.js';
import { ListUcrxClass } from '../deserialization/list.ucrx.class.js';
import { MapUcrxClass, MapUcrxStore } from '../deserialization/map.ucrx.class.js';
import { UcdCompiler } from '../deserialization/ucd-compiler.js';
import { ucdSupportDefaults } from '../deserialization/ucd-support-defaults.js';
import { UnknownUcrxClass } from '../deserialization/unknown.ucrx.class.js';
import { UcrxAttrSetter, UcrxAttrSetterSignature } from '../rx/ucrx-attr-setter.js';
import { UcrxCore } from '../rx/ucrx-core.js';
import { UcrxMethod } from '../rx/ucrx-method.js';
import { UcrxSetter, UcrxSetterSignature, isUcrxSetter } from '../rx/ucrx-setter.js';
import { UC_MODULE_CHURI, UC_MODULE_URI_CHARGE } from './uc-modules.js';

export class URIChargeCompiler extends UcdCompiler<
  { parseURICharge: UcSchema<URICharge> },
  'sync'
> {

  constructor() {
    super({
      models: { parseURICharge: ucUnknown() as UcSchema<URICharge> },
      mode: 'sync',
      features(compiler) {
        return {
          configure: () => {
            compiler
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
        };
      },
    });
  }

}

class URIChargeListUcrxClass extends ListUcrxClass {

  protected override createNullItem(cx: EsSnippet): EsSnippet {
    const URICharge$Single = UC_MODULE_URI_CHARGE.import('URICharge$Single');

    return esline`new ${URICharge$Single}(null, 'null', ${cx}.meta)`;
  }

  protected override createList(cx: EsSnippet): EsSnippet {
    const URICharge$List = UC_MODULE_URI_CHARGE.import('URICharge$List');

    return esline`new ${URICharge$List}(${super.createList(cx)})`;
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

  store(map: EsSnippet, cx: EsSnippet): EsSnippet {
    const URICharge$Map = UC_MODULE_URI_CHARGE.import('URICharge$Map');

    return esline`new ${URICharge$Map}(${map}, ${cx}.meta)`;
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
      case UcrxCore.att:
        return this.#setAttr(UcrxCore.att, args as UcrxAttrSetterSignature.Values);
      case UcrxCore.ent:
        return this.#setEntity(UcrxCore.ent, args as UcrxSetterSignature.Values);
      case UcrxCore.nul:
        return this.#setNull(args as { cx: EsSnippet });
      default:
        if (isUcrxSetter(method)) {
          return this.#setValue(method, args as UcrxSetterSignature.Values);
        }
    }

    // istanbul ignore next
    throw new TypeError(`Unsupported URICharge method: ${method}`);
  }

  #setValue(setter: UcrxSetter, { value, cx }: UcrxSetterSignature.Values): EsSnippet {
    const type = esStringLiteral(setter.typeName);
    const URICharge$Single = UC_MODULE_URI_CHARGE.import('URICharge$Single');

    return esline`return ${this.member(setter).call('super', {
      value: esline`new ${URICharge$Single}(${value}, ${type}, ${cx}.meta)`,
      cx,
    })};`;
  }

  #setAttr(_method: UcrxAttrSetter, _args: UcrxAttrSetterSignature.Values): EsSnippet {
    return EsCode.none;
  }

  #setEntity(method: UcrxSetter, { value, cx }: UcrxSetterSignature.Values): EsSnippet {
    const type = esStringLiteral(method.typeName);
    const UcEntity = UC_MODULE_CHURI.import('UcEntity');
    const URICharge$Single = UC_MODULE_URI_CHARGE.import('URICharge$Single');

    return esline`return this.any(new ${URICharge$Single}(new ${UcEntity}(${value}), ${type}, ${cx}.meta));`;
  }

  #setNull({ cx }: { cx: EsSnippet }): EsSnippet {
    const URICharge$Single = UC_MODULE_URI_CHARGE.import('URICharge$Single');

    return esline`return this.any(new ${URICharge$Single}(null, 'null', ${cx}.meta));`;
  }

  protected override addItem<TArgs extends EsSignature.Args>(
    method: UcrxMethod<TArgs>,
    listRx: EsSnippet,
    args: EsSignature.ValuesOf<TArgs>,
  ): EsSnippet {
    switch (method as UcrxMethod<any>) {
      case UcrxCore.nul:
        return this.#addNull(listRx, args);
      case UcrxCore.att:
        return this.#addAttr(listRx, args);
      default:
        if (isUcrxSetter(method)) {
          return this.#addValue(method, listRx, args as UcrxSetterSignature.Values);
        }
    }

    // istanbul ignore next
    throw new TypeError(`Unsupported URICharge method: ${method}`);
  }

  #addValue(method: UcrxSetter, listRx: EsSnippet, args: UcrxSetterSignature.Values): EsSnippet {
    return esline`return ${this.member(method).call(listRx, args)};`;
  }

  #addAttr<TArgs extends EsSignature.Args>(
    listRx: EsSnippet,
    args: EsSignature.ValuesOf<TArgs>,
  ): EsSnippet;

  #addAttr(listRx: EsSnippet, { attr, cx }: UcrxAttrSetterSignature.Values): EsSnippet {
    return esline`return ${listRx}.att(${attr}, ${cx});`;
  }

  #addNull<TArgs extends EsSignature.Args>(
    listRx: EsSnippet,
    args: EsSignature.ValuesOf<TArgs>,
  ): EsSnippet;

  #addNull(listRx: EsSnippet, { cx }: { cx: EsSnippet }): EsSnippet {
    return esline`return ${listRx}.nul(${cx});`;
  }

}
