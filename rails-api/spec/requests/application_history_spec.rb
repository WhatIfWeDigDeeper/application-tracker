require "rails_helper"

RSpec.describe "Application History API" do
  it "records history and restores a previous snapshot" do
    application = ApplicationService.create({
      "companyName" => "History Corp",
      "positionTitle" => "Engineer"
    })

    patch "/applications/#{application.id}", params: {
      companyName: "Changed Corp",
      positionTitle: "Engineer"
    }, as: :json

    get "/applications/#{application.id}/history"
    expect(response).to have_http_status(:ok)
    history = response.parsed_body
    expect(history["entries"].length).to be >= 2
    expect(history["entries"].first["sequence"]).to eq(2)

    post "/applications/#{application.id}/history/restore", params: { sequence: 1 }, as: :json
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["companyName"]).to eq("History Corp")

    get "/applications/#{application.id}/history"
    expect(response.parsed_body["entries"].first["description"]).to match(/Restored/i)
  end

  it "returns validation_error when restore body omits sequence" do
    application = ApplicationService.create({
      "companyName" => "Validation Corp",
      "positionTitle" => "Engineer"
    })

    post "/applications/#{application.id}/history/restore", params: {}, as: :json

    expect(response).to have_http_status(:bad_request)
    body = response.parsed_body
    expect(body["code"]).to eq("validation_error")
    expect(body["details"]).to include(
      hash_including("field" => "sequence")
    )
  end

  it "returns validation_error when restore sequence is less than 1" do
    application = ApplicationService.create({
      "companyName" => "Validation Corp",
      "positionTitle" => "Engineer"
    })

    post "/applications/#{application.id}/history/restore", params: { sequence: 0 }, as: :json

    expect(response).to have_http_status(:bad_request)
    expect(response.parsed_body["code"]).to eq("validation_error")
  end

  it "preserves interview stage ids when restoring a snapshot" do
    application = ApplicationService.create({
      "companyName" => "Stage History Corp",
      "positionTitle" => "Engineer",
      "status" => "interviewing"
    })
    original_stage_id = application.interview_stages.order(:order).first.id

    patch "/applications/#{application.id}", params: {
      companyName: "Changed Stage History Corp"
    }, as: :json
    expect(response).to have_http_status(:ok)

    post "/applications/#{application.id}/history/restore", params: { sequence: 1 }, as: :json

    expect(response).to have_http_status(:ok)
    restored_stage_ids = response.parsed_body["interviewStages"].map { |stage| stage["id"] }
    expect(restored_stage_ids).to include(original_stage_id)
  end
end
