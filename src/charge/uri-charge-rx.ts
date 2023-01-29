import { type UcPrimitive } from '../schema/uc-primitive.js';

/**
 * URI charge receiver.
 *
 * Implements a visitor pattern. May be used to build the {@link URIChargeParser parsed} charge representation,
 * to build the charge representation manually, or to walk through existing charge.
 *
 * This is a top-level charge visitor. More receiver may be constructed specific to various charge kinds.
 *
 * @typeParam TValue - Base value type contained in URI charge. {@link UcPrimitive} by default.
 * @typeParam TCharge - URI charge representation type.
 */
export interface URIChargeRx<out TValue = UcPrimitive, out TCharge = unknown> {
  /**
   * The absent charge representation.
   */
  readonly none: TCharge;

  /**
   * Creates an entity charge out of raw string.
   *
   * @param rawEntity - The entity as is, with leading `!`. _Not_ URI-decoded.
   *
   * @returns URI charge representing entity.
   */
  createEntity(rawEntity: string): TCharge;

  /**
   * Creates a charge out of base value.
   *
   * @param value - Base value.
   * @param type - Base value type.
   *
   * @returns URI charge representing the given `value` with the given `type`.
   */
  createValue(value: TValue | UcPrimitive, type: string): TCharge;

  /**
   * Builds a charge out of visited value(s).
   *
   * @param build - Charge builder function accepting value receiver and building a charge with it.
   *
   * @returns Built charge.
   */
  rxValue(build: (rx: URIChargeRx.ValueRx<TValue, TCharge>) => TCharge): TCharge;

  /**
   * Builds a charge out of visited map entries.
   *
   * @param build - Charge builder function accepting map entries receiver and building a charge with it.
   *
   * @returns Built charge.
   */
  rxMap(build: (rx: URIChargeRx.MapRx<TValue, TCharge>) => TCharge): TCharge;

  /**
   * Builds a charge out of visited list items.
   *
   * @param build - Charge builder function accepting list items receiver and building a charge with it.
   *
   * @returns Built charge.
   */
  rxList(build: (rx: URIChargeRx.ValueRx<TValue, TCharge>) => TCharge): TCharge;
}

export namespace URIChargeRx {
  export interface Namespace {
    readonly ValueRx: ValueRx.Constructor;
    readonly MapRx: MapRx.Constructor;
  }

  /**
   * Initial options for {@link OpaqueURIChargeRx URI charge receiver}.
   *
   * @typeParam TCharge - URI charge representation type.
   */
  export interface Init<out TCharge> {
    /**
     * The absent charge representation.
     */
    readonly none: TCharge;
  }

  /**
   * URI charge value(s) receiver.
   *
   * Implements a visitor pattern.
   *
   * First, the source charge(s) added by corresponding methods. While the result charge is built when the
   * {@link URIChargeRx.ValueRx#end end()} method called.
   *
   * Used in two flavours:
   *
   * - To receive single charge. In this case any added charge replaces preceding one.
   * - To receive a list. In this case any added charge represents additional list item.
   *
   * In the former case, the receiver may be {@link URIChargeRx.ValueRx#asList converted} to list receiver.
   *
   * @typeParam TValue - Base value type contained in URI charge. {@link UcPrimitive} by default.
   * @typeParam TCharge - URI charge representation type.
   * @typeParam TRx - Type of top-level URI charge receiver.
   */
  export interface ValueRx<
    out TValue = UcPrimitive,
    out TCharge = unknown,
    out TRx extends URIChargeRx<TValue, TCharge> = URIChargeRx<TValue, TCharge>,
  > {
    /**
     * Top-level URI charge receiver.
     */
    readonly chargeRx: TRx;

    /**
     * Adds the value charge.
     *
     * @param charge - Added charge.
     */
    add(charge: TCharge): void;

    /**
     * Adds the entity.
     *
     * @param rawEntity - The entity as is, with leading `!`. _Not_ URI-decoded.
     */
    addEntity(rawEntity: string): void;

    /**
     * Adds the base value.
     *
     * @param value - Base value.
     * @param type - Base value type.
     */
    addValue(value: UcPrimitive | TValue, type: string): void;

    /**
     * Adds a charge built out of visited map entries.
     *
     * @param build - Charge builder function accepting map entries receiver and building a charge with it.
     */
    rxMap(build: (rx: URIChargeRx.MapRx<TValue, TCharge>) => TCharge): void;

    /**
     * Adds a charge built out of visited list items.
     *
     * @param build - Charge builder function accepting list items receiver and building a charge with it.
     */
    rxList(build: (rx: URIChargeRx.ValueRx<TValue, TCharge>) => TCharge): void;

    /**
     * Converts this receiver to list items receiver.
     *
     * For single charge receiver the already added charge, if any, becomes the first item of the received list.
     *
     * For the list receiver this method does nothing.
     */
    asList(): void;

    /**
     * Ends receiving charges and creates the result charge.
     *
     * @returns Result charge.
     */
    end(): TCharge;
  }

