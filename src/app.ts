import path from "path";
import defu from "defu";
import { type Config, defaultOptions, Options, UserOptions } from "./lib/config";
import { FileService } from "./lib/file";
import { Schema, type SchemaContext } from "./lib/schema";
import { SchemaProjection } from "./lib/field";
import { StringLike } from "./types";
import { QueryTransformer, transformPartials } from "./lib/query";
import { ResolverService } from "./lib/resolver";

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
    this.generateQueries();
    this.processQueries();
    await this.fileService.flush();

    let updateCount = 0;
    this.fileService.store.forEach((x) => {
      if (x.dirty) {
        updateCount++;
      }
    });

    console.log(`Processed ${this.fileService.store.size} files, updated ${updateCount}`);
  }

  private processQueries() {
    Object.entries(this.queries).forEach(([key, baseQuery]) => {
      const query = this.queryTransformer.reduce((query, handler) => handler(key, query, { fileService: this.fileService }), baseQuery);

      const file = this.fileService.getOrCreate({
        extension: "ts",
        name: key,
        path: path.join(this.options.outPath, "queries"),
      });

      file.content = query;
    });
  }

  private generateQueries() {
    Object.entries(this.config.schemas).forEach(([key, val]) => {
      const schemaContext: SchemaContext = {
        resolverService: this.resolverService,
      };
      const visitor = [new SchemaProjection(schemaContext)];
      const schema = new Schema(schemaContext, val, visitor);

      const queryContext: Record<string, any> = {};
      schema.visitor.forEach((v) => {
        queryContext[v.id] = v.result;
      });
      this.queryContext[key] = queryContext as SchemaVisitorResult;
    });

    Object.entries(this.config.queries).forEach(([name, func]) => {
      this.queries[name] = func(this.queryContext);
    });
  }
}
