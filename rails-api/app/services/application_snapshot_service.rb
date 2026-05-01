class ApplicationSnapshotService
  def self.record(application, description)
    ApplicationRecord.transaction do
      application.lock!
      sequence = ApplicationSnapshot.where(application_id: application.id).maximum(:sequence).to_i + 1
      ApplicationSnapshot.create!(
        application_id: application.id,
        sequence: sequence,
        description: description.to_s.truncate(ApplicationSnapshot::DESCRIPTION_MAX_LENGTH),
        snapshot: ApplicationSerializer.application(application)
      )
    end
  end
end
