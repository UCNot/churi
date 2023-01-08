export class UrtMemory {

  readonly #blockSize: number;
  readonly #blocks: UcsMemoryBlock[];
  #nextBlockIdx = 0;

  constructor(blockSize = 4096, blockCount = 2) {
    this.#blockSize = blockSize;
    this.#blocks = new Array(Math.max(blockCount, 2));
    this.#blocks[0] = this.#allocateBlock();
  }

  async use<T>(size: number, use: (buffer: Uint8Array) => T | Promise<T>): Promise<T> {
    size = Math.min(size, this.#blockSize);

    const block = this.#selectBlock(size);

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
    return this.#blocks[this.#nextBlockIdx] ?? this.#allocateBlock();
  }

  #allocateBlock(): UcsMemoryBlock {
    return (this.#blocks[this.#nextBlockIdx] = new UcsMemoryBlock(this.#blockSize));
  }

  async #use<T>(
    block: UcsMemoryBlock,
    size: number,
    use: (buffer: Uint8Array) => T | Promise<T>,
  ): Promise<T> {
    const used = await block.use(size);
    const blockIdx = this.#nextBlockIdx;

    try {
      return await use(used);
    } finally {
      if (block.free(size) && this.#nextBlockIdx === blockIdx) {
        // All space freed.
        // Reset to the first block to avoid extra allocations.
        this.#nextBlockIdx = 0;
      }
    }
  }

}

class UcsMemoryBlock {

  readonly #space: Uint8Array;
  #reserved = 0;
  #free = 0;
  #whenAvailable?: Promise<void>;
  #moreAvailable?: () => void;

  constructor(size: number) {
    this.#space = new Uint8Array(size);
  }

  has(size: number): boolean {
    return this.#space.length - this.#reserved >= size;
  }

  async use(size: number): Promise<Uint8Array> {
    while (!this.has(size)) {
      if (!this.#whenAvailable) {
        this.#whenAvailable = new Promise(resolve => {
          this.#moreAvailable = resolve;
        });
      }

      await this.#whenAvailable;
    }

    return this.#use(size);
  }

  #use(size: number): Uint8Array {
    const end = this.#reserved + size;
    const used = this.#space.subarray(this.#reserved, end);

    this.#reserved = end;

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
