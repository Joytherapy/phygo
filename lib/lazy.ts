// Creates a client on first use instead of when the module loads (server and
// browser code alike).
//
// Next.js loads every route module while it builds ("Collecting page data").
// A client created at module level (new OpenAI(...), createClient(...)) then
// needs its secrets at build time, so a build without them fails, as in
// Vercel Preview, which by design has none of the Production secrets.
// lazy() defers the factory to the first property access, at request time:
// behaviour in Production is unchanged, and a missing variable now fails the
// request that needs it instead of the whole build.
export function lazy<T extends object>(factory: () => T): T {
  let instance: T | undefined;
  const target = () => (instance ??= factory());
  return new Proxy({} as T, {
    get(_, prop) {
      const real = target();
      const value = Reflect.get(real, prop, real);
      return typeof value === "function" ? value.bind(real) : value;
    },
    has(_, prop) {
      return Reflect.has(target(), prop);
    },
  });
}
