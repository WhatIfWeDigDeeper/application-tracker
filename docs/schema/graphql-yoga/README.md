# app_tracker

## Tables

| Name | Columns | Comment | Type |
| ---- | ------- | ------- | ---- |
| [graphql_yoga._prisma_migrations](graphql_yoga._prisma_migrations.md) | 8 |  | BASE TABLE |
| [graphql_yoga.applications](graphql_yoga.applications.md) | 20 |  | BASE TABLE |
| [graphql_yoga.interview_stages](graphql_yoga.interview_stages.md) | 10 |  | BASE TABLE |
| [graphql_yoga.application_history](graphql_yoga.application_history.md) | 6 |  | BASE TABLE |

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

"graphql_yoga.interview_stages" }o--|| "graphql_yoga.applications" : "FOREIGN KEY (application_id) REFERENCES graphql_yoga.applications(id) ON UPDATE CASCADE ON DELETE CASCADE"
"graphql_yoga.application_history" }o--|| "graphql_yoga.applications" : "FOREIGN KEY (application_id) REFERENCES graphql_yoga.applications(id) ON UPDATE CASCADE ON DELETE CASCADE"

"graphql_yoga._prisma_migrations" {
  id varchar_36_
  checksum varchar_64_
  finished_at timestamp_with_time_zone
  migration_name varchar_255_
  logs text
  rolled_back_at timestamp_with_time_zone
  started_at timestamp_with_time_zone
  applied_steps_count integer
}
"graphql_yoga.applications" {
  id text
  company_name varchar_200_
  position_title varchar_200_
  status graphql_yoga_application_status
  date_applied date
  job_posting_url text
  company_category graphql_yoga_company_category
  job_source graphql_yoga_job_source
  salary_min integer
  salary_max integer
  skills_match integer
  notes text
  offer_due_date date
  created_at timestamp_3__without_time_zone
  updated_at timestamp_3__without_time_zone
  company_url text
  company_career_url text
  cover_letter_required boolean
  special_requirements text
  is_archived boolean
}
"graphql_yoga.interview_stages" {
  id text
  application_id text FK
  notes text
  created_at timestamp_3__without_time_zone
  updated_at timestamp_3__without_time_zone
  name varchar_200_
  order integer
  is_completed boolean
  completed_date date
  performance_rating integer
}
"graphql_yoga.application_history" {
  id text
  application_id text FK
  sequence integer
  snapshot jsonb
  changed_fields jsonb
  created_at timestamp_3__without_time_zone
}
```

---

> Generated by [tbls](https://github.com/k1LoW/tbls)
