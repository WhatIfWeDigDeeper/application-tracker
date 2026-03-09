import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

export const client = new ApolloClient({
  link: new HttpLink({ uri: '/graphql' }),
  cache: new InMemoryCache({
    typePolicies: {
      Application: { keyFields: ['id'] },
      InterviewStage: { keyFields: ['id'] },
    },
  }),
});
