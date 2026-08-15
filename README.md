# JD → Resume Intelligence & Tailoring Engine

A production-grade, fact-checked AI resume tailoring and semantic matching pipeline built with Next.js 16, TypeScript, React 19, and Google Gemini API.

The engine diffs arbitrary candidate resumes against job descriptions, extracts atomic capability requirements, resolves evidence against immutable source units, calculates deterministic match scores, and generates ATS-compliant vector PDF documents without fabricating claims or metrics.

---

## 🌟 Key Features

* **4-Tier Deterministic Evidence Classification**:
  * **Demonstrated ($1.0$)**: Explicit project or work experience bullet evidence.
  * **Claimed ($0.8$)**: Valid claim in Skills or Professional Summary section.
  * **Partial ($0.6$)**: Closely related technology or foundational knowledge (or $0.5$ for 1 of 2 in an AND constraint).
  * **Missing ($0.0$)**: No supporting resume evidence found.
* **Deterministic Experience Engine**:
  * Dynamic `Present` / `Current` date resolution against runtime `new Date()`.
  * Mathematical interval union algorithm to merge overlapping concurrent roles without double-counting.
  * Strict classification between full-time professional employment and internships/freelance.
  * Inclusive calendar-month tenure convention: $\text{Elapsed Months} = (\text{endYear} - \text{startYear}) \times 12 + (\text{endMonth} - \text{startMonth}) + 1$.
* **Zero-Hallucination Anti-Fabrication Guard**:
  * Immutable candidate evidence units (`CandidateEvidenceUnit[]`) with strict provenance IDs.
  * Validates that rewritten bullets retain original facts, numbers, tools, and company timelines.
* **Pure Mathematical Scoring Model**:
  $$\text{Match Score} = \text{round}\left(\frac{\sum (W_i \times S_i)}{\sum W_i} \times 100\right)$$
  Where $W_i = \text{Base Importance Weight} \times \text{Criticality Multiplier}$.
* **ATS Vector PDF Generator**:
  * 6 professional, ATS-optimized layout templates built with `@react-pdf/renderer`.
  * Support for multi-page rendering, unicode symbols, dynamic contact links, and custom layout styling.

---

## 🛠️ Technology Stack

* **Framework**: Next.js 16.3 (App Router with Turbopack)
* **Frontend**: React 19, Tailwind CSS v4, Motion (Framer Motion)
* **Language**: TypeScript 5
* **AI & LLM**: Google Gemini API (`gemini-3.1-flash-lite`, `@google/generative-ai`)
* **PDF Rendering**: `@react-pdf/renderer` & `pdf-parse`
* **Authentication**: Clerk (`@clerk/nextjs`)
* **Document Extraction**: `mammoth` (DOCX) & `pdf-parse` (PDF)
* **Database (Optional)**: MongoDB via Mongoose

---

## 🚀 Getting Started

### 1. Prerequisites
* Node.js 18.18+ or Node.js 20+
* Google Gemini API Key ([Google AI Studio](https://aistudio.google.com/))
* Clerk Account (for authentication)

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Divyansh7117/JD_Resume_Builder.git
cd jd-resume-customiser
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory (refer to `.env.example`):

```env
# Gemini API Key (Required)
GEMINI_API_KEY=your_gemini_api_key_here

# Clerk Authentication (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/app

# Optional Webhook & Database
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here
MONGODB_URI=mongodb+srv://...
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Validation Suites

The engine includes rigorous regression, blackbox, and mathematical validation test suites:

```bash
# Run comprehensive engine tests (experience math, 4-tier model, invariant checks)
npm run test:engine

# Run 10-domain blackbox generalization test suite (78 tests)
npm run test:blackbox

# Run 20-pair imperfect match stress test (score distribution verification)
npm run test:stress

# Run education & degree evidence policy test
npm run test:education

# Run all core regression test suites
npm run test:all
```

---

## 🏗️ Production Build

To build and validate the application for production:

```bash
npm run build
npm run start
```

---

## 📐 Mathematical Invariants

The evaluation pipeline enforces strict structural invariants:
1. **Partition Invariant**:
   $$\text{Matched Requirements} + \text{Partial Requirements} + \text{Missing Requirements} \equiv \text{Total Evaluated Requirements}$$
2. **Evidence-Score Consistency**:
   * Any requirement with verified evidence must have a score $> 0.0$ and non-missing status.
   * Any requirement with $0.0$ score must have zero verified evidence units.
3. **Education Constraint Isolation**:
   * Degree titles (e.g., MBA, B.S. Computer Science) validate education eligibility but do **not** automatically prove technical capabilities unless accompanied by explicit coursework or demonstrated project experience.

---

## 📄 License

This project is licensed under the MIT License.
