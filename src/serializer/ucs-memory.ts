export class UcsMemory {

  readonly #blockSize: number;
  readonly #blocks: UcsMemoryBlock[];
  #useCount = 0;
  #nextBlockIdx = 0;

  constructor(blockSize = 4096, blockCount = 2) {
    this.#blockSize = blockSize;
    this.#blocks = new Array(Math.max(blockCount, 2));
    this.#blocks[0] = this.#allocateBlock();
  }

  async use<T>(size: number, use: (buffer: Uint8Array) => T | Promise<T>): Promise<T> {
    size = Math.min(size, this.#blockSize);

    const block = this.#selectBlock(size);

    ++this.#useCount;

    return await this.#use(block, size, use);
  }

  #selectBlock(size: number): UcsMemoryBlock {
    const block = this.#blocks[this.#nextBlockIdx];

    if (block.has(size)) {
      // Existing block has enough free space.
      return block;
    }

    // Not enough free space in the block.
    // Select the next one.
    if (++this.#nextBlockIdx >= this.#blocks.length) {
      this.#nextBlockIdx = 0;

      return this.#blocks[0]; // Zero block allocated already.
    }

    // Allocate the next block if necessary.
    return (this.#blocks[this.#nextBlockIdx] ??= this.#allocateBlock());
  }

  #allocateBlock(): UcsMemoryBlock {
    return new UcsMemoryBlock(this.#blockSize);
  }

  async #use<T>(
    block: UcsMemoryBlock,
    size: number,
    use: (buffer: Uint8Array) => T | Promise<T>,
  ): Promise<T> {
    const used = await block.use(size);

    try {
      return await use(used);
    } finally {
      --this.#useCount;
      if (block.free(size) && !this.#useCount) {
        // All space freed.
        // Reset to the first block to avoid extra allocations.
        this.#nextBlockIdx = 0;
      }
    }
  }

}

class UcsMemoryBlock {

  readonly #space: ArrayBuffer;
  #reserved = 0;
  #free = 0;
  #whenAvailable: Promise<void> | undefined;
  #moreAvailable: (() => void) | undefined;

  constructor(size: number) {
    this.#space = new ArrayBuffer(size);
  }

  has(size: number): boolean {
    return this.#space.byteLength - this.#reserved >= size;
  }

  async use(size: number): Promise<Uint8Array> {
    while (!this.has(size)) {
      if (!this.#whenAvailable) {
        this.#whenAvailable = new Promise(resolve => {
          this.#moreAvailable = () => {
            this.#whenAvailable = this.#moreAvailable = undefined;
            resolve();
          };
        });
      }

      await this.#whenAvailable;
    }

    return this.#use(size);
  }

  #use(size: number): Uint8Array {
    const used = new Uint8Array(this.#space, this.#reserved, size);

    this.#reserved += size;

    return used;
  }

  free(size: number): boolean {
    this.#free += size;

    if (this.#free < this.#reserved) {
      // Some space is still used.
      this.#moreAvailable?.();

      return false;
    }

    // No space used any more.
    // Reset the block to start over.
    this.#free = this.#reserved = 0;
    this.#moreAvailable?.();

    return true;
  }

}
