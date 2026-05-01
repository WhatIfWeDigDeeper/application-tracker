class ApplicationSerializer
  # Snapshots are stored with camelCase keys; derive from the canonical
  # snake_case map on ApplicationService so the two stay in sync.
  FIELD_LABELS = ApplicationService::FIELD_LABELS
                 .transform_keys { |key| key.to_s.camelize(:lower) }
                 .freeze

  def self.application(application)
    {
      id: application.id,
      companyName: application.company_name,
      positionTitle: application.position_title,
      dateApplied: format_date(application.date_applied),
      status: application.status,
      createdAt: format_time(application.created_at),
      updatedAt: format_time(application.updated_at),
      companyUrl: application.company_url,
      jobPostingUrl: application.job_posting_url,
      companyCareerUrl: application.company_career_url,
      companyCategory: application.company_category,
      skillsMatch: application.skills_match,
      jobSource: application.job_source,
      coverLetterRequired: application.cover_letter_required,
      specialRequirements: application.special_requirements,
      salaryMin: application.salary_min,
      salaryMax: application.salary_max,
      notes: application.notes,
      offerDueDate: format_date(application.offer_due_date),
      isArchived: application.is_archived,
      interviewStages: application.interview_stages.sort_by(&:order).map { |stage| interview_stage(stage) }
    }
  end

  def self.interview_stage(stage)
    {
      id: stage.id,
      name: stage.name,
      order: stage.order,
      isCompleted: stage.is_completed,
      completedDate: format_date(stage.completed_date),
      notes: stage.notes,
      performanceRating: stage.performance_rating
    }
  end

  def self.history_entry(entry, previous_snapshot)
    current_snapshot = normalize_snapshot(entry.snapshot)
    {
      id: entry.id,
      sequence: entry.sequence,
      description: entry.description,
      changes: changes(previous_snapshot, current_snapshot),
      createdAt: format_time(entry.created_at)
    }
  end

  def self.changes(previous_snapshot, current_snapshot)
    return [] if previous_snapshot.blank?

    field_changes = FIELD_LABELS.filter_map do |field, label|
      old_value = previous_snapshot[field]
      new_value = current_snapshot[field]
      next if old_value == new_value

      { field:, label:, oldValue: old_value, newValue: new_value }
    end

    old_stages = previous_snapshot["interviewStages"] || []
    new_stages = current_snapshot["interviewStages"] || []
    if old_stages != new_stages
      field_changes << {
        field: "interviewStages",
        label: "Interview Stages",
        oldValue: old_stages,
        newValue: new_stages
      }
    end

    field_changes
  end

  def self.normalize_snapshot(snapshot)
    snapshot.respond_to?(:to_h) ? snapshot.to_h : snapshot
  end

  def self.format_date(value)
    value&.iso8601
  end

  def self.format_time(value)
    value&.utc&.iso8601
  end
end
