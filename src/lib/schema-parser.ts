import { inspect } from "util";
import { type Documentlike } from "./../types";
import { AbstractFieldHandler } from "./field-handler-interface";

type ParentContext = {
  type?: string;
};

export class SchemaParser {
  constructor(readonly handler: Record<string, AbstractFieldHandler>) {}

  public parse(schema: Documentlike) {
    return this.iterate(schema);
  }

  private iterate(
    field: Documentlike,
    parent: ParentContext = {},
    res: Record<keyof typeof this.handler, any> = {}
  ): Record<keyof typeof this.handler, any> {
    if (this.includesResolvable(field)) {
      /**
       * If this field has a child that needs its custom groq,
       * we need to walk the object until we reach that field.
       *
       * The path to that child needs its explicit groq query.
       * fore everything else, whe use the spread operator (...).
       */
      this.iterateHandler((h, n) => {
        res[n] = h.onSpread({
          parent: {
            result: res[n],
            length: this.getNext(field).length,
          },
          field: {
            content: "",
            name: field.name,
            type: field.type,
            raw: field,
            isLastProperty: false,
          },
        });
      });
    } else {
      /**
       * If this field has no child that needs its custom groq,
       * we can solve everything with the spread operator and
       * return the result early.
       */
      this.iterateHandler((h, n) => {
        res[n] = h.onSpread({
          parent: {
            result: res[n],
            length: this.getNext(field).length,
          },
          field: {
            content: "",
            name: field.name,
            type: field.type,
            raw: field,
            isLastProperty: false,
          },
        });
      });
      return res;
    }

    if (this.isIterable(field)) {
      parent.type = field.type;

      return this.getNext(field).reduce((result, field, index, arr) => {
        const seperate = index !== arr.length - 1;
        const isLastProperty = index === arr.length - 1;

        /**
         * If we find a field with an resolver, we use it. A field with
         * a resolver alsoe markes the end of the schmea traversal for this
         * breanch.
         */
        if (this.isResolvable(field)) {
          this.iterateHandler((h, n) => {
            result[n] = h.onResolvable({
              parent: {
                result: res[n],
                length: arr.length,
              },
              field: {
                content: "",
                name: field.name,
                type: field.type,
                raw: field,
                isLastProperty,
              },
            });
          });
        } else {
          if (this.isResolvable(field) || this.includesResolvable(field)) {
            /**
             * We only need to continue if this field is resolvable or
             * of any of its children are.
             */
            const compilerArgs = {
              name: field.name,
              content: this.iterate(field, {}, []),
              seperate,
            };
            if (field.type === "array") {
              /**
               * Handle array fields differently. Technically the following
               * else could alwo handle this case, but we do not need to worry
               * about this because sanity does not allow to nest arrays.
               */
              this.iterateHandler((h, n) => {
                result[n] = h.onArray({
                  parent: {
                    result: res[n],
                    length: arr.length,
                  },

                  field: {
                    content: compilerArgs.content[n],
                    name: compilerArgs.name,
                    type: field.type,
                    raw: field,
                    isLastProperty,
                  },
                });
              });
            } else {
              if (parent.type === "array") {
                /**
                 * If an object is in an array, does not need its enclosing
                 * brackets. We can just return the object properties.
                 */
                this.iterateHandler((h, n) => {
                  result[n] = h.onObjectInArray({
                    parent: {
                      result: res[n],
                      length: arr.length,
                    },
                    field: {
                      name: field.name,
                      content: compilerArgs.content[n],
                      raw: field,
                      isLastProperty,
                      type: field.type,
                    },
                  });
                });
              } else {
                /**
                 * Finally we handle norma objects.
                 */
                this.iterateHandler((h, n) => {
                  result[n] = h.onObject({
                    parent: {
                      result: res[n],
                      length: arr.length,
                    },
                    field: {
                      name: field.name,
                      content: compilerArgs.content[n],
                      raw: field,
                      isLastProperty,
                      type: field.type,
                    },
                  });
                });
              }
            }
          }
        }

        return result;
      }, res);
    }
    return res;
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
    return !!field.resolver;
  }

  private isIterable(field: Documentlike): boolean {
    return ["object", "array", "document"].includes(field.type);
  }

  private iterateHandler(
    callback: (
      handler: AbstractFieldHandler,
      name: keyof typeof this.handler
    ) => any
  ) {
    for (const [name, handler] of Object.entries(this.handler)) {
      callback(handler, name);
    }
  }
}

function log(args: any) {
  console.log(inspect(args, false, null, true));
}
