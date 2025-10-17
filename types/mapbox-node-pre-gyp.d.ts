/**
 * Type declarations for @mapbox/node-pre-gyp
 * This module is used by DuckDB but doesn't have official TypeScript types
 */

declare module '@mapbox/node-pre-gyp' {
  export const find: (path: string) => string;
  export const install: (options: any) => Promise<void>;
  export const reveal: (options: any) => string;
  export const testbinary: (options: any) => void;
  export const testpackage: (options: any) => void;
  export const unpublish: (options: any) => Promise<void>;
  export const publish: (options: any) => Promise<void>;
}

declare module '@mapbox/node-pre-gyp/lib/util/nw-pre-gyp' {
  export default any;
}

declare module '@mapbox/node-pre-gyp/lib/util/nw-pre-gyp/index.html' {
  const content: string;
  export default content;
}
