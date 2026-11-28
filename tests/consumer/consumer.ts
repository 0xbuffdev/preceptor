import type * as preceptor from "@0xbuff/preceptor";

type AssertEmpty<T extends never> = T;
export type FoundationExports = AssertEmpty<keyof typeof preceptor>;
