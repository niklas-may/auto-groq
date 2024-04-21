import { type Documentlike } from "./../types";

export type FieldHandlerArgs = {
  parent: {
    result: unknown
    length: number
  }
  field: {
    name: string;
    content: string;
    type: string;
    isLastProperty: boolean,
    raw: Documentlike;
  };
};

export interface AbstractFieldHandler {
  onArray: (args: FieldHandlerArgs) => unknown;
  onObject: (args: FieldHandlerArgs) => unknown;
  onObjectInArray: (args: FieldHandlerArgs) => unknown;
  onPrimitive: (args: FieldHandlerArgs) => unknown;
  onResolvable: (args: FieldHandlerArgs) => unknown;
  onSpread: (args: FieldHandlerArgs) => unknown;
}
