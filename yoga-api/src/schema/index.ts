import { builder } from './builder.js';
import './enums.js';
import './types.js';
import './queries.js';
import './mutations.js';

builder.queryType({});
builder.mutationType({});

export const schema = builder.toSchema();
