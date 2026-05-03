Rails.application.routes.draw do
  get "/health", to: "api/health#show"

  scope module: :api do
    resources :applications, only: %i[index show create update destroy] do
      collection do
        get :export, action: :csv_not_implemented
        get :sample_csv, path: "sample-csv", action: :csv_not_implemented
        post :import, action: :csv_not_implemented
      end

      member do
        post :archive
        post :restore
      end

      resources :interview_stages, path: "interview-stages", only: %i[create update destroy]
      resources :history, controller: :application_history, only: %i[index] do
        collection do
          post :restore
        end
      end
    end
  end
end
