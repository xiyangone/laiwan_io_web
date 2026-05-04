declare module 'bun:test' {
  export function test(name: string, fn: () => void | Promise<void>): void;
  export function beforeEach(fn: () => void | Promise<void>): void;
  export function afterEach(fn: () => void | Promise<void>): void;
  export const expect: {
    <T>(actual: T): {
      toBe(expected: T): void;
      toEqual(expected: unknown): void;
    };
  };
}
