import consola from "consola";
import type { AutoGroqFieldConfigObject, Documentlike } from "./../types";
import { ResolverCompiler } from "./resolver";
import { Context } from "./context";

export interface FieldMeta {
  includesResolvable: boolean;
  isResolvable: boolean;
  isIterable: boolean;
}

export interface OnFieldArgs {
  field: Documentlike;
  parentField: Documentlike | undefined;
  result: string;
  children: string;
  meta: FieldMeta;
}

export interface FieldVisitorV2 {
  id: string;
  onField: (args: OnFieldArgs) => any;
  result: string;
}

export class SchemaProjection implements FieldVisitorV2 {
  readonly id = "projection";
  result = "";

  constructor(public readonly context: Context) {}

  onField(args: OnFieldArgs) {
    const { field, parentField, children, meta, result } = args;
    const { includesResolvable, isResolvable } = meta;

    const isInArrayLike = ["array", "reference"].includes(parentField?.type ?? "");
    const isInArrayWithSiblings = ((parentField?.of?.length || parentField?.to?.length) ?? 1) > 1;
    const isConditonal = isInArrayLike && isInArrayWithSiblings;

    if (field.type === "reference" && includesResolvable) {
      const groq = this.buildReference(field.name, args.children);
      return (this.result = this.concat(args, groq));
    }

    if (parentField?.type === "reference" && typeof field.autogroq === "object" && (field.autogroq as AutoGroqFieldConfigObject).followReference) {
      const autoGroqConfig = field.autogroq as AutoGroqFieldConfigObject;
      const schemaExists = this.context.schema.has(typeof autoGroqConfig.followReference === "boolean" ? field.type : autoGroqConfig.followReference);

      if (schemaExists) {
        const projection = this.context.schema.get(field.type).visitor[0]?.result ?? ("" as string);
        const builder = isConditonal ? this.buildConditional : (left: string, right: string) => right;
        const groq = builder(field.type, projection);
        return (this.result = this.concat(args, groq));
      } else {
        consola.error("Schama not found");
        return this.result;
      }
    }

    if (!includesResolvable) return (this.result = result);

    if (isResolvable) {
      const res = this.getResolver(field);
      if (!res) {
        consola.error(`Resolver not found`, { field });
        return (this.result = result);
      }

      const resolver =
        isConditonal && parentField && (parentField.of?.length ?? 0) >= 1 && res.isObject && !res.isRenamed
          ? res.getUnwrapped(field.name)
          : res.get(field.name);
      const groq = isConditonal ? this.buildConditional(field.name, resolver) : resolver;
      return (this.result = this.concat(args, groq));
    }

    if (field.type === "document") {
      return (this.result = "...," + (children ?? ""));
    }

    if (field.type === "object") {
      const builder = isConditonal ? this.buildConditional : this.buildObject;
      const obj = builder(field.name, this.buildChildren(args));
      return (this.result = this.concat(args, obj));
    }

    if (field.type === "array") {
      const obj = this.buildArray(field.name, this.buildChildren(args));
      return (this.result = this.concat(args, obj));
    }

    return (this.result = result);
  }

  private getResolver(field: Documentlike): ResolverCompiler | undefined {
    if (this.context.resolver.has(field.type)) {
      return this.context.resolver.get(field.type);
    }

    if (field.autogroq) {
      const rawResolver = typeof field.autogroq === "object" ? (field.autogroq as AutoGroqFieldConfigObject).resolver : field.autogroq;
      return new ResolverCompiler(rawResolver);
    }
  }

  private buildArray(left: string, right: string) {
    return `${left}[] {\n${right ?? ""}\n}`;
  }

  private buildObject(left: string, right: string) {
    return `${left} {\n${right ?? ""}\n}`;
  }

  private buildConditional(left: string, right: string) {
    return `_type == "${left}" => {\n${right ?? ""}\n}`;
  }

  private buildChildren({ children }: OnFieldArgs) {
    return "...,\n" + (children ?? "");
  }

  private buildReference(left: string, right: string) {
    return `${left}[] -> { ${right} }`;
  }
  private concat({ result }: OnFieldArgs, groq: string) {
    return (result ? result + ",\n" : "") + groq;
  }
}

export class DummyFactory implements FieldVisitorV2 {
  readonly id = "debug";
  result = "string";

  constructor(readonly context: Context) {}

  onField(args: OnFieldArgs) {
    if (args.meta.isIterable) {
      return this.onObject(args);
    }
    return this.onPrimitive(args);
  }

  private onPrimitive({ field, result }: OnFieldArgs) {
    return (this.result = (result ? result + ",\n" : "") + field.name);
  }

  private onObject({ field, result, children }: OnFieldArgs) {
    return (this.result = field.type === "document" ? children : (result ? result + ",\n" : "") + this.obj(field.name, children));
  }

  private obj(name: string, content: string = "") {
    return (this.result = `${name} {\n${content}\n}`);
  }
}
