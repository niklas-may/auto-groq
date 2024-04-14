
export type Documentlike = {
  name: string;
  type: string;
  resolver?: boolean;
  of?: Documentlike[];
  fields?: Documentlike[];
};
