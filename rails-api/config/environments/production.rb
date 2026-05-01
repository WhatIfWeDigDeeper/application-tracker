raise "DATABASE_URL is required in production" if ENV["DATABASE_URL"].to_s.empty?

Rails.application.configure do
  config.cache_classes = true
  config.eager_load = true
  config.consider_all_requests_local = false
end
