require "rails_helper"

RSpec.describe JobApplication do
  it "validates required fields and enum values" do
    application = described_class.new(company_name: "", position_title: "", status: "unknown")

    expect(application).not_to be_valid
    expect(application.errors[:company_name]).to be_present
    expect(application.errors[:position_title]).to be_present
    expect(application.errors[:status]).to be_present
  end

  it "validates salary range ordering" do
    application = described_class.new(
      company_name: "Salary Corp",
      position_title: "Engineer",
      salary_min: 150_000,
      salary_max: 100_000
    )

    expect(application).not_to be_valid
    expect(application.errors[:salary_max]).to be_present
  end
end
