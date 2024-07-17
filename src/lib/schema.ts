import type { Documentlike } from "./../types";
import type { FieldVisitor, FieldMeta } from "./field";
import { sanitySchemaTypes } from "./constants";
import { ResolverService } from "./resolver";

export type SchemaContext = {
  resolverService: ResolverService;
};

export class Schema {
  visitor: FieldVisitor[];
  private sanityTypes = sanitySchemaTypes;

  constructor(
    readonly context: SchemaContext,
    schema: Documentlike,
    visitor: FieldVisitor[],
  ) {
    this.visitor = visitor;
    this.traverse(schema);
  }

  private traverse(field: Documentlike, res = [], parentField?: Documentlike): any[] {
    // if (!this.isIterable(field)) {
    //   const next = this.visitField({
    //     children: [],
    //     field,
    //     parentField,
    //     result: res,
    //   });
    //   return next;
    // }

    
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
    return !!field.resolver || !!this.context.resolverService.get(field.type);
  }

  private isIterable(field: Documentlike): boolean {
    return ["object", "array", "document"].includes(field.type);
  }
}
