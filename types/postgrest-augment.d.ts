import '@supabase/postgrest-js';

declare module '@supabase/postgrest-js' {
  interface PostgrestBuilder<Row, Result, Relationships> {
    abortSignal(signal: AbortSignal): PostgrestBuilder<Row, Result, Relationships>;
  }
}
