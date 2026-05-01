module ApiParams
  class InvalidDate < StandardError; end

  APPLICATION_FIELD_MAP = {
    "companyName" => :company_name,
    "positionTitle" => :position_title,
    "dateApplied" => :date_applied,
    "status" => :status,
    "companyUrl" => :company_url,
    "jobPostingUrl" => :job_posting_url,
    "companyCareerUrl" => :company_career_url,
    "companyCategory" => :company_category,
    "skillsMatch" => :skills_match,
    "jobSource" => :job_source,
    "coverLetterRequired" => :cover_letter_required,
    "specialRequirements" => :special_requirements,
    "salaryMin" => :salary_min,
    "salaryMax" => :salary_max,
    "notes" => :notes,
    "offerDueDate" => :offer_due_date,
    "isArchived" => :is_archived
  }.freeze

  STAGE_FIELD_MAP = {
    "name" => :name,
    "order" => :order,
    "isCompleted" => :is_completed,
    "completedDate" => :completed_date,
    "notes" => :notes,
    "performanceRating" => :performance_rating
  }.freeze

  DATE_FIELDS = %i[date_applied offer_due_date completed_date].freeze

  def self.application_attributes(payload)
    mapped_attributes(payload, APPLICATION_FIELD_MAP)
  end

  def self.stage_attributes(payload)
    mapped_attributes(payload, STAGE_FIELD_MAP)
  end

  def self.mapped_attributes(payload, field_map)
    payload.each_with_object({}) do |(key, value), attributes|
      field = field_map[key.to_s]
      next unless field

      attributes[field] = DATE_FIELDS.include?(field) ? parse_date(value) : value
    end
  end

  def self.parse_date(value)
    return nil if value.nil? || value == ""
    return value if value.is_a?(Date)

    string_value = value.to_s
    raise InvalidDate, "must use YYYY-MM-DD format" unless string_value.match?(/\A\d{4}-\d{2}-\d{2}\z/)

    Date.iso8601(string_value)
  rescue Date::Error
    raise InvalidDate, "must use YYYY-MM-DD format"
  end
end
