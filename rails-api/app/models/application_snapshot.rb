class ApplicationSnapshot < ApplicationRecord
  self.table_name = "ruby_rails.application_snapshots"
  DESCRIPTION_MAX_LENGTH = 500

  belongs_to :job_application, foreign_key: :application_id, inverse_of: :application_snapshots

  validates :sequence, numericality: { only_integer: true, greater_than_or_equal_to: 1 }
  validates :description, presence: true, length: { maximum: DESCRIPTION_MAX_LENGTH }
  validates :snapshot, presence: true
end
