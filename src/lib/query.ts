import { format } from "groqfmt-nodejs";
import { Context } from "./context";

export type QueryTransformer = (name: string, query: string, context: Context) => string;

export const transformPartials: QueryTransformer = (name: string, query: string) => {
  const queryPretty = format(query);
  const result = `export const ${name}Query = /* groq */ \`\n${queryPretty}\`;`;
  return result;
};
