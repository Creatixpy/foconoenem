import 'server-only';

export async function mapWithConcurrency<T, TResult>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T) => Promise<TResult>
): Promise<TResult[]> {
  const results = new Array<TResult>(items.length);
  let nextIndex = 0;
  let failed = false;
  let failure: unknown;

  async function worker() {
    while (!failed && nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      try {
        results[index] = await mapper(items[index]);
      } catch (error) {
        if (!failed) failure = error;
        failed = true;
      }
    }
  }

  // Finish already-started work before returning; a failed request must not
  // keep scheduling AI generation or catalog writes in the background.
  await Promise.all(
    Array.from({ length: Math.min(Math.max(1, concurrency), items.length) }, () => worker())
  );
  if (failed) throw failure;
  return results;
}
