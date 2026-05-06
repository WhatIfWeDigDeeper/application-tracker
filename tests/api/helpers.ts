// `expectedAllowedOrigin` is the dev-UI origin paired with each API stack —
// used by `cors.test.ts` to verify the preflight regression-tests its dev-UI
// allowlist. For stacks with permissive CORS (e.g., Express's bare `cors()`),
// any origin is accepted and the response is `Access-Control-Allow-Origin: *`;
// for explicit allowlists, the origin must be in the allowlist. Use the actual
// paired UI's dev port — using a different known-allowed origin (e.g. :5173)
// would let the test pass even when the real dev UI is blocked, defeating the
// regression goal.
export const ALL_STACKS = [
  { name: 'express-api', baseUrl: 'http://localhost:3001',     expectedAllowedOrigin: 'http://localhost:3000', validatesDates: true,  hasInterviewStageDates: true,  hasStageHistory: true  },
  { name: 'koa-api',     baseUrl: 'http://localhost:5010',     expectedAllowedOrigin: 'http://localhost:3010', validatesDates: true,  hasInterviewStageDates: true,  hasStageHistory: true  },
  { name: 'nuxt-api',    baseUrl: 'http://localhost:5040/api', expectedAllowedOrigin: 'http://localhost:3020', validatesDates: false, hasInterviewStageDates: true,  hasStageHistory: false },
  { name: 'hono-api',    baseUrl: 'http://localhost:5030',     expectedAllowedOrigin: 'http://localhost:3030', validatesDates: false, hasInterviewStageDates: true,  hasStageHistory: true  },
  { name: 'fastapi',     baseUrl: 'http://localhost:5160',     expectedAllowedOrigin: 'http://localhost:3040', validatesDates: false, hasInterviewStageDates: true,  hasStageHistory: true  },
  { name: 'nest-api',    baseUrl: 'http://localhost:5050',     expectedAllowedOrigin: 'http://localhost:3050', validatesDates: false, hasInterviewStageDates: true,  hasStageHistory: true  },
  { name: 'go-api',      baseUrl: 'http://localhost:5070',     expectedAllowedOrigin: 'http://localhost:3060', validatesDates: false, hasInterviewStageDates: false, hasStageHistory: false },
  { name: 'spring-api',  baseUrl: 'http://localhost:8080/api', expectedAllowedOrigin: 'http://localhost:3070', validatesDates: true,  hasInterviewStageDates: true,  hasStageHistory: true  },
  { name: 'yoga-api',    baseUrl: 'http://localhost:5080/api', expectedAllowedOrigin: 'http://localhost:3080', validatesDates: false, hasInterviewStageDates: true,  hasStageHistory: false },
  { name: 'lambda-api',  baseUrl: 'http://localhost:5090',     expectedAllowedOrigin: 'http://localhost:3090', validatesDates: false, hasInterviewStageDates: true,  hasStageHistory: true  },
  { name: 'rails-api',   baseUrl: 'http://localhost:5180',     expectedAllowedOrigin: 'http://localhost:3000', validatesDates: true,  hasInterviewStageDates: true,  hasStageHistory: true  },
];

export const CSV_STACKS = ALL_STACKS.filter(s =>
  ['fastapi', 'nest-api', 'go-api', 'spring-api', 'yoga-api'].includes(s.name)
);

// Stacks that expose REST /applications/:id/history + /history/restore endpoints
// with the paginated shape { entries, total, page, limit } and restore via { sequence } body.
// Excluded: nuxt-api (event-sourced, /events endpoint), yoga-api (GraphQL only),
//           spring-api (non-paginated list, restore by path historyId),
//           go-api (non-paginated list, restore by path historyId, no stage history).
export const HISTORY_STACKS = ALL_STACKS.filter(s =>
  !['nuxt-api', 'yoga-api', 'spring-api', 'go-api'].includes(s.name)
);

// API_URL env var → single-stack mode; unset → all stacks
// STACK_NAME env var → used to filter stacks (e.g. skip CSV tests for non-CSV stacks)
export function getTargetStacks(stacks: typeof ALL_STACKS): typeof ALL_STACKS {
  const url = process.env.API_URL;
  if (!url) return stacks;
  const stackName = process.env.STACK_NAME;
  const match = stackName ? ALL_STACKS.find(s => s.name === stackName) : undefined;
  if (stackName && !stacks.some(s => s.name === stackName)) return [];
  return [{ ...(match ?? { name: stackName ?? 'target', expectedAllowedOrigin: 'http://localhost:3000', validatesDates: true, hasInterviewStageDates: true, hasStageHistory: false }), baseUrl: url }];
}
