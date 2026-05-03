# app_tracker

## Tables

| Name | Columns | Comment | Type |
| ---- | ------- | ------- | ---- |
| [go_gin.applications](go_gin.applications.md) | 20 |  | BASE TABLE |
| [go_gin.interview_stages](go_gin.interview_stages.md) | 9 |  | BASE TABLE |
| [go_gin.application_snapshots](go_gin.application_snapshots.md) | 6 |  | BASE TABLE |
| [go_gin.schema_migrations](go_gin.schema_migrations.md) | 2 |  | BASE TABLE |

## Enums

| Name | Values |
| ---- | ------- |
| express_prisma.ApplicationStatus | accepted, applied, interviewing, offered, rejected, unsubmitted |
| express_prisma.CompanyCategory | enterprise, mid_market, other, scale_up, startup |
| express_prisma.JobSource | company_website, job_board, other, recruiter, referral |
| graphql_yoga.application_status | accepted offer, applied, declined offer, given offer, interviewing, no offer, rejected, unsubmitted |
| graphql_yoga.company_category | ai, climate, consulting, consumer-tech, cybersecurity, e-commerce, education, energy, enterprise-software, finance, gaming, government, health, hospitality, media-entertainment, nonprofit, other, restaurant, retail |
| graphql_yoga.job_source | colleague, company-website, friend, indeed, linkedin, other, recruiter |
| java_spring.application_status | accepted offer, applied, declined offer, given offer, interviewing, no offer, rejected, unsubmitted |
| java_spring.company_category | ai, climate, consulting, consumer-tech, cybersecurity, e-commerce, education, energy, enterprise-software, finance, gaming, government, health, hospitality, media-entertainment, nonprofit, other, restaurant, retail |
| java_spring.job_source | colleague, company-website, friend, indeed, linkedin, other, recruiter |
| python_fastapi.application_status | accepted offer, applied, declined offer, given offer, interviewing, no offer, rejected, unsubmitted |
| python_fastapi.company_category | ai, climate, consulting, consumer-tech, cybersecurity, e-commerce, education, energy, enterprise-software, finance, gaming, government, health, hospitality, media-entertainment, nonprofit, other, restaurant, retail |
| python_fastapi.job_source | colleague, company-website, friend, indeed, linkedin, other, recruiter |
| react_koa.application_status | accepted offer, applied, declined offer, given offer, interviewing, no offer, rejected, unsubmitted |
| react_koa.company_category | ai, climate, consulting, consumer-tech, cybersecurity, e-commerce, education, energy, enterprise-software, finance, gaming, government, health, hospitality, media-entertainment, nonprofit, other, restaurant, retail |
| react_koa.job_source | colleague, company-website, friend, indeed, linkedin, other, recruiter |
| react_nestjs.application_status | accepted offer, applied, declined offer, given offer, interviewing, no offer, rejected, unsubmitted |
| react_nestjs.company_category | ai, climate, consulting, consumer-tech, cybersecurity, e-commerce, education, energy, enterprise-software, finance, gaming, government, health, hospitality, media-entertainment, nonprofit, other, restaurant, retail |
| react_nestjs.job_source | colleague, company-website, friend, indeed, linkedin, other, recruiter |
| svelte_hono.application_status | accepted offer, applied, declined offer, given offer, interviewing, no offer, rejected, unsubmitted |
| svelte_hono.company_category | ai, climate, consulting, consumer-tech, cybersecurity, e-commerce, education, energy, enterprise-software, finance, gaming, government, health, hospitality, media-entertainment, nonprofit, other, restaurant, retail |
| svelte_hono.job_source | colleague, company-website, friend, indeed, linkedin, other, recruiter |
| vue_nuxt.application_status | accepted offer, applied, declined offer, given offer, interviewing, no offer, rejected, unsubmitted |
| vue_nuxt.company_category | ai, climate, consulting, consumer-tech, cybersecurity, e-commerce, education, energy, enterprise-software, finance, gaming, government, health, hospitality, media-entertainment, nonprofit, other, restaurant, retail |
| vue_nuxt.job_source | colleague, company-website, friend, indeed, linkedin, other, recruiter |

## Relations

```mermaid
erDiagram

"go_gin.interview_stages" }o--|| "go_gin.applications" : "FOREIGN KEY (application_id) REFERENCES go_gin.applications(id) ON DELETE CASCADE"
"go_gin.application_snapshots" }o--|| "go_gin.applications" : "FOREIGN KEY (application_id) REFERENCES go_gin.applications(id) ON DELETE CASCADE"

"go_gin.applications" {
  id uuid
  company_name text
  position_title text
  status text
  date_applied date
  company_url text
  job_posting_url text
  company_career_url text
  company_category text
  skills_match integer
  job_source text
  salary_min integer
  salary_max integer
  cover_letter_required boolean
  offer_due_date date
  special_requirements text
  notes text
  is_archived boolean
  created_at timestamp_with_time_zone
  updated_at timestamp_with_time_zone
}
"go_gin.interview_stages" {
  id uuid
  application_id uuid FK
  stage_name text
  stage_order integer
  is_completed boolean
  performance_rating text
  notes text
  created_at timestamp_with_time_zone
  updated_at timestamp_with_time_zone
}
"go_gin.application_snapshots" {
  id uuid
  application_id uuid FK
  sequence_number integer
  description text
  snapshot_data jsonb
  created_at timestamp_with_time_zone
}
"go_gin.schema_migrations" {
  version bigint
  dirty boolean
}
```

---

> Generated by [tbls](https://github.com/k1LoW/tbls)
