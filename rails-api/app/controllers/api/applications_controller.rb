module Api
  class ApplicationsController < ApplicationController
    def index
      render json: ApplicationService.list(params)
    end

    def show
      render json: ApplicationSerializer.application(application)
    end

    def create
      created = ApplicationService.create(json_payload)
      render json: ApplicationSerializer.application(created), status: :created
    end

    def update
      updated = ApplicationService.update(application, json_payload)
      render json: ApplicationSerializer.application(updated)
    end

    def destroy
      ApplicationService.delete(application)
      head :no_content
    end

    def archive
      archived = ApplicationService.archive(application)
      render json: ApplicationSerializer.application(archived)
    end

    def restore
      restored = ApplicationService.restore(application)
      render json: ApplicationSerializer.application(restored)
    end

    def csv_not_implemented
      render json: {
        code: "not_implemented",
        message: "CSV import/export is deferred for rails-api"
      }, status: :not_implemented
    end

    private

    def application
      @application ||= JobApplication.includes(:interview_stages, :application_snapshots).find(params[:id])
    end
  end
end
