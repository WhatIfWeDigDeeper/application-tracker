# rails-api Guidance

Rails API-only backend for the job application tracker.

## Stack

- Ruby 3.3+ with Rails API mode
- ActiveRecord + PostgreSQL schema `ruby_rails`
- RSpec request/model tests
- Port: 5180

## Commands

Run from the repository root unless noted:

```bash
npm run install:rails-api
npm run migrate:rails-api
npm run dev:rails-api
npm run test:rails-api
npm run test:api:rails-api
npm run lint:rails-api
npm run audit:ci:rails-api
```

## Patterns

- Keep database/model attributes snake_case and API JSON keys camelCase.
- Store enum-like values as strings and validate against the core spec values; do not convert values like `given offer`, `enterprise-software`, or `company-website` into Ruby enum identifiers in the API contract.
- Route user-visible mutations through service objects so exactly one application snapshot is recorded per mutation.
- Keep CSV import/export out of `CSV_STACKS` until feature 007 is implemented for Rails.
- The macOS system Ruby 2.6 is too old for this package. Use Ruby 3.3+ before running Bundler or Rails commands.
- `Gemfile.lock` declares Bundler 2.7.2; run `bundle install` normally so local and CI use the lockfile's Bundler metadata instead of npm-script version pins.
- Root npm scripts run Rails commands through `rails-api/bin/with-ruby`, which uses an existing Ruby 3.3+ on `PATH`, `RUBY_33_PREFIX`, or Homebrew `ruby@3.3` on either Apple Silicon or Intel macOS.
- RSpec uses the configured Rails test database, which defaults to the shared `app_tracker` database and `ruby_rails` schema. Avoid running `npm run test:rails-api` against the same schema while `dev:rails-api` is mutating it, or set `TEST_DATABASE_URL` to an isolated database.
