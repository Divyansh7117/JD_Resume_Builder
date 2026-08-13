const API_URL = "http://localhost:3000/api/tailor";

const jdText = `
We are looking for a Full-Stack Engineer to join our dynamic web development team.
The ideal candidate should have strong proficiency in TypeScript, React, Next.js, and Node.js with hands-on experience building REST APIs and GraphQL services.
Experience with Tailwind CSS, React Native, and Docker / PostgreSQL is highly desirable.
You will collaborate closely with cross-functional teams to design, develop, and maintain web applications.
Candidates should possess strong problem-solving skills and 2+ years of relevant engineering experience.
`;

const resumeText = `
ALEX RIVERA
Full-Stack Developer | MERN Stack | Next.js | TypeScript | React Native
Email: alex.rivera@example.com | GitHub: github.com/alexrivera | Location: San Francisco, CA

PROFESSIONAL EXPERIENCE
Senior Full-Stack Engineer | TechCorp Inc. | Jan 2022 - Present
• Architected and launched a real-time web platform using Next.js, React, and TypeScript, reducing page load times by 40%.
• Built high-throughput RESTful APIs and MongoDB data pipelines using Node.js and Express (MERN stack) to serve over 100k daily active users.
• Developed cross-platform mobile application modules using React Native and Redux Toolkit for seamless sync across iOS and Android.

PROJECTS
TaskCraft - Mobile & Web Task Manager
• Implemented end-to-end task synchronization using React Native for mobile, Next.js for web dashboard, and WebSocket connections via Node.js backend.
• Integrated TypeScript strict mode across shared frontend-backend packages to ensure type safety and prevent runtime errors.

SKILLS
TypeScript, JavaScript, React.js, Next.js, Node.js, Express.js, MongoDB, React Native, Redux, HTML5, CSS3, Tailwind CSS, REST APIs, GraphQL, Git
`;

async function main() {
  try {
    console.log("Sending POST to /api/tailor...");
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jdText, resumeText }),
    });

    console.log("Response status:", response.status);
    const data = await response.json();
    console.log("Response body:");
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Request failed:", err);
  }
}

main();
