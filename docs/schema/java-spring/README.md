# app_tracker

## Tables

| Name | Columns | Comment | Type |
| ---- | ------- | ------- | ---- |
| [java_spring.flyway_schema_history](java_spring.flyway_schema_history.md) | 10 |  | BASE TABLE |
| [java_spring.applications](java_spring.applications.md) | 20 |  | BASE TABLE |
| [java_spring.interview_stages](java_spring.interview_stages.md) | 10 |  | BASE TABLE |
| [java_spring.application_snapshots](java_spring.application_snapshots.md) | 6 |  | BASE TABLE |

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

"java_spring.interview_stages" }o--|| "java_spring.applications" : "FOREIGN KEY (application_id) REFERENCES java_spring.applications(id) ON DELETE CASCADE"
"java_spring.application_snapshots" }o--|| "java_spring.applications" : "FOREIGN KEY (application_id) REFERENCES java_spring.applications(id) ON DELETE CASCADE"

"java_spring.flyway_schema_history" {
  installed_rank integer
  version varchar_50_
  description varchar_200_
  type varchar_20_
  script varchar_1000_
  checksum integer
  installed_by varchar_100_
  installed_on timestamp_without_time_zone
  execution_time integer
  success boolean
}
"java_spring.applications" {
  id uuid
  company_name varchar_500_
  position_title varchar_500_
  status java_spring_application_status
  date_applied date
  company_url text
  job_posting_url text
  company_career_url text
  company_category java_spring_company_category
  skills_match integer
  job_source java_spring_job_source
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
"java_spring.interview_stages" {
  id uuid
  application_id uuid FK
  stage_name varchar_200_
  stage_order integer
  is_completed boolean
  completed_date date
  notes text
  performance_rating integer
  created_at timestamp_with_time_zone
  updated_at timestamp_with_time_zone
}
"java_spring.application_snapshots" {
  id uuid
  application_id uuid FK
  sequence_number integer
  description varchar_500_
  data jsonb
  created_at timestamp_with_time_zone
}
```

---

> Generated by [tbls](https://github.com/k1LoW/tbls)
