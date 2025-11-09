import '@supabase/postgrest-js';

declare module '@supabase/postgrest-js' {
  interface PostgrestBuilder<Row, Result, Relationships> {
    abortSignal(signal: AbortSignal): PostgrestBuilder<Row, Result, Relationships>;
    single(): PostgrestBuilder<Row, Result, Relationships>;
    maybeSingle(): PostgrestBuilder<Row, Result, Relationships>;
    limit(count: number, options?: { foreignTable?: keyof Relationships }): PostgrestBuilder<Row, Result, Relationships>;
    eq(column: string, value: unknown): PostgrestBuilder<Row, Result, Relationships>;
    order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean; referencedTable?: keyof Relationships }): PostgrestBuilder<Row, Result, Relationships>;
  }
}
