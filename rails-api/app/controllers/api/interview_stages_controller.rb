module Api
  class InterviewStagesController < ApplicationController
    def create
      stage = InterviewStageService.create(application, json_payload)
      render json: ApplicationSerializer.interview_stage(stage), status: :created
    end

    def update
      updated = InterviewStageService.update(application, stage, json_payload)
      render json: ApplicationSerializer.interview_stage(updated)
    end

    def destroy
      InterviewStageService.delete(application, stage)
      head :no_content
    end

    private

    def application
      @application ||= JobApplication.find(params[:application_id])
    end

    def stage
      @stage ||= application.interview_stages.find(params[:id])
    end
  end
end
