import { SchemaVisitorResult } from "../app";
import { Documentlike } from "../types";
import { Resolver } from "./resolver";

export type SchemaConfig = Record<string, Documentlike>;

export type QueriesConfig<T extends object> = Record<string, (ctx: Record<keyof T, SchemaVisitorResult>) => string>;

export type Config<T extends SchemaConfig = Record<string, any>> = {
  schemas: T;
  queries: QueriesConfig<T>;
  resolvers?: Record<string, Resolver>;
};

export type UserOptions = {
  outPath?: string;
  defaultExtenstion?: string;
  inlineResolver?: boolean;
};

export type Options<T extends UserOptions = UserOptions> = {
  [P in keyof T]-?: T[P];
};

export type CreateConfigReturn<T extends Record<string, any>> = { config: Config<T>; options?: UserOptions };

export function createConfig<T extends Record<string, any>>(config: Config<T>, options?: UserOptions): CreateConfigReturn<T> {
  return { config, options };
}
