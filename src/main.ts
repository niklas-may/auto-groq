import { format } from "groqfmt-nodejs";
import { SchemaParser } from "./lib/schema-parser";
import { type Documentlike } from "./types";
import { GroqFieldHandler } from "./lib/field-handler-groq";

export function generate(schema: Documentlike) {
  const fieldHandler = {groq: new GroqFieldHandler()};
  const parser = new SchemaParser(fieldHandler);
  const r = parser.parse(schema);

  try {
    const res = format(`*[] {${r.groq}}`);
    console.log(res);
  } catch (e) {
    console.log(r.groq);
    console.log(e);
  }
}
