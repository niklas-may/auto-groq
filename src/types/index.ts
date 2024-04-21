
export type Documentlike = {
  name: string;
  type: string;
  resolver?: boolean | any;
  of?: Documentlike[];
  fields?: Documentlike[];
};
