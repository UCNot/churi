import { MetaUcrx } from '../rx/meta.ucrx.js';
import { OpaqueUcrx } from '../rx/opaque.ucrx.js';
import { UcrxContext } from '../rx/ucrx-context.js';
import { Ucrx } from '../rx/ucrx.js';
import { UcDeserializer } from '../schema/uc-deserializer.js';
import { UcError, UcErrorInfo } from '../schema/uc-error.js';
import { UcToken } from '../syntax/uc-token.js';

export abstract class UcdReader {

  readonly #opaqueRx: Ucrx;
  readonly #onError: (error: UcErrorInfo) => void;
  readonly #entities: Exclude<UcdReader.Options['entities'], undefined>;
  readonly #formats: Exclude<UcdReader.Options['formats'], undefined>;
  readonly #onMeta: MetaUcrx;

  constructor(options?: UcDeserializer.Options);

  constructor({
    onError = UcdReader$throwOnError,
    entities = {},
    formats = {},
    onMeta = UcdReader$noMeta,
    opaqueRx = OPAQUE_UCRX,
  }: UcdReader.Options = {}) {
    this.#opaqueRx = opaqueRx;
    this.#onError = onError;
    this.#entities = entities;
    this.#formats = formats;
    this.#onMeta = onMeta;
  }

  get opaqueRx(): Ucrx {
    return this.#opaqueRx;
  }

  abstract hasNext(): boolean;

  abstract current(): UcToken | undefined;

  abstract hasPrev(): boolean;

  abstract prev(): readonly UcToken[];

  error(error: UcErrorInfo): void {
    this.#onError(error);
  }

  abstract read(rx: Ucrx): Promise<void> | void;

  get entities(): Exclude<UcdReader.Options['entities'], undefined> {
    return this.#entities;
  }

  get formats(): Exclude<UcdReader.Options['formats'], undefined> {
    return this.#formats;
  }

  get onMeta(): MetaUcrx {
    return this.#onMeta;
  }

  abstract next(): Promise<UcToken | undefined> | UcToken | undefined;

  abstract find(
    matcher: (token: UcToken) => boolean | null | undefined,
  ): Promise<UcToken | undefined> | UcToken | undefined;

  abstract consume(): UcToken[];

  abstract consumePrev(): UcToken[];

  abstract skip(): void;

  abstract omitPrev(): void;

  abstract done(): void;

}

export namespace UcdReader {
  export interface Options extends UcDeserializer.Options {
    readonly opaqueRx?: Ucrx | undefined;
  }
}

function UcdReader$throwOnError(error: unknown): never {
  throw UcError.create(error);
}

function UcdReader$noMeta(_cx: UcrxContext, _rx: Ucrx, _attr: string): undefined {
  // Unrecognized meta attribute.
}

const OPAQUE_UCRX = /*#__PURE__*/ new OpaqueUcrx();
