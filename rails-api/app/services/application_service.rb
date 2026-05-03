class ApplicationService
  DEFAULT_STAGES = [
    "Phone Screen",
    "Technical Screen",
    "Coding Challenge",
    "Onsite/Panel",
    "Behavioral/Cultural Fit",
    "Final Decision"
  ].freeze

  FIELD_LABELS = {
    company_name: "Company Name",
    position_title: "Position Title",
    date_applied: "Date Applied",
    status: "Status",
    company_url: "Company URL",
    job_posting_url: "Job Posting URL",
    company_career_url: "Career Page URL",
    company_category: "Company Category",
    skills_match: "Skills Match",
    job_source: "Job Source",
    cover_letter_required: "Cover Letter Required",
    special_requirements: "Special Requirements",
    salary_min: "Min Salary",
    salary_max: "Max Salary",
    notes: "Notes",
    offer_due_date: "Offer Due Date",
    is_archived: "Archived"
  }.freeze

  SORT_COLUMNS = {
    "dateApplied" => :date_applied,
    "companyName" => :company_name,
    "status" => :status,
    "updatedAt" => :updated_at
  }.freeze

  def self.list(params)
    scope = JobApplication.includes(:interview_stages)
    scope = scope.where(is_archived: false) unless truthy?(params[:includeArchived])
    scope = scope.where(status: params[:status].to_s.split(",").map(&:strip)) if params[:status].present?
    scope = scope.where(company_category: params[:companyCategory]) if params[:companyCategory].present?
    scope = scope.where(job_source: params[:jobSource]) if params[:jobSource].present?
    if params[:skillsMatchMin].present?
      skills_match_min = Integer(params[:skillsMatchMin], exception: false)
      scope = scope.where(skills_match: skills_match_min..) if skills_match_min
    end

    total = scope.count
    page = [params.fetch(:page, 1).to_i, 1].max
    limit = params.fetch(:limit, 20).to_i.clamp(1, 100)
    sort_column = SORT_COLUMNS.fetch(params[:sortBy].to_s, :updated_at)
    sort_direction = params[:sortDir].to_s.downcase == "asc" ? :asc : :desc
    order_fragment = "#{JobApplication.connection.quote_column_name(sort_column)} #{sort_direction.to_s.upcase}"
    order_fragment = "#{order_fragment} NULLS LAST" if sort_column == :date_applied

    items = scope.order(Arel.sql(order_fragment)).offset((page - 1) * limit).limit(limit).map do |application|
      ApplicationSerializer.application(application)
    end

    { items:, page:, limit:, total: }
  end

  def self.create(payload)
    attributes = ApiParams.application_attributes(payload)
    attributes[:status] = attributes[:status].presence || "unsubmitted"
    apply_date_side_effects(attributes, on_create: true)

    application = nil
    ApplicationRecord.transaction do
      application = JobApplication.create!(attributes)
      create_default_stages_if_needed(application)
      ApplicationSnapshotService.record(application, "Created application")
    end
    application.reload
  end

  def self.update(application, payload)
    attributes = ApiParams.application_attributes(payload)
    return application if attributes.empty?

    previous_status = application.status
    prevent_terminal_transition!(application, attributes[:status])
    apply_date_side_effects(attributes, on_create: false)

    ApplicationRecord.transaction do
      application.update!(attributes)
      create_default_stages_if_needed(application) if previous_status != application.status
      ApplicationSnapshotService.record(application, update_description(attributes.keys))
    end
    application.reload
  end

  def self.archive(application)
    ApplicationRecord.transaction do
      application.update!(is_archived: true)
      ApplicationSnapshotService.record(application, "Archived application")
    end
    application.reload
  end

  def self.restore(application)
    ApplicationRecord.transaction do
      application.update!(is_archived: false)
      ApplicationSnapshotService.record(application, "Restored application")
    end
    application.reload
  end

  def self.delete(application)
    ApplicationRecord.transaction do
      ApplicationSnapshotService.record(application, "Deleted application")
      application.destroy!
    end
  end

  def self.truthy?(value)
    value == true || value.to_s.downcase == "true"
  end

  def self.apply_date_side_effects(attributes, on_create:)
    status = attributes[:status]
    return if status.blank?

    if status == "unsubmitted"
      attributes[:date_applied] = nil
    elsif on_create && (!attributes.key?(:date_applied) || attributes[:date_applied].nil?)
      attributes[:date_applied] = Date.current
    end
  end

  def self.prevent_terminal_transition!(application, new_status)
    return if new_status.blank? || application.status == new_status
    return unless JobApplication::TERMINAL_STATUSES.include?(application.status)

    application.errors.add(:status, "cannot transition from terminal status")
    raise ActiveRecord::RecordInvalid, application
  end

  def self.create_default_stages_if_needed(application)
    return unless application.status == "interviewing"
    return if application.interview_stages.exists?

    DEFAULT_STAGES.each_with_index do |name, index|
      application.interview_stages.create!(name: name, order: index + 1)
    end
  end

  def self.update_description(fields)
    labels = fields.filter_map { |field| FIELD_LABELS[field] }
    labels.empty? ? "Updated application" : "Updated: #{labels.join(', ')}"
  end
end
