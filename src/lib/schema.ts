import type { Documentlike } from "./../types";
import { Context, IContextModule } from "./context";
import { type FieldMeta, SchemaProjection, FieldVisitorV2 } from "./field";

export class Schema {
  visitor: FieldVisitorV2[] = [];

  constructor(
    readonly context: Context,
    schema: Documentlike,
    visitor: Array<new (ctx: Context) => FieldVisitorV2>,
  ) {
    for (const V of visitor) {
      this.visitor.push(new V(context));
    }
    this.traverse(schema);
  }

  private traverse(field: Documentlike, res = [], parentField?: Documentlike): any[] {
    const nextFields = this.getNext(field);
    const children = (nextFields as any[]).reduce((result, nextField) => {
      return this.traverse(nextField, result, field);
    }, []);

    const nextResult = this.visitField({
      field,
      result: res,
      children,
      parentField,
    });
    return nextResult;
  }

  private visitField({
    result,
    field,
    children,
    parentField,
  }: {
    field: Documentlike;
    parentField: Documentlike | undefined;
    result: string[];
    children: string[];
  }) {
    const meta: FieldMeta = {
      includesResolvable: this.includesResolvable(field),
      isIterable: this.isIterable(field),
      isResolvable: this.isResolvable(field),
    };
    return this.visitor.map((visitor, index) => {
      return visitor.onField({
        children: children[index],
        field,
        meta,
        parentField,
        result: result[index],
      });
    });
  }

  private includesResolvable(field: Documentlike, res = false): boolean {
    res = this.isResolvable(field);
    if (res) return true;

    const children = [];

    for (const item of this.getNext(field)) {
      if (this.isResolvable(item)) return true;
      children.push(this.includesResolvable(item, res));
    }

    return children.some(Boolean);
  }

  private getNext(field: Documentlike) {
    return field.fields ?? field.of ?? [];
  }

  private isResolvable(field: Documentlike) {
    return !!field.resolver || !!this.context.resolver.has(field.type);
  }

  private isIterable(field: Documentlike): boolean {
    return ["object", "array", "document"].includes(field.type);
  }
}

export class SchemaContextModule implements IContextModule {
  data = new Map<string, any>();

  constructor(public context: Context) {}
  get(id: string): Schema {
    if (this.data.has(id)) {
      return this.data.get(id);
    }
    const schema = this.createSchema(id);
    return this.set(id, schema).get(id);
  }
  set(id: string, data: any) {
    return this.data.set(id, data);
  }
  has(id: string) {
    return this.data.has(id);
  }

  private createSchema(name: string): Schema {
    const rawSchema = this.context.config.schemas[name];
    const schema = new Schema(this.context, rawSchema, [SchemaProjection]);
    return schema;
  }
}
