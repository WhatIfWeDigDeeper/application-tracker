module Api
  class ApplicationHistoryController < ApplicationController
    def index
      page = [params.fetch(:page, 1).to_i, 1].max
      limit = params.fetch(:limit, 50).to_i.clamp(1, 100)
      scope = application.application_snapshots.order(sequence: :desc)
      page_entries = scope.offset((page - 1) * limit).limit(limit).to_a
      previous_snapshots = application.application_snapshots
                                      .where(sequence: page_entries.map { |entry| entry.sequence - 1 })
                                      .index_by(&:sequence)
      entries = page_entries.map do |entry|
        previous = previous_snapshots[entry.sequence - 1]&.snapshot
        ApplicationSerializer.history_entry(entry, previous)
      end

      render json: {
        entries: entries,
        total: scope.count,
        page: page,
        limit: limit
      }
    end

    def restore
      restored = ApplicationRestoreService.restore(application, json_payload["sequence"].to_i)
      if restored
        render json: ApplicationSerializer.application(restored)
      else
        render json: { code: "not_found", message: "History entry not found" }, status: :not_found
      end
    end

    private

    def application
      @application ||= JobApplication.includes(:application_snapshots, :interview_stages).find(params[:application_id])
    end
  end
end
