class InterviewStageService
  def self.create(application, payload)
    attributes = ApiParams.stage_attributes(payload)
    stage = nil
    ApplicationRecord.transaction do
      stage = application.interview_stages.create!(attributes)
      application.update!(updated_at: Time.current)
      ApplicationSnapshotService.record(application, "Added interview stage: #{stage.name}")
    end
    stage.reload
  end

  def self.update(application, stage, payload)
    attributes = ApiParams.stage_attributes(payload)
    return stage if attributes.empty?

    ApplicationRecord.transaction do
      stage.update!(attributes)
      application.update!(updated_at: Time.current)
      ApplicationSnapshotService.record(application, "Updated interview stage: #{stage.name}")
    end
    stage.reload
  end

  def self.delete(application, stage)
    stage_name = stage.name
    ApplicationRecord.transaction do
      stage.destroy!
      application.update!(updated_at: Time.current)
      ApplicationSnapshotService.record(application, "Removed interview stage: #{stage_name}")
    end
  end
end
