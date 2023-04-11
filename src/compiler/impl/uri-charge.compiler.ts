import { CHURI_MODULE, URI_CHARGE_MODULE } from '../../impl/module-names.js';
import { jsStringLiteral } from '../../impl/quote-property-key.js';
import { UcList } from '../../schema/list/uc-list.js';
import { UcMap } from '../../schema/map/uc-map.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { ucUnknown } from '../../schema/unknown/uc-unknown.js';
import { URICharge } from '../../schema/uri-charge/uri-charge.js';
import { UccArgs } from '../codegen/ucc-args.js';
import { UccSource } from '../codegen/ucc-code.js';
import { ListUcrxTemplate } from '../deserialization/list.ucrx-template.js';
import { MapUcrxEntry } from '../deserialization/map.ucrx-entry.js';
import { MapUcrxTemplate } from '../deserialization/map.ucrx-template.js';
import { UcdLib } from '../deserialization/ucd-lib.js';
import { UcdSetup } from '../deserialization/ucd-setup.js';
import { UnknownUcrxTemplate } from '../deserialization/unknown.ucrx-template.js';
import { UcrxCore } from '../rx/ucrx-core.js';
import { UcrxMethod } from '../rx/ucrx-method.js';
import { UcrxSetter, isUcrxSetter } from '../rx/ucrx-setter.js';

export async function createURIChargeUcdLib(): Promise<
  UcdLib<{ parseURICharge: UcSchema<URICharge> }>
> {
  return await new UcdSetup({
    schemae: { parseURICharge: ucUnknown() as UcSchema<URICharge> },
    features(setup) {
      setup
        .useUcrxTemplate('unknown', (lib, schema) => new URIChargeUcrxTemplate(lib, schema))
        .useUcrxTemplate(
          'list',
          (lib, schema: UcList.Schema) => new URIChargeListUcrxTemplate(lib, schema),
        )
        .useUcrxTemplate(
          'map',
          (lib, schema: UcMap.Schema) => new URIChargeMapUcrxTemplate(lib, schema),
        );
    },
  }).bootstrap();
}

class URIChargeListUcrxTemplate extends ListUcrxTemplate {

  override addNull({ addItem }: ListUcrxTemplate.Allocation): UccSource {
    const URICharge$Single = this.lib.import(URI_CHARGE_MODULE, 'URICharge$Single');

    return addItem.call('this', { item: `new ${URICharge$Single}(null, 'null')` }) + ';';
  }

  override storeItems({ setList, items }: ListUcrxTemplate.Allocation): UccSource {
    const URICharge$List = this.lib.import(URI_CHARGE_MODULE, 'URICharge$List');

    return `${setList}(new ${URICharge$List}(${items}));`;
  }

}

class URIChargeMapUcrxTemplate extends MapUcrxTemplate {

  override createEntry(key: string | null, schema: UcSchema<unknown>): URIChargeMapUcrxEntry {
    return new URIChargeMapUcrxEntry(this, key, schema);
  }

  override allocateMap(prefix: string, suffix: string): UccSource {
    return `${prefix}new Map()${suffix}`;
  }

  override storeMap(setter: string, { map }: MapUcrxTemplate.Allocation): UccSource {
    const URICharge$Map = this.lib.import(URI_CHARGE_MODULE, 'URICharge$Map');

    return `${setter}(new ${URICharge$Map}(${map}[0]));`;
  }

}

class URIChargeMapUcrxEntry extends MapUcrxEntry {

  override setEntry(map: string, key: string, value: string): UccSource {
    return `${map}.set(${key}, ${value});`;
  }

}

class URIChargeUcrxTemplate extends UnknownUcrxTemplate {

  protected override setValue<TArg extends string>(
    _allocation: UnknownUcrxTemplate.Allocation,
    method: UcrxMethod<TArg>,
    args: UccArgs.ByName<TArg>,
  ): UccSource {
    switch (method as UcrxMethod<any>) {
      case UcrxCore.ent:
        return this.#setEntity(UcrxCore.ent, args as UccArgs.ByName<UcrxSetter.Arg>);
      case UcrxCore.nul:
        return this.#setNull();
      default:
        if (isUcrxSetter(method)) {
          return this.#setValue(method, args as UccArgs.ByName<UcrxSetter.Arg>);
        }

        // istanbul ignore next
        throw new TypeError(`Unsupported URICharge method: ${method}`);
    }
  }

  #setValue(method: UcrxSetter, { value }: UccArgs.ByName<UcrxSetter.Arg>): UccSource {
    const type = jsStringLiteral(method.typeName!);
    const URICharge$Single = this.lib.import(URI_CHARGE_MODULE, 'URICharge$Single');

    return `return ${method.toMethod(this.lib).call('super', {
      value: `new ${URICharge$Single}(${value}, ${type})`,
    })};`;
  }

  #setEntity(method: UcrxSetter, { value }: UccArgs.ByName<UcrxSetter.Arg>): UccSource {
    const type = jsStringLiteral(method.typeName!);
    const UcEntity = this.lib.import(CHURI_MODULE, 'UcEntity');
    const printUcTokens = this.lib.import(CHURI_MODULE, 'printUcTokens');
    const URICharge$Single = this.lib.import(URI_CHARGE_MODULE, 'URICharge$Single');

    return `return this.any(new ${URICharge$Single}(new ${UcEntity}(${printUcTokens}(${value})), ${type}));`;
  }

  #setNull(): UccSource {
    const URICharge$Single = this.lib.import(URI_CHARGE_MODULE, 'URICharge$Single');

    return `return this.any(new ${URICharge$Single}(null, 'null'));`;
  }

  protected override addItem<TArg extends string>(
    allocation: UnknownUcrxTemplate.Allocation,
    method: UcrxMethod<TArg>,
    args: UccArgs.ByName<TArg>,
  ): UccSource {
    if ((method as UcrxMethod<any>) === UcrxCore.nul) {
      return this.#addNull(allocation);
    }
    if (isUcrxSetter(method)) {
      return this.#addValue(allocation, method, args as UccArgs.ByName<UcrxSetter.Arg>);
    }

    // istanbul ignore next
    throw new TypeError(`Unsupported URICharge method: ${method}`);
  }

  #addValue(
    { listRx }: UnknownUcrxTemplate.Allocation,
    method: UcrxSetter,
    args: UccArgs.ByName<UcrxSetter.Arg>,
  ): UccSource {
    return `return ${method.toMethod(this.lib).call(listRx, args)};`;
  }

  #addNull({ listRx }: UnknownUcrxTemplate.Allocation): UccSource {
    return `return ${listRx}.nul();`;
  }

}
