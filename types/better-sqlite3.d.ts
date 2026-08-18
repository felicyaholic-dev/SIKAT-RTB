declare module "better-sqlite3" {
  namespace Database {
    interface RunResult { lastInsertRowid: number | bigint; changes: number; }
    interface Statement { run(...params: unknown[]): RunResult; get(...params: unknown[]): unknown; all(...params: unknown[]): unknown[]; }
    interface Database { pragma(value: string): unknown; exec(sql: string): void; prepare(sql: string): Statement; transaction<T extends (...args: never[]) => unknown>(fn: T): T; close(): void; }
  }
  interface DatabaseConstructor { new (filename: string, options?: { readonly?: boolean }): Database.Database; }
  const Database: DatabaseConstructor;
  export = Database;
}
