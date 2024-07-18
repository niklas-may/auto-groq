import path from "node:path";
import defu from "defu";
import { type Config, defaultOptions, Options, UserOptions } from "./lib/config";
import { FileService } from "./lib/file";
import { Schema, type SchemaContext } from "./lib/schema";
import { SchemaProjection } from "./lib/field";
import { StringLike } from "./types";
import { QueryTransformer, transformPartials } from "./lib/query";
import { ResolverService } from "./lib/resolver";
import consola from "consola";

export interface SchemaVisitorResult {
  projection: StringLike;
}

export type QueryCallbackContext = (args: any) => any;

export class App {
  private options: Options;

  private resolverService: ResolverService;
  private fileService: FileService;
  private queryContext: Record<string, SchemaVisitorResult> = {};
  private queries: Record<string, string> = {};

  private queryTransformer: QueryTransformer[] = [transformPartials];

  constructor(
    private config: Config,
    options?: UserOptions,
  ) {
    this.options = defu(options, defaultOptions);
    this.fileService = new FileService(this.options);
    this.resolverService = new ResolverService(config.resolvers);
  }

  setConfig(config: Config) {
    this.config = config;
  }

  async run() {
    const st = performance.now();
    const queryCount = Object.entries(this.config.queries).length;
    const queryName = queryCount > 1 ? "queries" : "query";
    consola.start(`Found ${queryCount} ${queryName} in config.`);

    this.generateQueries();
    this.processQueries();
    await this.fileService.flush();

    consola.info(`Processed ${this.fileService.store.size} ${this.fileService.store.size > 1 ? "files" : "file"}, updated ${this.fileService.filesWriten}.`);

    const et = performance.now();
    const t = Math.round(et - st);
    consola.success(`Finished in ${t}ms.`);
  }

  private processQueries() {
    for (const [key, baseQuery] of Object.entries(this.queries)) {
      const query = this.queryTransformer.reduce((query, handler) => handler(key, query, { fileService: this.fileService }), baseQuery);

      const file = this.fileService.getOrCreate({
        extension: "ts",
        name: key,
        path: path.join(this.options.outPath, "queries"),
      });

      file.content = query;
    }
  }

  private generateQueries() {
    for (const [key, val] of Object.entries(this.config.schemas)) {
      const schemaContext: SchemaContext = {
        resolverService: this.resolverService,
      };
      const visitor = [new SchemaProjection(schemaContext)];
      const schema = new Schema(schemaContext, val, visitor);

      const queryContext: Record<string, any> = {};
      for (const v of schema.visitor) {
        queryContext[v.id] = v.result;
      }
      this.queryContext[key] = queryContext as SchemaVisitorResult;
    }

    for (const [name, func] of Object.entries(this.config.queries)) {
      this.queries[name] = func(this.queryContext);
    }
  }
}