  export namespace ValueRx {
    /**
     * Constructs an URI charge value(s) receiver.
     *
     * @typeParam TValue - Base value type contained in URI charge. {@link UcPrimitive} by default.
     * @typeParam TCharge - URI charge representation type.
     * @typeParam TRx - Type of top-level URI charge receiver.
     * @param chargeRx - Top-level URI charge receiver.
     */
    export type Constructor = new <
      TValue = UcPrimitive,
      TCharge = unknown,
      TRx extends URIChargeRx<TValue, TCharge> = URIChargeRx<TValue, TCharge>,
    >(
      chargeRx: TRx,
    ) => ValueRx<TValue, TCharge, TRx>;
  }

  /**
   * URI charge map entries receiver.
   *
   * Implements a visitor pattern.
   *
   * Builds {@link URIChargeRx.MapRx#rxEntry entry value charges} first. The result charge is built when the
   * {@link URIChargeRx.MapRx#endMap endMap()} method called.
   *
   * @typeParam TValue - Base value type contained in URI charge. {@link UcPrimitive} by default.
   * @typeParam TCharge - URI charge representation type.
   * @typeParam TRx - Type of top-level URI charge receiver.
   */
  export interface MapRx<
    out TValue = UcPrimitive,
    out TCharge = unknown,
    out TRx extends URIChargeRx<TValue, TCharge> = URIChargeRx<TValue, TCharge>,
  > {
    /**
     * Top-level URI charge receiver.
     */
    readonly chargeRx: TRx;

    /**
     * Adds an entry charge built out of visited entry value(s).
     *
     * @param build - Charge builder function accepting entry value(s) receiver and building a charge with it.
     */
    rxEntry(key: string, build: (rx: URIChargeRx.ValueRx<TValue, TCharge>) => TCharge): void;

    /**
     * Adds a map suffix.
     *
     * Typically, this is the same as adding an entry with `suffix` key and empty map as value.
     *
     * @param suffix - Map suffix.
     */
    addSuffix(suffix: string): void;

    /**
     * Ends receiving entry charges and creates the result charge.
     *
     * @returns Result charge.
     */
    endMap(): TCharge;
  }

  export namespace MapRx {
    /**
     * Constructs an URI charge map entries receiver.
     *
     * @typeParam TValue - Base value type contained in URI charge. {@link UcPrimitive} by default.
     * @typeParam TCharge - URI charge representation type.
     * @typeParam TRx - Type of top-level URI charge receiver.
     * @param chargeRx - Top-level URI charge receiver.
     */
    export type Constructor = new <
      TValue = UcPrimitive,
      TCharge = unknown,
      TRx extends URIChargeRx<TValue, TCharge> = URIChargeRx<TValue, TCharge>,
    >(
      chargeRx: TRx,
    ) => MapRx<TValue, TCharge, TRx>;
  }
}
