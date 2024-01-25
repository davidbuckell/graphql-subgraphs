import { ApolloServer } from '@apollo/server';
/* without subscriptions 
import { startStandaloneServer } from '@apollo/server/standalone';
import { KeyValueCache } from "@apollo/utils.keyvaluecache";
*/

/* with subscriptions */
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { createServer } from 'http';
import express from 'express';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import cors from 'cors';
import { PubSub } from 'graphql-subscriptions';

import { TimeStampDatasource } from './datasources/timestamp-datasource.js'; // if file extension is not specified then: Error [ERR_MODULE_NOT_FOUND]: Cannot find module

// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const typeDefs = `#graphql
# Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

# This "Book" type defines the queryable fields for every book in our data source.
type Book {
  title: String
  author: String
}

# The "Query" type is special: it lists all of the available queries that
# clients can execute, along with the return type for each. In this
# case, the "books" query returns an array of zero or more Books (defined above).
# Query is not just a naming convention.  Renaming this property (& the supporting resolver) results in the error: Query root type must be provided.
type Query {
  books: [Book]
  timestamp: String!
}
`;

const books = [
  {
    title: 'The Awakening',
    author: 'Kate Chopin',
  },
  {
    title: 'City of Glass',
    author: 'Paul Auster',
  },
];

const pubsub = new PubSub();

// Resolvers define how to fetch the types defined in your schema.
// This resolver retrieves books from the "books" array above.
const resolvers = {
  Query: {
    books: () => books,
    timestamp: async (_, __, { dataSources }) => {
      return dataSources.timestampDatasource.getTimestamp();
    }
  },
  Subscription: {
    hello: {
      // Example using an async generator
      subscribe: async function* () {
        for await (const word of ['Hello', 'Bonjour', 'Ciao']) {
          yield { hello: word };
        }
      },
    },
    postCreated: {      
      subscribe: () => pubsub.asyncIterator(['POST_CREATED']),
    },
    // other resolvers...
  }
};

interface ContextValue {
  dataSources: {
    timestampDatasource: TimeStampDatasource;
  }
}

/* WITHOUT SUBSCRIPTIONS */

/*
// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer<ContextValue>({
  typeDefs,
  resolvers    
});
*/

/*
export class TimeStampDatasource2 {
  constructor(cache: KeyValueCache<string>) {
    
  }
  
  get(): string {
    return 'a timestamp';
  }
}
*/

// Passing an ApolloServer instance to the `startStandaloneServer` function:
//  1. creates an Express app
//  2. installs your ApolloServer instance as middleware
//  3. prepares your app to handle incoming requests
/*
const { url } = await startStandaloneServer(server, {
  context: async ({req}) => {
    const { cache } = server;
    return {
      dataSources: {
        // This will create a new instance of our data source on every request.
        // If you need to reuse a single instance, such as a database connection, you can pass this into the datasource class as a parameter.
        timestampDatasource: new TimeStampDatasource()
      }
    }
  },
  listen: { port: 4000 },
});

console.log(`🚀  Server ready at: ${url}`);

*/

/* WITH SUBSCRIPTIONS */
// Create the schema, which will be used separately by ApolloServer and
// the WebSocket server.
const schema = makeExecutableSchema({ typeDefs, resolvers });

// Create an Express app and HTTP server; we will attach both the WebSocket
// server and the ApolloServer to this HTTP server.
const app = express();
const httpServer = createServer(app);

// Create our WebSocket server using the HTTP server we just set up.
const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/subscriptions',
});
// Save the returned server's info so we can shutdown this server later
const serverCleanup = useServer({ schema }, wsServer);

// Set up ApolloServer.
const server = new ApolloServer({
  schema,
  plugins: [
    // Proper shutdown for the HTTP server.
    ApolloServerPluginDrainHttpServer({ httpServer }),

    // Proper shutdown for the WebSocket server.
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
});

await server.start();
app.use('/graphql', cors<cors.CorsRequest>(), express.json(), expressMiddleware(server));

const PORT = 4000;
// Now that our HTTP server is fully set up, we can listen to it.
httpServer.listen(PORT, () => {
  console.log(`Server is now running on http://localhost:${PORT}/graphql`);
});