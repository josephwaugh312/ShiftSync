declare module 'uuid' {
  export const v4: () => string;
  export const v1: () => string;
  export const v3: (name: string | Buffer, namespace: string | Buffer) => string;
  export const v5: (name: string | Buffer, namespace: string | Buffer) => string;
  export const NIL: string;
} 