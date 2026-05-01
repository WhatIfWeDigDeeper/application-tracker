# Ensure the ruby_rails schema exists before AR creates its metadata tables.
# Without this, on a fresh DB the schema_migrations / internal_metadata tables
# land in `public` (Postgres skips nonexistent schemas in search_path for
# unqualified table creation), undermining schema isolation across stacks
# sharing the app_tracker DB.
begin
  ActiveRecord::Base.connection.execute("CREATE SCHEMA IF NOT EXISTS ruby_rails")
rescue ActiveRecord::NoDatabaseError, PG::ConnectionBad
  # DB doesn't exist yet (db:create not run); skip — caller will set up DB.
end

ActiveRecord::Base.schema_migrations_table_name = "ruby_rails.schema_migrations"
ActiveRecord::Base.internal_metadata_table_name = "ruby_rails.internal_metadata"
