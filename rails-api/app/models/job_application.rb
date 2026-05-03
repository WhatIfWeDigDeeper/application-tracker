class JobApplication < ApplicationRecord
  self.table_name = "ruby_rails.applications"

  APPLICATION_STATUSES = [
    "unsubmitted",
    "applied",
    "rejected",
    "interviewing",
    "given offer",
    "accepted offer",
    "declined offer",
    "no offer"
  ].freeze

  COMPANY_CATEGORIES = [
    "education",
    "health",
    "climate",
    "ai",
    "energy",
    "finance",
    "enterprise-software",
    "consumer-tech",
    "e-commerce",
    "cybersecurity",
    "gaming",
    "media-entertainment",
    "consulting",
    "government",
    "nonprofit",
    "retail",
    "restaurant",
    "hospitality",
    "other"
  ].freeze

  JOB_SOURCES = [
    "recruiter",
    "linkedin",
    "indeed",
    "friend",
    "colleague",
    "company-website",
    "other"
  ].freeze

  TERMINAL_STATUSES = ["accepted offer", "declined offer"].freeze

  has_many :interview_stages, foreign_key: :application_id, dependent: :destroy, inverse_of: :job_application
  has_many :application_snapshots, foreign_key: :application_id, dependent: :destroy, inverse_of: :job_application

  validates :company_name, presence: true, length: { maximum: 200 }
  validates :position_title, presence: true, length: { maximum: 200 }
  validates :status, inclusion: { in: APPLICATION_STATUSES }
  validates :company_category, inclusion: { in: COMPANY_CATEGORIES }, allow_nil: true
  validates :job_source, inclusion: { in: JOB_SOURCES }, allow_nil: true
  validates :skills_match, numericality: { only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: 5 }, allow_nil: true
  validates :salary_min, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, allow_nil: true
  validates :salary_max, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, allow_nil: true
  validates :special_requirements, length: { maximum: 5000 }, allow_nil: true
  validates :notes, length: { maximum: 5000 }, allow_nil: true
  validate :salary_range_is_ordered
  validate :urls_are_http

  private

  def salary_range_is_ordered
    return if salary_min.nil? || salary_max.nil? || salary_min <= salary_max

    errors.add(:salary_max, "must be greater than or equal to salaryMin")
  end

  def urls_are_http
    %i[company_url job_posting_url company_career_url].each do |field|
      value = public_send(field)
      next if value.blank? || value.match?(%r{\Ahttps?://})

      errors.add(field, "must start with http:// or https://")
    end
  end
end
