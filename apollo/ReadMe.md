Example Query
```
query GetBooks {
  books {
    author
    title
  }
  timestamp
}
```

References:

https://www.apollographql.com/docs/apollo-server/data/fetching-data
https://www.apollographql.com/docs/apollo-server/data/fetching-rest/
https://github.com/apollographql/datasource-rest/blob/main/src/RESTDataSource.ts#L619
https://github.com/apollographql/datasource-rest