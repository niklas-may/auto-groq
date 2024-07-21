import { type Config, UserOptions } from "./lib/config";
import { QueryTransformer, processQuery } from "./lib/query";
import { createConsola } from "consola";
import { Context } from "./lib/context";
import { File } from "./lib/file";

export interface SchemaVisitorResult {
  projection: string;
}

export class App {
  private logger = createConsola({ formatOptions: { date: false } }).withTag("autogroq");
  private context: Context;

  constructor(config: Config, options?: UserOptions) {
    this.context = new Context(config, options);
  }

  run = () =>
    this.collectStats(async () => {
      const queryContext: Record<string, SchemaVisitorResult> = {};
      const queryTransformer: QueryTransformer[] = [processQuery];

      for (const [key] of Object.entries(this.context.config.schemas)) {
        const schema = this.context.schema.get(key);
        const queryContextItem: Record<string, any> = {};

        for (const v of schema.visitor) {
          queryContextItem[v.id] = v.result ?? "";
          if (!v.result) {
            this.logger.warn(`Schema visitor "${v.id}" did not return a result for schema "${key}".`);
          }
        }
        queryContext[key] = queryContextItem as SchemaVisitorResult;
      }

      for (const [name, func] of Object.entries(this.context.config.queries)) {
        const baseQuery = func(queryContext);
        const query = queryTransformer.reduce((query, handler) => handler(name, query, this.context), baseQuery);

        const file = new File({
          directory: "queries",
          name,
          content: query,
        });
        this.context.file.set(file);
      }

      await this.context.file.flush();
    });

  private async collectStats(func: () => Promise<any>) {
    const st = performance.now();
    const queryCount = Object.entries(this.context.config.queries).length;
    const queryName = queryCount > 1 ? "queries" : "query";
    this.logger.start(`Found ${queryCount} ${queryName} in config.`);

    await func();

    this.logger.info(
      `Processed ${this.context.file.data.size} ${this.context.file.data.size > 1 ? "files" : "file"}, updated ${this.context.file.filesWriten}.`,
    );

    const et = performance.now();
    const t = Math.round(et - st);
    this.logger.success(`Finished in ${t}ms.`);
  }
}
