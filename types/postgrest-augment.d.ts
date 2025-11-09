import '@supabase/postgrest-js';

declare module '@supabase/postgrest-js' {
  interface PostgrestBuilder<Row = any, Result = Row[], Relationships = Record<string, unknown>> {
    abortSignal(signal: AbortSignal): PostgrestBuilder<Row, Result, Relationships>;
    single(): PostgrestBuilder<Row, Row, Relationships>;
    maybeSingle(): PostgrestBuilder<Row | null, Row | null, Relationships>;
    limit(count: number, options?: { foreignTable?: keyof Relationships }): PostgrestBuilder<Row, Result, Relationships>;
    eq(column: string, value: unknown): PostgrestBuilder<Row, Result, Relationships>;
    order(
      column: string,
      options?: { ascending?: boolean; nullsFirst?: boolean; referencedTable?: keyof Relationships }
    ): PostgrestBuilder<Row, Result, Relationships>;
  }
}
