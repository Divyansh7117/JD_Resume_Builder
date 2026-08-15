import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { runEvaluationPipeline } from "../lib/pipeline";
import { validateMatchConsistency } from "../lib/validator";
import { STATUS_SCORES } from "../lib/semanticMatcher";

interface TestCase {
  id: string;
  name: string;
  domain: string;
  targetFitBucket: "0-24" | "25-49" | "50-69" | "70-84" | "85-99" | "100";
  jd: string;
  resume: string;
}

const STRESS_TEST_CASES: TestCase[] = [
  // ─── BUCKET 1: ALMOST NO MATCH (0–24%) ───
  {
    id: "TC01",
    name: "Graphic Designer applying to Machine Learning Systems Engineer",
    domain: "ML / GPU Infrastructure",
    targetFitBucket: "0-24",
    jd: `ML Infrastructure Engineer | DeepTech Labs
Requirements:
- 3+ years in ML Systems and GPU infrastructure
- High-throughput distributed training with PyTorch and CUDA
- Containerized model serving with Triton Server and Kubernetes
- Vector database indexing with Milvus or Pinecone
- Advanced C++ and Python performance optimization`,
    resume: `EMILY CHEN
emily.c@example.com | Los Angeles, CA

SUMMARY
Graphic and brand designer with 4 years creating typography, vector art, and motion design.

EXPERIENCE
Brand Designer — Studio Mirage (2022 - Present)
• Designed brand guidelines, logo systems, and marketing illustrations.
• Created 3D motion animations in Adobe After Effects and Blender.
• Collaborated with product teams in Figma.

SKILLS
Figma, Photoshop, Illustrator, InDesign, After Effects, Typography, Branding`,
  },
  {
    id: "TC02",
    name: "Customer Support Specialist applying to Site Reliability Engineer",
    domain: "DevOps / SRE",
    targetFitBucket: "0-24",
    jd: `Site Reliability Engineer | CloudScale Networks
Requirements:
- 3+ years managing multi-region Kubernetes clusters
- Infrastructure as Code with Terraform
- Configuration management with Ansible
- Prometheus telemetry and alerting
- Scripting in Go or Python for automation`,
    resume: `JASON REED
jason.r@example.com | Denver, CO

SUMMARY
Customer Support Specialist with 3 years assisting SaaS users with billing and account setup.

EXPERIENCE
Support Specialist — HelpDesk Solutions (2023 - Present)
• Resolved 50+ customer tickets daily via Zendesk and Intercom.
• Authored knowledge base FAQs and user onboarding documentation.

SKILLS
Zendesk, Intercom, Customer Support, CRM, Microsoft Office, Communication`,
  },
  {
    id: "TC03",
    name: "Accountant applying to Full Stack Web Developer",
    domain: "Full Stack Web",
    targetFitBucket: "0-24",
    jd: `Full Stack Engineer | WebWorks
Requirements:
- Strong proficiency in React and TypeScript
- Backend API development with Node.js and Express
- Relational database management with PostgreSQL
- Docker containerization
- Automated testing with Jest`,
    resume: `BRIAN KELLY
brian.k@example.com | Chicago, IL

SUMMARY
Certified Public Accountant with 4 years in audit and corporate tax accounting.

EXPERIENCE
Senior Accountant — Baker & Associates (2022 - Present)
• Prepared corporate tax returns and audited balance sheets.
• Reconciled financial statements in QuickBooks and Excel.

SKILLS
QuickBooks, Excel, Financial Audit, Tax Accounting, GAAP, Financial Reporting`,
  },

  // ─── BUCKET 2: LOW-TO-MODERATE PARTIAL MATCH (25–49%) ───
  {
    id: "TC04",
    name: "Junior Frontend (JS only, no TS/React/Docker) vs Full Stack JD",
    domain: "Full Stack Web",
    targetFitBucket: "25-49",
    jd: `Full Stack Engineer | NextTech
Requirements:
- 3+ years building enterprise web apps
- Mastery of TypeScript and React
- Backend microservices with Node.js and PostgreSQL
- Container deployment with Docker on AWS
- Automated testing with Jest and Cypress`,
    resume: `TYLER BROOKS
tyler.b@example.com | Austin, TX

SUMMARY
Junior web developer with 1 year creating basic static web pages with HTML, CSS, and vanilla JavaScript.

EXPERIENCE
Junior Web Designer — Apex Agency (2025 - Present)
• Built responsive landing pages using HTML5, CSS3, and JavaScript.
• Fixed minor CSS layout bugs across desktop and mobile browsers.

SKILLS
JavaScript, HTML5, CSS3, jQuery, Git`,
  },
  {
    id: "TC05",
    name: "Data Analyst (SQL/Excel only) vs Data Scientist JD (ML/Python/Databricks)",
    domain: "Data Science",
    targetFitBucket: "25-49",
    jd: `Lead Data Scientist | FinMetrics
Requirements:
- 4+ years in machine learning and statistical modeling
- Deep learning architectures in PyTorch or TensorFlow
- Distributed big data processing in Databricks Apache Spark
- Advanced SQL and data warehousing in Snowflake
- Production ML deployment with Docker`,
    resume: `KAREN WHITE
karen.w@example.com | New York, NY

SUMMARY
Data Analyst with 2 years querying databases and building basic spreadsheets.

EXPERIENCE
BI Analyst — Metro Corp (2024 - Present)
• Wrote SQL select queries to pull sales reports from internal MySQL databases.
• Built monthly sales forecasting spreadsheets in Microsoft Excel.

SKILLS
SQL, Microsoft Excel, Power BI, Reporting`,
  },
  {
    id: "TC06",
    name: "Junior QA Tester vs Senior Backend Systems Engineer",
    domain: "Backend Systems",
    targetFitBucket: "25-49",
    jd: `Senior Backend Engineer | HighLoad Systems
Requirements:
- 4+ years designing high-throughput distributed backend services
- Expert knowledge of Go (Golang) and concurrency
- Event streaming with Apache Kafka
- Redis caching and distributed locking
- PostgreSQL schema design and indexing`,
    resume: `SAMUEL GREEN
sam.g@example.com | Seattle, WA

SUMMARY
Manual QA Tester with 2 years verifying web applications.

EXPERIENCE
QA Tester — BetaTest Labs (2024 - Present)
• Executed manual test test plans for REST APIs using Postman.
• Wrote basic SQL queries to verify test database state.
• Logged bug reports in Jira.

SKILLS
Postman, REST APIs, Manual Testing, Jira, Basic SQL, Git`,
  },
  {
    id: "TC07",
    name: "Mobile Flutter Developer vs Cloud DevOps Engineer",
    domain: "DevOps",
    targetFitBucket: "25-49",
    jd: `Cloud DevOps Engineer | InfraCore
Requirements:
- 3+ years managing AWS cloud infrastructure
- Kubernetes cluster management
- Terraform Infrastructure as Code
- CI/CD pipeline automation with GitHub Actions
- Linux system administration`,
    resume: `DANIEL KIM
daniel.k@example.com | San Jose, CA

SUMMARY
Mobile App Developer with 2 years building cross-platform Flutter mobile applications.

EXPERIENCE
Mobile Developer — AppCraft (2024 - Present)
• Built mobile iOS and Android apps using Flutter and Dart.
• Configured basic GitHub Actions CI/CD workflows for mobile test builds.
• Used Git for team version control.

SKILLS
Flutter, Dart, Mobile UI, Git, GitHub Actions, REST APIs`,
  },

  // ─── BUCKET 3: MODERATE FIT (50–69%) ───
  {
    id: "TC08",
    name: "Frontend-Only Dev (React/JS/CSS) vs Full Stack JD (Missing Node/Postgres/AWS)",
    domain: "Full Stack Web",
    targetFitBucket: "50-69",
    jd: `Full Stack Developer | CloudCommerce
Must-Have Requirements:
- Strong experience in React and JavaScript
- Backend development with Node.js and Express
- Relational database management in PostgreSQL
- Cloud hosting on AWS
- Containerization with Docker`,
    resume: `LISA MONROE
lisa.m@example.com | Atlanta, GA

SUMMARY
Frontend Developer with 3 years building responsive React single-page applications.

EXPERIENCE
Frontend Developer — PixelFront (2023 - Present)
• Built modern UI components and state management with React and JavaScript.
• Integrated frontend apps with third-party backend REST APIs.
• Styled responsive interfaces using CSS3 and Tailwind CSS.

SKILLS
React, JavaScript, HTML5, CSS3, Tailwind CSS, REST APIs, Git`,
  },
  {
    id: "TC09",
    name: "Backend Node Developer vs Cloud-Native Go Backend JD",
    domain: "Backend Systems",
    targetFitBucket: "50-69",
    jd: `Cloud Backend Engineer | StreamData
Requirements:
- 3+ years backend development
- High-concurrency services in Go (Golang)
- Relational databases (PostgreSQL)
- Message queues (Kafka or RabbitMQ)
- Docker containerization
- Kubernetes deployment`,
    resume: `KEVIN ZHAO
kevin.z@example.com | Boston, MA

SUMMARY
Backend Developer with 3 years building Node.js microservices with PostgreSQL and Docker.

EXPERIENCE
Backend Engineer — API Solutions (2023 - Present)
• Built RESTful microservices in Node.js and Express.
• Designed relational schemas and queries in PostgreSQL.
• Containerized microservices using Docker for local staging.
• Integrated RabbitMQ for asynchronous background job queuing.

SKILLS
Node.js, PostgreSQL, Docker, RabbitMQ, REST APIs, Express, JavaScript, Git`,
  },
  {
    id: "TC10",
    name: "Data Analyst with Python/SQL vs Full Machine Learning Engineer JD",
    domain: "Machine Learning",
    targetFitBucket: "50-69",
    jd: `Machine Learning Engineer | VisionAI
Requirements:
- 3+ years in machine learning engineering
- Advanced Python data science (Pandas, NumPy)
- Deep learning model development with PyTorch
- GPU optimization and CUDA kernel development
- Computer Vision architectures (CNNs, Transformers)
- Model serving in Docker`,
    resume: `AMANDA ROSS
amanda.r@example.com | Dallas, TX

SUMMARY
Data Scientist with 3 years in tabular machine learning, Python, and statistical modeling.

EXPERIENCE
Data Scientist — Analytics Hub (2023 - Present)
• Built predictive models using Python, Pandas, NumPy, and Scikit-Learn.
• Containerized data scripts in Docker containers.
• Queried structured datasets in SQL databases.

SKILLS
Python, Pandas, NumPy, Scikit-Learn, SQL, Docker, Machine Learning, Git`,
  },
  {
    id: "TC11",
    name: "Systems Admin (Linux/Ansible) vs Cloud SRE (Missing K8s/Terraform/AWS)",
    domain: "DevOps / SRE",
    targetFitBucket: "50-69",
    jd: `Senior SRE | CloudMatrix
Requirements:
- 4+ years infrastructure and operations
- Production Kubernetes cluster administration
- Terraform Infrastructure as Code
- Linux system administration
- Server automation with Ansible
- Telemetry with Prometheus`,
    resume: `ROBERT SHAW
robert.s@example.com | Philadelphia, PA

SUMMARY
Linux Systems Administrator with 4 years managing on-premise Linux infrastructure.

EXPERIENCE
Linux Sysadmin — DataTrust Corp (2022 - Present)
• Automated server configuration and patch management using Ansible playbooks.
• Administered RedHat and Ubuntu Linux production servers.
• Wrote Bash shell scripts for automated database backups.
• Monitored system health with Prometheus and Grafana.

SKILLS
Linux, Ansible, Prometheus, Grafana, Bash Scripting, Networking, Git`,
  },

  // ─── BUCKET 4: STRONG FIT WITH GAPS (70–84%) ───
  {
    id: "TC12",
    name: "Senior Full Stack Dev (has React/Node/Postgres, missing GraphQL & Next.js)",
    domain: "Full Stack Web",
    targetFitBucket: "70-84",
    jd: `Senior Full Stack Engineer | OmniWeb
Requirements:
- 4+ years full stack engineering
- React single page applications
- Next.js server-side rendering
- TypeScript for type safety
- Backend API services with Node.js
- Relational databases with PostgreSQL
- GraphQL API design`,
    resume: `GREGORY PALMER
greg.p@example.com | San Francisco, CA

SUMMARY
Senior Full Stack Developer with 4 years building web apps with React, TypeScript, and Node.js.

EXPERIENCE
Full Stack Engineer — CloudTech Systems (2022 - Present)
• Architected complex client applications using React and TypeScript.
• Built RESTful backend microservices in Node.js with Express.
• Designed relational database schemas in PostgreSQL.
• Implemented automated unit tests with Jest.

SKILLS
React, TypeScript, Node.js, PostgreSQL, Express, Jest, REST APIs, JavaScript, Git`,
  },
  {
    id: "TC13",
    name: "SRE (has AWS/K8s/Terraform/Docker, missing Prometheus & Go)",
    domain: "DevOps / SRE",
    targetFitBucket: "70-84",
    jd: `Staff SRE | CloudScale
Requirements:
- 4+ years cloud infrastructure
- Kubernetes multi-cluster administration
- Infrastructure as Code with Terraform
- AWS cloud architecture
- Containerization with Docker
- Observability with Prometheus
- Internal tooling in Go (Golang)`,
    resume: `NATHAN DRAKE
nathan.d@example.com | Seattle, WA

SUMMARY
Site Reliability Engineer with 5 years managing AWS infrastructure and Kubernetes.

EXPERIENCE
Senior SRE — Orbit Cloud (2021 - Present)
• Managed production Kubernetes clusters on AWS EKS.
• Provisioned cloud infrastructure using Terraform modules.
• Containerized microservices using Docker.
• Automated deployment workflows using Python scripts and CI/CD.

SKILLS
AWS, Kubernetes, Terraform, Docker, Python, Linux, Bash, CI/CD, Git`,
  },
  {
    id: "TC14",
    name: "Product Manager (has PRDs/Roadmaps/Analytics, missing A/B Testing)",
    domain: "Product Management",
    targetFitBucket: "70-84",
    jd: `Senior Product Manager | GrowthLab
Requirements:
- 4+ years SaaS product management
- Authoring detailed PRDs
- Product roadmap planning
- Customer discovery interviews
- Hypothesis-driven A/B testing
- Agile scrum methodologies`,
    resume: `RACHEL VAUGHN
rachel.v@example.com | Chicago, IL

SUMMARY
Product Manager with 4 years leading product delivery in B2B SaaS platforms.

EXPERIENCE
Product Manager — CloudSaaS (2022 - Present)
• Formulated quarterly product roadmaps aligned with business goals.
• Authored 15+ comprehensive PRDs for major platform feature releases.
• Conducted 40+ customer discovery interviews to identify feature requirements.
• Led sprint planning and backlog grooming as Agile Scrum Product Owner.

SKILLS
Product Roadmapping, PRDs, Customer Discovery, Agile, Scrum, Jira, User Stories`,
  },
  {
    id: "TC15",
    name: "Data Engineer (has Python/SQL/Snowflake, missing Kafka & Databricks)",
    domain: "Data Engineering",
    targetFitBucket: "70-84",
    jd: `Senior Data Engineer | DataPipe
Requirements:
- 3+ years data engineering
- Advanced SQL and data warehousing with Snowflake
- Python ETL pipelines with Pandas
- Real-time streaming with Apache Kafka
- Big data processing with Databricks
- Airflow DAG pipeline scheduling`,
    resume: `JUSTIN LI
justin.li@example.com | New York, NY

SUMMARY
Data Engineer with 3 years building data pipelines and data warehouse schemas.

EXPERIENCE
Data Engineer — Nexus Data (2023 - Present)
• Engineered ETL pipelines in Python using Pandas.
• Designed and optimized analytical data warehouse tables in Snowflake using SQL.
• Scheduled automated batch workflows using Apache Airflow DAGs.

SKILLS
Snowflake, Python, SQL, Apache Airflow, Pandas, ETL Pipelines, Git`,
  },

  // ─── BUCKET 5: HIGH FIT WITH MINOR GAP OR CLAIMED SKILLS (85–99%) ───
  {
    id: "TC16",
    name: "Full Stack Dev with all skills demonstrated except 1 claimed in Skills",
    domain: "Full Stack Web",
    targetFitBucket: "85-99",
    jd: `Full Stack Engineer | HighImpact
Requirements:
- 3+ years full stack web engineering
- React and Next.js frontend development
- TypeScript type safety
- Node.js backend services
- PostgreSQL databases
- Docker containerization`,
    resume: `ALEX RIVERA
alex.r@example.com | Remote

SUMMARY
Full Stack Engineer with 3 years building web apps with React, Next.js, and Node.js.

EXPERIENCE
Full Stack Developer — WebCraft (2023 - Present)
• Built web applications with React, Next.js, and TypeScript.
• Developed REST APIs with Node.js and PostgreSQL.
• Containerized development environments in Docker.

SKILLS
React, Next.js, TypeScript, Node.js, PostgreSQL, Docker, JavaScript, Git`,
  },
  {
    id: "TC17",
    name: "DevOps Engineer with 5 of 6 hard skills demonstrated + 1 in Skills section",
    domain: "DevOps",
    targetFitBucket: "85-99",
    jd: `DevOps Engineer | CloudScale
Requirements:
- 3+ years cloud DevOps experience
- Kubernetes cluster administration
- Terraform Infrastructure as Code
- AWS cloud hosting
- Prometheus monitoring
- Docker containers
- CI/CD automation`,
    resume: `MARK TUCKER
mark.t@example.com | Austin, TX

SUMMARY
DevOps Engineer with 4 years automating cloud infrastructure on AWS.

EXPERIENCE
DevOps Engineer — Orbit Tech (2022 - Present)
• Managed Kubernetes clusters deployed on AWS.
• Wrote Terraform modules for infrastructure provisioning.
• Containerized apps with Docker and built CI/CD pipelines.
• Monitored services using Prometheus.

SKILLS
Kubernetes, Terraform, AWS, Docker, CI/CD, Prometheus, Linux, Git`,
  },
  {
    id: "TC18",
    name: "ML Engineer satisfying 4 of 5 requirements with 1 claimed skill",
    domain: "Machine Learning",
    targetFitBucket: "85-99",
    jd: `Senior Machine Learning Engineer | DeepMatrix
Requirements:
- 3+ years ML engineering experience
- Deep learning architectures with PyTorch
- Python data stack (Pandas, NumPy)
- Model deployment with Docker
- Relational SQL databases
- C++ optimization`,
    resume: `SIMON CHENG
simon.c@example.com | San Francisco, CA

SUMMARY
ML Engineer with 3 years building deep learning systems in Python and PyTorch.

EXPERIENCE
ML Engineer — NeuralTech (2023 - Present)
• Trained neural networks with PyTorch in Python.
• Containerized ML inference services using Docker.
• Wrote complex analytical queries in SQL.
• Used Pandas and NumPy for feature engineering.

SKILLS
PyTorch, Python, Docker, SQL, Pandas, NumPy, C++, Git`,
  },

  // ─── BUCKET 6: PERFECT 100% MATCH ───
  {
    id: "TC19",
    name: "Full Stack Engineer with 100% verified demonstrated match",
    domain: "Full Stack Web",
    targetFitBucket: "100",
    jd: `Full Stack Engineer | PerfectFit
Requirements:
- 3+ years full stack web development
- React frontend development
- Node.js backend development
- PostgreSQL databases
- Docker containerization`,
    resume: `EMMA WATSON
emma.w@example.com | Remote

SUMMARY
Full Stack Engineer with 3 years building web applications with React, Node.js, and PostgreSQL.

EXPERIENCE
Full Stack Engineer — TechCorp (2023 - Present)
• Developed single-page web applications with React.
• Built backend REST APIs in Node.js.
• Designed relational databases in PostgreSQL.
• Deployed services in Docker containers.

SKILLS
React, Node.js, PostgreSQL, Docker, Git`,
  },
  {
    id: "TC20",
    name: "SRE Engineer with 100% verified demonstrated match",
    domain: "DevOps / SRE",
    targetFitBucket: "100",
    jd: `Site Reliability Engineer | PerfectCloud
Requirements:
- 3+ years cloud infrastructure
- Kubernetes container orchestration
- Terraform Infrastructure as Code
- AWS cloud hosting
- Prometheus monitoring`,
    resume: `DAVID MILLER
david.m@example.com | Austin, TX

SUMMARY
SRE with 4 years automating cloud infrastructure on AWS.

EXPERIENCE
SRE — SkyCloud (2022 - Present)
• Managed production Kubernetes clusters on AWS.
• Built Infrastructure as Code with Terraform.
• Configured Prometheus alerts and metrics monitoring.

SKILLS
Kubernetes, Terraform, AWS, Prometheus, Docker, Git`,
  },
];

