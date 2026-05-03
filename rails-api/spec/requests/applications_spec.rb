require "rails_helper"

RSpec.describe "Applications API" do
  describe "CORS" do
    it "allows localhost UI origins with schemes" do
      options "/applications", headers: {
        "Origin" => "http://localhost:3000",
        "Access-Control-Request-Method" => "GET"
      }

      expect(response.headers["Access-Control-Allow-Origin"]).to eq("http://localhost:3000")
    end
  end

  describe "POST /applications" do
    it "creates an unsubmitted application with null date applied" do
      post "/applications", params: {
        companyName: "RSpec Corp",
        positionTitle: "Engineer"
      }, as: :json

      expect(response).to have_http_status(:created)
      body = response.parsed_body
      expect(body["companyName"]).to eq("RSpec Corp")
      expect(body["positionTitle"]).to eq("Engineer")
      expect(body["status"]).to eq("unsubmitted")
      expect(body["dateApplied"]).to be_nil
    end

    it "rejects invalid date formats" do
      post "/applications", params: {
        companyName: "Bad Date Corp",
        positionTitle: "Engineer",
        status: "applied",
        dateApplied: "01/05/2026"
      }, as: :json

      expect(response).to have_http_status(:bad_request)
      expect(response.parsed_body["code"]).to eq("validation_error")
    end
  end

  describe "PATCH /applications/:id" do
    it "preserves dateApplied on status-bearing PATCH that omits the date" do
      application = ApplicationService.create({
        "companyName" => "Preserve Corp",
        "positionTitle" => "Engineer",
        "status" => "applied",
        "dateApplied" => "2025-12-01"
      })

      patch "/applications/#{application.id}", params: {
        companyName: "Preserve Corp Renamed",
        positionTitle: "Engineer",
        status: "applied"
      }, as: :json

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body["dateApplied"]).to eq("2025-12-01")
      expect(application.reload.date_applied.iso8601).to eq("2025-12-01")

      latest_snapshot = application.application_snapshots.order(:sequence).last
      expect(latest_snapshot.description).not_to include("Date Applied")
    end

    it "forces dateApplied to null when status returns to unsubmitted" do
      application = ApplicationService.create({
        "companyName" => "Status Corp",
        "positionTitle" => "Engineer",
        "status" => "applied",
        "dateApplied" => "2026-01-01"
      })

      patch "/applications/#{application.id}", params: {
        companyName: "Status Corp",
        positionTitle: "Engineer",
        status: "unsubmitted",
        dateApplied: "2026-02-01"
      }, as: :json

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body["status"]).to eq("unsubmitted")
      expect(body["dateApplied"]).to be_nil
    end

    it "creates default stages when moving to interviewing" do
      application = ApplicationService.create({
        "companyName" => "Interview Corp",
        "positionTitle" => "Engineer"
      })

      patch "/applications/#{application.id}", params: {
        companyName: "Interview Corp",
        positionTitle: "Engineer",
        status: "interviewing"
      }, as: :json

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["interviewStages"].map { |stage| stage["name"] }).to include("Phone Screen", "Final Decision")
    end

    it "rejects transitions away from terminal statuses" do
      application = ApplicationService.create({
        "companyName" => "Terminal Corp",
        "positionTitle" => "Engineer",
        "status" => "accepted offer"
      })

      patch "/applications/#{application.id}", params: {
        status: "applied"
      }, as: :json

      expect(response).to have_http_status(:bad_request)
      expect(response.parsed_body["details"]).to include(
        hash_including("field" => "status", "message" => "cannot transition from terminal status")
      )
    end
  end

  describe "GET /applications" do
    it "filters, sorts, and paginates applications" do
      ApplicationService.create({
        "companyName" => "Applied Corp",
        "positionTitle" => "Engineer",
        "status" => "applied"
      })
      ApplicationService.create({
        "companyName" => "Draft Corp",
        "positionTitle" => "Engineer"
      })

      get "/applications", params: { status: "applied", limit: 1, sortBy: "companyName", sortDir: "asc" }

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body["items"].length).to eq(1)
      expect(body["items"].first["status"]).to eq("applied")
      expect(body["total"]).to eq(1)
    end
  end

  describe "archive and restore" do
    it "archives and restores applications" do
      application = ApplicationService.create({
        "companyName" => "Archive Corp",
        "positionTitle" => "Engineer"
      })

      post "/applications/#{application.id}/archive"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["isArchived"]).to be(true)

      post "/applications/#{application.id}/restore"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["isArchived"]).to be(false)
    end
  end
end
