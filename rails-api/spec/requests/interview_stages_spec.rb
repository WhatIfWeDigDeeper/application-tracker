require "rails_helper"

RSpec.describe "Interview Stages API" do
  let(:application) do
    ApplicationService.create({
      "companyName" => "Stages Corp",
      "positionTitle" => "Engineer"
    })
  end

  it "creates, updates, and deletes an interview stage" do
    post "/applications/#{application.id}/interview-stages", params: {
      name: "Phone Screen",
      order: 1,
      isCompleted: true,
      completedDate: "2026-01-09",
      performanceRating: 5
    }, as: :json

    expect(response).to have_http_status(:created)
    stage = response.parsed_body
    expect(stage["name"]).to eq("Phone Screen")
    expect(stage["completedDate"]).to eq("2026-01-09")

    patch "/applications/#{application.id}/interview-stages/#{stage['id']}", params: {
      name: "Technical Screen",
      order: 2,
      isCompleted: false
    }, as: :json

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["name"]).to eq("Technical Screen")
    expect(response.parsed_body["order"]).to eq(2)

    delete "/applications/#{application.id}/interview-stages/#{stage['id']}"
    expect(response).to have_http_status(:no_content)
  end
end
