export {};

declare global {
  const Deno: {
    env: {
      get(key: string): string | undefined;
    };
    serve(
      handler:
        | ((request: Request) => Response | Promise<Response>)
        | { fetch(request: Request): Response | Promise<Response> }
    ): void;
  };
}
