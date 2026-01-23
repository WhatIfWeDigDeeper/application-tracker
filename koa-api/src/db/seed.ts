import "dotenv/config";
import { v4 as uuid } from "uuid";
import pool from "./client.js";

const sampleApplications = [
  {
    company_name: "TechCorp Inc",
    position_title: "Senior Software Engineer",
    status: "interviewing",
    company_category: "enterprise-software",
    skills_match: 4,
    job_source: "linkedin",
    cover_letter_required: true,
    salary_min: 150000,
    salary_max: 200000,
    notes: "Great company culture, interviewed by John Smith",
  },
  {
    company_name: "AI Startup",
    position_title: "Full Stack Developer",
    status: "applied",
    company_category: "ai",
    skills_match: 5,
    job_source: "recruiter",
    cover_letter_required: false,
    salary_min: 130000,
    salary_max: 180000,
    notes: "Promising early-stage company",
  },
  {
    company_name: "FinTech Solutions",
    position_title: "Backend Engineer",
    status: "given offer",
    company_category: "finance",
    skills_match: 4,
    job_source: "friend",
    cover_letter_required: true,
    salary_min: 140000,
    salary_max: 170000,
    offer_due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    notes: "Offer received! Need to decide by next week",
  },
  {
    company_name: "Healthcare Tech",
    position_title: "Platform Engineer",
    status: "rejected",
    company_category: "health",
    skills_match: 3,
    job_source: "company-website",
    cover_letter_required: false,
    notes: "Rejected after second round",
  },
  {
    company_name: "Green Energy Co",
    position_title: "DevOps Engineer",
    status: "no offer",
    company_category: "climate",
    skills_match: 4,
    job_source: "indeed",
    notes: "Completed all interviews but no offer extended",
  },
];

const defaultInterviewStages = [
  "Contacted by Recruiter",
  "Interview with Recruiter",
  "Interview with Hiring Manager",
  "Exercise",
  "Technical Interview",
  "Cross-functional Interviews",
];

async function seed(): Promise<void> {
  console.log("Starting database seed...");

  const client = await pool.connect();

  try {
    await client.query("SET search_path TO react_koa");
    await client.query("BEGIN");

    // Clear existing data
    console.log("Clearing existing data...");
    await client.query("DELETE FROM interview_stages");
    await client.query("DELETE FROM applications");

    // Insert applications
    console.log("Inserting sample applications...");
    for (const app of sampleApplications) {
      const appId = uuid();
      await client.query(
        `INSERT INTO applications (
          id, company_name, position_title, status, company_category,
          skills_match, job_source, cover_letter_required, salary_min,
          salary_max, notes, offer_due_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          appId,
          app.company_name,
          app.position_title,
          app.status,
          app.company_category,
          app.skills_match,
          app.job_source,
          app.cover_letter_required,
          app.salary_min,
          app.salary_max,
          app.notes,
          app.offer_due_date || null,
        ]
      );

      // Add interview stages for interviewing and offer applications
      if (["interviewing", "given offer", "no offer"].includes(app.status)) {
        console.log(`Adding interview stages for ${app.company_name}...`);
        for (let i = 0; i < defaultInterviewStages.length; i++) {
          const isCompleted =
            app.status === "given offer" || app.status === "no offer"
              ? true
              : i < 2;
          await client.query(
            `INSERT INTO interview_stages (
              id, application_id, name, "order", is_completed, completed_date
            ) VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              uuid(),
              appId,
              defaultInterviewStages[i],
              i,
              isCompleted,
              isCompleted
                ? new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split("T")[0]
                : null,
            ]
          );
        }
      }
    }

    await client.query("COMMIT");
    console.log("Seed completed successfully!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
