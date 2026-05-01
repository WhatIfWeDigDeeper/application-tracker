class InterviewStage < ApplicationRecord
  self.table_name = "ruby_rails.interview_stages"

  belongs_to :job_application, foreign_key: :application_id, inverse_of: :interview_stages

  validates :name, presence: true, length: { maximum: 100 }
  validates :order, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :notes, length: { maximum: 2000 }, allow_nil: true
  validates :performance_rating,
            numericality: { only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: 5 },
            allow_nil: true
end
