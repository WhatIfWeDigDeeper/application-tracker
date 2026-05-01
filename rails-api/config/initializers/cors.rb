Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins %r{\Ahttps?://localhost:(30\d0|3100)\z}

    resource "*",
             headers: :any,
             methods: %i[get post patch put delete options head]
  end
end
