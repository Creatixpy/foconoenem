// Invalidates every completion path, including catch/finally, when the input changes.
export function createLatestRequest() {
  let current: AbortController | null = null;
  return {
    begin() {
      current?.abort();
      const controller = new AbortController();
      current = controller;
      return {
        signal: controller.signal,
        isCurrent: () => current === controller && !controller.signal.aborted,
        finish: () => { if (current === controller) current = null; },
      };
    },
    cancel() { current?.abort(); current = null; },
    isPending: () => current !== null,
  };
}

export function deduplicateById<T extends { id: string }>(items: T[]): T[] {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}
