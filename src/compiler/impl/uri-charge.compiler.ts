import { EsCode, EsSignature, EsSnippet, esStringLiteral, esline } from 'esgen';
import { UcList } from '../../schema/list/uc-list.js';
import { UcMap } from '../../schema/map/uc-map.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { ucUnknown } from '../../schema/unknown/uc-unknown.js';
import { URICharge } from '../../schema/uri-charge/uri-charge.js';
import { ListUcrxClass } from '../deserialization/list.ucrx.class.js';
import { MapUcrxClass, MapUcrxStore } from '../deserialization/map.ucrx.class.js';
import { UcdCompiler } from '../deserialization/ucd-compiler.js';
import { UcdLib } from '../deserialization/ucd-lib.js';
import { ucdSupportDefaults } from '../deserialization/ucd-support-defaults.js';
import { UnknownUcrxClass } from '../deserialization/unknown.ucrx.class.js';
import { UcrxCore } from '../rx/ucrx-core.js';
import { UcrxEntitySetterSignature } from '../rx/ucrx-entity-setter.js';
import { UcrxFormattedSetterSignature } from '../rx/ucrx-formatted-setter.js';
import { UcrxBeforeMod, UcrxMethod } from '../rx/ucrx-method.js';
import { UcrxSetter, UcrxSetterSignature, isUcrxSetter } from '../rx/ucrx-setter.js';
import {
  UC_MODULE_CHURI,
  UC_MODULE_UC_VALUE_DESERIALIZER,
  UC_MODULE_URI_CHARGE,
} from './uc-modules.js';

export class URIChargeCompiler extends UcdCompiler<{
  parseURICharge: ['sync', UcSchema<URICharge>];
}> {

  constructor() {
    super({
      models: { parseURICharge: ['sync', ucUnknown() as UcSchema<URICharge>] },
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

  override async bootstrapOptions(): Promise<
    UcdLib.Options<{ parseURICharge: ['sync', UcSchema<URICharge>] }>
  > {
    const options = await super.bootstrapOptions();

    return {
      ...options,
      onMeta: UC_MODULE_UC_VALUE_DESERIALIZER.import('onMeta$byDefault'),
    };
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

  protected override setValue<TArgs extends EsSignature.Args, TMod extends UcrxBeforeMod<TArgs>>(
    method: UcrxMethod<TArgs, TMod>,
    args: EsSignature.ValuesOf<TArgs>,
  ): EsSnippet {
    switch (method as UcrxMethod<any>) {
      case UcrxCore.att:
        return EsCode.none;
      case UcrxCore.ent:
        return this.#setEntity(args as UcrxEntitySetterSignature.Values);
      case UcrxCore.fmt:
        return this.#setFormatted(args as UcrxFormattedSetterSignature.Values);
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

  #setEntity({ name, cx }: UcrxEntitySetterSignature.Values): EsSnippet {
    const UcEntity = UC_MODULE_CHURI.import('UcEntity');
    const URICharge$Single = UC_MODULE_URI_CHARGE.import('URICharge$Single');

    return code => {
      code.line(
        'return this.any(',
        esline`new ${URICharge$Single}(new ${UcEntity}(${name}), 'entity', ${cx}.meta)`,
        ');',
      );
    };
  }

  #setFormatted({ format, data, cx }: UcrxFormattedSetterSignature.Values): EsSnippet {
    const UcFormatted = UC_MODULE_CHURI.import('UcFormatted');
    const URICharge$Single = UC_MODULE_URI_CHARGE.import('URICharge$Single');

    return code => {
      code.line(
        'return this.any(',
        esline`new ${URICharge$Single}(new ${UcFormatted}(${format}, ${data}), 'formatted', ${cx}.meta)`,
        ');',
      );
    };
  }

  #setNull({ cx }: { cx: EsSnippet }): EsSnippet {
    const URICharge$Single = UC_MODULE_URI_CHARGE.import('URICharge$Single');

    return esline`return this.any(new ${URICharge$Single}(null, 'null', ${cx}.meta));`;
  }

}
