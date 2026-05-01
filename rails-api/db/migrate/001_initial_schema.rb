class InitialSchema < ActiveRecord::Migration[8.0]
  def up
    enable_extension "pgcrypto" unless extension_enabled?("pgcrypto")

    execute <<~SQL
      CREATE SCHEMA IF NOT EXISTS ruby_rails;

      CREATE TABLE ruby_rails.applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_name VARCHAR(200) NOT NULL,
        position_title VARCHAR(200) NOT NULL,
        date_applied DATE,
        status VARCHAR(50) NOT NULL DEFAULT 'unsubmitted',
        company_url TEXT,
        job_posting_url TEXT,
        company_career_url TEXT,
        company_category VARCHAR(100),
        skills_match INTEGER,
        job_source VARCHAR(100),
        cover_letter_required BOOLEAN,
        special_requirements TEXT,
        salary_min INTEGER,
        salary_max INTEGER,
        notes TEXT,
        offer_due_date DATE,
        is_archived BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX index_ruby_rails_applications_on_status ON ruby_rails.applications(status);
      CREATE INDEX index_ruby_rails_applications_on_company_category ON ruby_rails.applications(company_category);
      CREATE INDEX index_ruby_rails_applications_on_job_source ON ruby_rails.applications(job_source);
      CREATE INDEX index_ruby_rails_applications_on_is_archived ON ruby_rails.applications(is_archived);
      CREATE INDEX index_ruby_rails_applications_on_updated_at ON ruby_rails.applications(updated_at);
      CREATE INDEX index_ruby_rails_applications_on_job_posting_url ON ruby_rails.applications(job_posting_url);

      CREATE TABLE ruby_rails.interview_stages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id UUID NOT NULL REFERENCES ruby_rails.applications(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        "order" INTEGER NOT NULL,
        is_completed BOOLEAN NOT NULL DEFAULT FALSE,
        completed_date DATE,
        notes TEXT,
        performance_rating INTEGER
      );

      CREATE INDEX index_ruby_rails_interview_stages_on_application_id
        ON ruby_rails.interview_stages(application_id);
      CREATE INDEX index_ruby_rails_interview_stages_on_application_id_order
        ON ruby_rails.interview_stages(application_id, "order");

      CREATE TABLE ruby_rails.application_snapshots (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id UUID NOT NULL REFERENCES ruby_rails.applications(id) ON DELETE CASCADE,
        sequence INTEGER NOT NULL,
        description VARCHAR(500) NOT NULL,
        snapshot JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE UNIQUE INDEX index_ruby_rails_application_snapshots_on_application_sequence
        ON ruby_rails.application_snapshots(application_id, sequence);
      CREATE INDEX index_ruby_rails_application_snapshots_on_created_at
        ON ruby_rails.application_snapshots(created_at);
    SQL
  end

  def down
    execute "DROP SCHEMA IF EXISTS ruby_rails CASCADE"
  end
end
