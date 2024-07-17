

Tasks
- Write queries from schema
- Use predifiend resolvers
- Postprocess output
- Write queries as partials

Parts
- Resolver
   - inline in queries
   - write to file
- Schema
   - inline into queries
   - insert resolver
- Queries
   - write to file





```js
//    schema -> groq -> file
//    schma -> (resolver) -> groq -> file

   const resolverStore = new ResolverStore(config.resolvers)
   const filesStore = new FileStore()

   const addGroqVisitor = (ctx: {resolverStore, schemaName}) => new GroqVisitor(ctx)

   const mySchema = new Schema({
      name: getPostById,
      schema: config.schemas.page,
      visitor: [addGroqVisitor]
   })

   // exports x.groq
   mySchema.visitor.forEach(v => v.emitFiles(fileStore))
   resolverStore.resolver.forEach(r => r.emitFiles(fileStore))

   fileStore.files.forEach(f => file.write())

```
