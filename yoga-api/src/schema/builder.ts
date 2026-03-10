import SchemaBuilder from '@pothos/core';
import PrismaPlugin from '@pothos/plugin-prisma';
import { Prisma } from '@prisma/client';
import type PrismaTypes from './pothos-types.js';
import { prisma } from '../db/client.js';

export const builder = new SchemaBuilder<{
  PrismaTypes: PrismaTypes;
  Context: Record<string, never>;
}>({
  plugins: [PrismaPlugin],
  prisma: {
    client: prisma,
    dmmf: Prisma.dmmf,
    exposeDescriptions: false,
    filterConnectionTotalCount: true,
  },
});
