import { type UcPrimitive } from './uc-value.js';

export interface URIChargeRx<out TValue = UcPrimitive, out TCharge = unknown> {
  readonly none: TCharge;

  createEntity(rawEntity: string): TCharge;

  createValue(value: TValue | UcPrimitive, type: string): TCharge;

  rxValue(parse: (rx: URIChargeRx.ValueRx<TValue, TCharge>) => TCharge): TCharge;

  rxMap(parse: (rx: URIChargeRx.MapRx<TValue, TCharge>) => TCharge): TCharge;

  rxList(parse: (rx: URIChargeRx.ListRx<TValue, TCharge>) => TCharge): TCharge;

  rxDirective(
    rawName: string,
    parse: (rx: URIChargeRx.DirectiveRx<TValue, TCharge>) => TCharge,
  ): TCharge;
}

export namespace URIChargeRx {
  export interface Namespace {
    readonly ValueRx: ValueRx.Constructor;
    readonly MapRx: MapRx.Constructor;
    readonly ItemsRx: ItemsRx.Constructor;
    readonly ListRx: ListRx.Constructor;
    readonly DirectiveRx: DirectiveRx.Constructor;
  }

  export interface Init<out TCharge> {
    readonly none: TCharge;
  }

  export type Parser<TRx, TCharge> = {
    parse(this: void, rx: TRx): TCharge;
  }['parse'];

  export interface ValueRx<
    out TValue = UcPrimitive,
    out TCharge = unknown,
    out TRx extends URIChargeRx<TValue, TCharge> = URIChargeRx<TValue, TCharge>,
  > {
    readonly chargeRx: TRx;

    set(charge: TCharge): TCharge;

    setEntity(rawEntity: string): TCharge;

    setValue(value: UcPrimitive | TValue, type: string): TCharge;

    rxMap(parse: (rx: URIChargeRx.MapRx<TValue, TCharge>) => TCharge): TCharge;

    rxList(parse: (rx: URIChargeRx.ListRx<TValue, TCharge>) => TCharge): TCharge;

    rxDirective(
      rawName: string,
      parse: (rx: URIChargeRx.DirectiveRx<TValue, TCharge>) => TCharge,
    ): TCharge;
  }

  export namespace ValueRx {
    export type Constructor = new <
      TValue = UcPrimitive,
      TCharge = unknown,
      TRx extends URIChargeRx<TValue, TCharge> = URIChargeRx<TValue, TCharge>,
    >(
      chargeRx: TRx,
    ) => ValueRx<TValue, TCharge, TRx>;
  }

  export interface MapRx<
    out TValue = UcPrimitive,
    out TCharge = unknown,
    out TRx extends URIChargeRx<TValue, TCharge> = URIChargeRx<TValue, TCharge>,
  > {
    readonly chargeRx: TRx;

    put(key: string, charge: TCharge): void;

    putEntity(key: string, rawEntity: string): void;

    putValue(key: string, value: UcPrimitive | TValue, type: string): void;

    rxMap(key: string, parse: (rx: URIChargeRx.MapRx<TValue, TCharge>) => TCharge): void;

    rxList(key: string, parse: (rx: URIChargeRx.ListRx<TValue, TCharge>) => TCharge): void;

    rxDirective(
      key: string,
      rawName: string,
      parse: (rx: URIChargeRx.DirectiveRx<TValue, TCharge>) => TCharge,
    ): void;

    addSuffix(suffix: string): void;

    endMap(): TCharge;
  }

  export namespace MapRx {
    export type Constructor = new <
      TValue = UcPrimitive,
      TCharge = unknown,
      TRx extends URIChargeRx<TValue, TCharge> = URIChargeRx<TValue, TCharge>,
    >(
      chargeRx: TRx,
    ) => MapRx<TValue, TCharge, TRx>;
  }

  export interface ItemsRx<
    out TValue = UcPrimitive,
    out TCharge = unknown,
    out TRx extends URIChargeRx<TValue, TCharge> = URIChargeRx<TValue, TCharge>,
  > {
    readonly chargeRx: TRx;

    add(charge: TCharge): void;

    addEntity(rawEntity: string): void;

    addValue(value: UcPrimitive | TValue, type: string): void;

    rxMap(parse: (rx: URIChargeRx.MapRx<TValue, TCharge>) => TCharge): void;

    rxList(parse: (rx: URIChargeRx.ListRx<TValue, TCharge>) => TCharge): void;

    rxDirective(
      rawName: string,
      parse: (rx: URIChargeRx.DirectiveRx<TValue, TCharge>) => TCharge,
    ): void;
  }

  export namespace ItemsRx {
    export type Constructor = abstract new <
      TValue = UcPrimitive,
      TCharge = unknown,
      TRx extends URIChargeRx<TValue, TCharge> = URIChargeRx<TValue, TCharge>,
    >(
      chargeRx: TRx,
    ) => ItemsRx<TValue, TCharge, TRx>;
  }

  export interface ListRx<
    out TValue = UcPrimitive,
    out TCharge = unknown,
    out TRx extends URIChargeRx<TValue, TCharge> = URIChargeRx<TValue, TCharge>,
  > extends ItemsRx<TValue, TCharge, TRx> {
    endList(): TCharge;
  }

  export namespace ListRx {
    export type Constructor = new <
      TValue = UcPrimitive,
      TCharge = unknown,
      TRx extends URIChargeRx<TValue, TCharge> = URIChargeRx<TValue, TCharge>,
    >(
      chargeRx: TRx,
    ) => ListRx<TValue, TCharge, TRx>;
  }

  export interface DirectiveRx<
    out TValue = UcPrimitive,
    out TCharge = unknown,
    out TRx extends URIChargeRx<TValue, TCharge> = URIChargeRx<TValue, TCharge>,
  > extends ItemsRx<TValue, TCharge, TRx> {
    readonly rawName: string;

    endDirective(): TCharge;
  }

  export namespace DirectiveRx {
    export type Constructor = new <
      TValue = UcPrimitive,
      TCharge = unknown,
      TRx extends URIChargeRx<TValue, TCharge> = URIChargeRx<TValue, TCharge>,
    >(
      chargeRx: TRx,
      rawName: string,
    ) => DirectiveRx<TValue, TCharge, TRx>;
  }
}
