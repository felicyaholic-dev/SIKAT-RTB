// "server-only" is Next.js's own bundler-time guard — it only exists as a
// virtual module inside Next's webpack config, not as a real npm package,
// so plain Node/Vitest can't resolve it. This empty stub, aliased in
// vitest.config.ts, lets lib/*.ts's `import "server-only"` no-op under
// tests instead of failing to resolve.
export {};