async function runComprehensiveStressTest() {
  console.log("\n╔═══════════════════════════════════════════════════════════════════════╗");
  console.log("║           COMPREHENSIVE 20-PAIR STRESS TEST & SCORE DISTRIBUTION      ║");
  console.log("║           IMPERFECT CANDIDATES • EVIDENCE TIERS • REPEATABILITY       ║");
  console.log("╚═══════════════════════════════════════════════════════════════════════╝\n");

  const results: {
    id: string;
    name: string;
    domain: string;
    targetBucket: string;
    actualScore: number;
    hardScore: number;
    matchedCount: number;
    partialCount: number;
    missingCount: number;
    totalEvaluated: number;
    validMath: boolean;
    validConsistency: boolean;
  }[] = [];

  let testIdx = 0;
  for (const testCase of STRESS_TEST_CASES) {
    testIdx++;
    console.log(`\n─────────────────────────────────────────────────────────────────────────`);
    console.log(`▶ [${testIdx}/20] Running ${testCase.id}: ${testCase.name}`);
    console.log(`  Domain: ${testCase.domain} | Target Bucket: ${testCase.targetFitBucket}%`);
    console.log(`─────────────────────────────────────────────────────────────────────────`);

    try {
      const pipelineRes = await runEvaluationPipeline(testCase.jd, testCase.resume, { bypassCache: true });
      const analysis = pipelineRes.tailored.match_analysis!;

      const evaluations = analysis.evaluations || [];
      const matched = analysis.matched_requirements || [];
      const partial = analysis.partial_requirements || [];
      const missing = analysis.missing_requirements || [];

      // Independent Math Verification
      let totalWeightedScore = 0;
      let totalWeight = 0;
      for (const req of evaluations) {
        const w = req.weight || 1.0;
        totalWeightedScore += w * req.score * 100;
        totalWeight += w;
      }
      const recalculatedScore = totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;
      const validMath = analysis.match_score === recalculatedScore && (matched.length + partial.length + missing.length === evaluations.length);

      // Invariant Validation
      const consistency = validateMatchConsistency(analysis, pipelineRes.originalResume);

      console.log(`  • Engine Score: ${analysis.match_score}% | Hard Req Score: ${analysis.hard_requirement_match_score}%`);
      console.log(`  • Breakdown: Matched=${matched.length}, Partial=${partial.length}, Missing=${missing.length} (Total: ${evaluations.length})`);
      console.log(`  • Math Recalculation: ${validMath ? "PASSED (Matches formula exact)" : "FAILED"}`);
      console.log(`  • Invariant Check: ${consistency.valid ? "PASSED" : "FAILED: " + JSON.stringify(consistency.issues)}`);

      for (const ev of evaluations) {
        console.log(`    - [${ev.status.toUpperCase()}] ${ev.requirement_name} (${(ev.score * 100).toFixed(0)}%) | weight=${ev.weight} | evidence=${ev.evidence.length}`);
      }

      results.push({
        id: testCase.id,
        name: testCase.name,
        domain: testCase.domain,
        targetBucket: testCase.targetFitBucket,
        actualScore: analysis.match_score,
        hardScore: analysis.hard_requirement_match_score,
        matchedCount: matched.length,
        partialCount: partial.length,
        missingCount: missing.length,
        totalEvaluated: evaluations.length,
        validMath,
        validConsistency: consistency.valid,
      });
    } catch (err: unknown) {
      console.error(`  ✕ ERROR executing test ${testCase.id}:`, err);
      results.push({
        id: testCase.id,
        name: testCase.name,
        domain: testCase.domain,
        targetBucket: testCase.targetFitBucket,
        actualScore: -1,
        hardScore: -1,
        matchedCount: 0,
        partialCount: 0,
        missingCount: 0,
        totalEvaluated: 0,
        validMath: false,
        validConsistency: false,
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 2: SCORE DISTRIBUTION ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n═══════════════════════════════════════════════════════════════════════");
  console.log("SCORE DISTRIBUTION REPORT ACROSS 20 REALISTIC CASES");
  console.log("═══════════════════════════════════════════════════════════════════════\n");

  const validScores = results.filter((r) => r.actualScore >= 0).map((r) => r.actualScore);
  validScores.sort((a, b) => a - b);

  const minScore = validScores.length > 0 ? validScores[0] : 0;
  const maxScore = validScores.length > 0 ? validScores[validScores.length - 1] : 0;
  const sumScore = validScores.reduce((acc, s) => acc + s, 0);
  const avgScore = validScores.length > 0 ? Number((sumScore / validScores.length).toFixed(1)) : 0;
  const midIdx = Math.floor(validScores.length / 2);
  const medianScore = validScores.length % 2 !== 0
    ? validScores[midIdx]
    : Number(((validScores[midIdx - 1] + validScores[midIdx]) / 2).toFixed(1));

  const count0to24 = validScores.filter((s) => s >= 0 && s <= 24).length;
  const count25to49 = validScores.filter((s) => s >= 25 && s <= 49).length;
  const count50to69 = validScores.filter((s) => s >= 50 && s <= 69).length;
  const count70to84 = validScores.filter((s) => s >= 70 && s <= 84).length;
  const count85to99 = validScores.filter((s) => s >= 85 && s <= 99).length;
  const count100 = validScores.filter((s) => s === 100).length;

  console.log(`• Total Tests Executed: ${results.length}`);
  console.log(`• Minimum Score: ${minScore}%`);
  console.log(`• Maximum Score: ${maxScore}%`);
  console.log(`• Average Score: ${avgScore}%`);
  console.log(`• Median Score: ${medianScore}%\n`);

  console.log("Score Range Breakdown:");
  console.log(`  - 0–24% (Almost no fit):     ${count0to24} tests`);
  console.log(`  - 25–49% (Low/Partial fit):   ${count25to49} tests`);
  console.log(`  - 50–69% (Moderate fit):      ${count50to69} tests`);
  console.log(`  - 70–84% (Strong fit w/ gaps):${count70to84} tests`);
  console.log(`  - 85–99% (High fit):          ${count85to99} tests`);
  console.log(`  - 100% (Perfect fit):         ${count100} tests\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 3: REPEATABILITY ON 5 MIXED-FIT CANDIDATES (5 RUNS EACH)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("═══════════════════════════════════════════════════════════════════════");
  console.log("REPEATABILITY ON 5 MIXED-FIT CANDIDATES (5 RUNS EACH)");
  console.log("═══════════════════════════════════════════════════════════════════════\n");

  const repeatCandidates = [
    STRESS_TEST_CASES[3], // TC04: 25-49%
    STRESS_TEST_CASES[7], // TC08: 50-69%
    STRESS_TEST_CASES[11], // TC12: 70-84%
    STRESS_TEST_CASES[15], // TC16: 85-99%
    STRESS_TEST_CASES[1],  // TC02: 0-24%
  ];

  let allRepeatable = true;
  for (const rc of repeatCandidates) {
    console.log(`▶ Repeating test on ${rc.id} (${rc.name})...`);
    const runScores: number[] = [];
    const runMatched: number[] = [];
    const runMissing: number[] = [];

    for (let r = 1; r <= 5; r++) {
      const res = await runEvaluationPipeline(rc.jd, rc.resume, { bypassCache: true });
      const ana = res.tailored.match_analysis!;
      runScores.push(ana.match_score);
      runMatched.push(ana.matched_requirements.length);
      runMissing.push(ana.missing_requirements.length);
      console.log(`    Run #${r}: Score = ${ana.match_score}%, Matched = ${ana.matched_requirements.length}, Missing = ${ana.missing_requirements.length}`);
    }

    const isIdentical = runScores.every((s) => s === runScores[0]) &&
                        runMatched.every((m) => m === runMatched[0]) &&
                        runMissing.every((m) => m === runMissing[0]);

    if (!isIdentical) {
      allRepeatable = false;
      console.error(`  ✕ INCONSISTENCY DETECTED on ${rc.id}: Scores = [${runScores.join(", ")}]`);
    } else {
      console.log(`  ✓ 100% Deterministic: All 5 runs produced score ${runScores[0]}% identically.\n`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 4: NUMERICAL EVIDENCE TIER VALUES
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("═══════════════════════════════════════════════════════════════════════");
  console.log("NUMERICAL EVIDENCE TIER RUNTIME CONSTANTS & FORMULA");
  console.log("═══════════════════════════════════════════════════════════════════════\n");

  console.log(`• Demonstrated Match (strong_match): raw_score = ${STATUS_SCORES.strong_match}`);
  console.log(`• Claimed Match (claimed_match):       raw_score = ${STATUS_SCORES.claimed_match}`);
  console.log(`• Partial Match (partial_match):       raw_score = ${STATUS_SCORES.partial_match}`);
  console.log(`• Missing / No Evidence (no_evidence): raw_score = ${STATUS_SCORES.no_evidence}\n`);

  console.log("═══════════════════════════════════════════════════════════════════════");
  console.log("SUMMARY STATUS");
  console.log("═══════════════════════════════════════════════════════════════════════\n");

  const totalPassed = results.filter((r) => r.actualScore >= 0 && r.validMath && r.validConsistency).length;
  console.log(`• Total Stress Tests: ${results.length}`);
  console.log(`• Total Passed: ${totalPassed}`);
  console.log(`• Total Failed: ${results.length - totalPassed}`);
  console.log(`• Repeatability: ${allRepeatable ? "100% IDENTICAL" : "FAILED"}`);

  if (totalPassed !== results.length || !allRepeatable) {
    process.exit(1);
  }
}

runComprehensiveStressTest().catch((err) => {
  console.error("Fatal Error in Stress Test:", err);
  process.exit(1);
});
