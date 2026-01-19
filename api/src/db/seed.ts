import { prisma } from "./client";

const seed = async (): Promise<void> => {
  // eslint-disable-next-line no-console
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.interviewStage.deleteMany({});
  await prisma.application.deleteMany({});

  // Create sample applications
  const app1 = await prisma.application.create({
    data: {
      companyName: "Acme Corp",
      positionTitle: "Senior Engineer",
      dateApplied: new Date("2026-01-10"),
      status: "interviewing",
      companyUrl: "https://acme.com",
      jobPostingUrl: "https://acme.com/jobs/123",
      companyCategory: "enterprise-software",
      skillsMatch: 5,
      jobSource: "linkedin",
      salaryMin: 120000,
      salaryMax: 160000,
      notes: "Great company, excited about the role",
      isArchived: false,
    },
  });

  const app2 = await prisma.application.create({
    data: {
      companyName: "Tech Startup",
      positionTitle: "Full Stack Developer",
      dateApplied: new Date("2026-01-15"),
      status: "applied",
      jobPostingUrl: "https://startup.com/jobs/456",
      companyCategory: "consumer-tech",
      skillsMatch: 4,
      jobSource: "company-website",
      salaryMin: 100000,
      salaryMax: 140000,
      notes: "Early stage, good learning opportunity",
      isArchived: false,
    },
  });

  // Create interview stages for app1
  await prisma.interviewStage.create({
    data: {
      applicationId: app1.id,
      name: "Phone Screen",
      order: 1,
      isCompleted: true,
      completedDate: new Date("2026-01-12"),
      performanceRating: 4,
      notes: "Went well, recruiter seemed pleased",
    },
  });

  await prisma.interviewStage.create({
    data: {
      applicationId: app1.id,
      name: "Technical Interview",
      order: 2,
      isCompleted: false,
      notes: "Scheduled for 2026-01-20",
    },
  });
  // eslint-disable-next-line no-console
  console.log("✅ Seed complete!");
};

seed()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
