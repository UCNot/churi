import { OpaqueUcrx } from '../rx/opaque.ucrx.js';
import { UcrxContext } from '../rx/ucrx-context.js';
import { ucrxUnrecognizedEntityError } from '../rx/ucrx-errors.js';
import { Ucrx } from '../rx/ucrx.js';
import { UcDeserializer } from '../schema/uc-deserializer.js';
import { UcError, UcErrorInfo } from '../schema/uc-error.js';
import { UcToken } from '../syntax/uc-token.js';
import { UcdEntityHandler } from './ucd-entity-handler.js';

export abstract class UcdReader implements UcrxContext {

  readonly #opaqueRx: Ucrx;
  readonly #onError: (error: UcErrorInfo) => void;
  readonly #onEntity: UcdEntityHandler;

  constructor(options?: UcDeserializer.Options);

  constructor({
    onError = UcdReader$throwOnError,
    onEntity = UcdReader$errorOnEntity,
    opaqueRx = OPAQUE_UCRX,
  }: UcdReader.Options = {}) {
    this.#opaqueRx = opaqueRx;
    this.#onError = onError;
    this.#onEntity = onEntity;
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

  entity(rx: Ucrx, entity: readonly UcToken[]): void {
    this.#onEntity(this, rx, entity);
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

function UcdReader$errorOnEntity(reader: UcdReader, _rx: Ucrx, entity: readonly UcToken[]): void {
  reader.error(ucrxUnrecognizedEntityError(entity));
}

const OPAQUE_UCRX = /*#__PURE__*/ new OpaqueUcrx();
