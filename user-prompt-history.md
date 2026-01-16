# User Prompt with SpecKit (/specify)

```markdown
/speckit.specify Build an application that can help track a user's job applications.
* The application should allow one to add new job applications with details such as company name, position, date applied, status (e.g., applied, interviewing, offered, rejected), and notes.
* Each company may have different rounds for interviewing. When the job application is in interviewing status, we should support multiple sub-states with a checklist in the order of the interviewing rounds. We will default the steps to Contacted by Recruiter, Interview with Recruiter, Interview with Hiring Manager, Exercise, Technical Interview, Cross-functional interviews. They should each have a completion date, an optional note section, and a rating scale from 1 - 5 with how the applicant think they did.
* If an offer is made it may have a due date.
* I should be able to archive or delete job applications.
* I should be able to view a list of all my job applications, filter them by status, and sort them by date applied or company name.
* The application should have a user-friendly interface and be accessible on both desktop and mobile devices.
```

```markdown
/speckit.clarify each application should support the name of the company applied to, the url to the company website, the title of the position with urls to the job site (such as LinkedIn) and the post on the company site. The category of the company, such as Education, Health, Climate, AI, FinTech. An indicator of skills match, High Medium Low, whether the application requires a cover letter, any special things requested as part of the job application, like sample of portfolio, sample code, etc. We should support the optional salary range, max and/or min.
```


```md
/speckit.plan The application is written in Typescript and uses React, Docker, Node, NextJs, Vite, Jest, Tailwind CSS, SVGs for any images/icons.
```
