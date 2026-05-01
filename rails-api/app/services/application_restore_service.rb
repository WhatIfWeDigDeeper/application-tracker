class ApplicationRestoreService
  def self.restore(application, sequence)
    snapshot = application.application_snapshots.find_by(sequence: sequence)
    return nil unless snapshot

    data = snapshot.snapshot
    ApplicationRecord.transaction do
      application.update!(application_attributes(data))
      application.interview_stages.destroy_all
      Array(data["interviewStages"]).each do |stage_data|
        application.interview_stages.create!(stage_attributes(stage_data))
      end
      ApplicationSnapshotService.record(application, "Restored to version #{sequence}")
    end
    application.reload
  end

  def self.application_attributes(data)
    {
      company_name: data["companyName"],
      position_title: data["positionTitle"],
      date_applied: ApiParams.parse_date(data["dateApplied"]),
      status: data["status"],
      company_url: data["companyUrl"],
      job_posting_url: data["jobPostingUrl"],
      company_career_url: data["companyCareerUrl"],
      company_category: data["companyCategory"],
      skills_match: data["skillsMatch"],
      job_source: data["jobSource"],
      cover_letter_required: data["coverLetterRequired"],
      special_requirements: data["specialRequirements"],
      salary_min: data["salaryMin"],
      salary_max: data["salaryMax"],
      notes: data["notes"],
      offer_due_date: ApiParams.parse_date(data["offerDueDate"]),
      is_archived: data["isArchived"]
    }
  end

  def self.stage_attributes(data)
    attributes = {
      name: data["name"],
      order: data["order"],
      is_completed: data["isCompleted"],
      completed_date: ApiParams.parse_date(data["completedDate"]),
      notes: data["notes"],
      performance_rating: data["performanceRating"]
    }
    # Stages are deleted before restore, so snapshot UUIDs can be reused without primary-key conflicts.
    attributes[:id] = data["id"] if data["id"].present?
    attributes
  end
end
