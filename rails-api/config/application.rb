require_relative "boot"

require "rails"
require "active_model/railtie"
require "active_record/railtie"
require "action_controller/railtie"

Bundler.require(*Rails.groups)

module RailsApi
  class Application < Rails::Application
    config.load_defaults 8.0
    config.api_only = true
    config.time_zone = "UTC"
    config.active_record.schema_format = :sql
    config.active_record.dump_schema_after_migration = false
    config.generators do |generator|
      generator.test_framework :rspec
    end
  end
end
