import { format } from "groqfmt-nodejs";
import { FileService } from "./file";

type QueryTransformContext = { fileService: FileService };

export type QueryTransformer = (name: string, query: string, app: QueryTransformContext) => string;

export const transformPartials: QueryTransformer = (name: string, query: string, app: QueryTransformContext) => {
  const queryPretty = format(query);
  const result = `export const ${name}Query = /* groq */ \`\n${queryPretty}\`;`;
  return result;
};
