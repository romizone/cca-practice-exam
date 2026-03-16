<p align="center">
  <img src="https://img.shields.io/badge/Claude-Certified%20Architect-6C47FF?style=for-the-badge&logo=anthropic&logoColor=white" alt="CCA Badge"/>
</p>

<h1 align="center">CCA Practice Exam</h1>

<p align="center">
  <strong>Claude Certified Architect &mdash; Foundations Practice Exam Platform</strong>
</p>

<p align="center">
  <a href="https://ccaexam.vercel.app">
    <img src="https://img.shields.io/badge/Live%20Demo-ccaexam.vercel.app-00C853?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo"/>
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js"/>
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS"/>
  <img src="https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel"/>
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="License"/>
</p>

---

## About

The **Claude Certified Architect (CCA) &mdash; Foundations** certification, developed by [Anthropic](https://www.anthropic.com/), validates that practitioners can make informed decisions about tradeoffs when implementing real-world solutions with Claude. It is the industry's first professional certification for building production-grade applications with large language models.

This practice exam platform is purpose-built to help candidates **prepare effectively** for the CCA Foundations exam. It faithfully replicates the real exam experience &mdash; from the scenario-based question format and 90-minute time constraint to the scaled scoring system (100&ndash;1,000) with a 720 passing threshold.

### Why This Platform?

- **Realistic Exam Simulation** &mdash; Questions are grounded in realistic scenarios drawn from actual production use cases, including building agentic systems for customer support, designing multi-agent research pipelines, integrating Claude Code into CI/CD workflows, and extracting structured data from unstructured documents.

- **Comprehensive Coverage** &mdash; All 5 exam domains are covered with proper weighting: Agentic Architecture & Orchestration (27%), Tool Design & MCP Integration (18%), Claude Code Configuration & Workflows (20%), Prompt Engineering & Structured Output (20%), and Context Management & Reliability (15%).

- **Learn As You Go** &mdash; Every question comes with a detailed explanation that teaches the underlying concept, explains why the correct answer is right, and clarifies why each distractor is wrong. This transforms each practice attempt into an active learning session.

- **Multiple Question Banks** &mdash; With 6 distinct exam sets (360 total questions), candidates can take multiple practice exams without repeating the same questions, ensuring thorough preparation across all topics.

### Who Is This For?

The ideal candidate for the CCA Foundations certification is a **solution architect** who designs and implements production applications with Claude. This platform is designed for professionals with hands-on experience in:

- Building agentic applications using the **Claude Agent SDK**, including multi-agent orchestration, subagent delegation, tool integration, and lifecycle hooks
- Configuring and customizing **Claude Code** for team workflows using CLAUDE.md files, Agent Skills, MCP server integrations, and plan mode
- Designing **Model Context Protocol (MCP)** tool and resource interfaces for backend system integration
- Engineering prompts that produce reliable **structured output**, leveraging JSON schemas, few-shot examples, and extraction patterns
- Managing **context windows** effectively across long documents, multi-turn conversations, and multi-agent handoffs
- Integrating Claude into **CI/CD pipelines** for automated code review, test generation, and pull request feedback
- Making sound **escalation and reliability decisions**, including error handling, human-in-the-loop workflows, and self-evaluation patterns

### Core Technologies Tested

<table>
<tr>
<td align="center" width="25%"><strong>Claude Agent SDK</strong><br/><sub>Agent definitions, agentic loops, stop_reason handling, hooks, subagent spawning via Task tool</sub></td>
<td align="center" width="25%"><strong>Model Context Protocol</strong><br/><sub>MCP servers, tools, resources, isError flag, .mcp.json configuration, environment variables</sub></td>
<td align="center" width="25%"><strong>Claude Code</strong><br/><sub>CLAUDE.md hierarchy, .claude/rules/, slash commands, skills, plan mode, --resume, /compact</sub></td>
<td align="center" width="25%"><strong>Claude API</strong><br/><sub>tool_use with JSON schemas, tool_choice options, stop_reason values, Message Batches API</sub></td>
</tr>
</table>

---

## Features

| Feature | Description |
|---------|-------------|
| **360 Questions** | 6 unique exam sets with 60 questions each |
| **90-Minute Timer** | Countdown timer with auto-submit when time expires |
| **Random Selection** | Randomly selects an exam set for each attempt |
| **Shuffle Mode** | Optional question order randomization |
| **Instant Feedback** | Detailed explanations after each answer |
| **Score Analytics** | Per-scenario breakdown with pass/fail indicator |
| **Exam Guide** | Downloadable official CCA Exam Guide (PDF) |
| **Architect's Playbook** | Downloadable study reference material (PDF) |
| **Candidate Tracking** | Name & email capture with results display |
| **Responsive Design** | Works seamlessly on desktop, tablet, and mobile |

---

## Exam Domains

The practice exam covers all **5 domains** tested in the CCA Foundations certification:

| Domain | Weight | Topics |
|--------|--------|--------|
| **Agentic Architecture & Orchestration** | 27% | Agentic loops, multi-agent systems, hooks, session management |
| **Tool Design & MCP Integration** | 18% | Tool interfaces, MCP servers, error handling, built-in tools |
| **Claude Code Configuration & Workflows** | 20% | CLAUDE.md, slash commands, skills, plan mode, CI/CD |
| **Prompt Engineering & Structured Output** | 20% | Few-shot prompting, JSON schemas, tool_use, batch processing |
| **Context Management & Reliability** | 15% | Context windows, escalation, error propagation, provenance |

---

## Exam Scenarios

Questions are organized around **6 realistic production scenarios**:

1. **Customer Support Resolution Agent** &mdash; Building support agents with escalation logic
2. **Code Generation with Claude Code** &mdash; Team workflow configuration and plan mode
3. **Multi-Agent Research System** &mdash; Coordinator-subagent orchestration patterns
4. **Developer Productivity with Claude** &mdash; Codebase exploration and tool integration
5. **Claude Code for Continuous Integration** &mdash; CI/CD pipeline integration and review
6. **Structured Data Extraction** &mdash; JSON schemas, validation, and batch processing

---

## Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **npm** or **yarn**

### Installation

```bash
# Clone the repository
git clone https://github.com/romizone/cca-practice-exam.git

# Navigate to project directory
cd cca-practice-exam

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## Deployment

This project is deployed on **Vercel** with automatic deployments on every push to `main`.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/romizone/cca-practice-exam)

---

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| [Next.js 16](https://nextjs.org/) | React framework with App Router |
| [TypeScript](https://www.typescriptlang.org/) | Type-safe development |
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first styling |
| [Vercel](https://vercel.com/) | Hosting & CI/CD |

---

## Project Structure

```
cca-practice-exam/
├── public/
│   ├── CCA-Exam-Guide.pdf          # Downloadable exam guide
│   └── Architects-Playbook.pdf     # Downloadable study material
├── src/
│   ├── app/
│   │   ├── globals.css             # Global styles (light theme)
│   │   ├── layout.tsx              # Root layout
│   │   └── page.tsx                # Main exam application
│   └── data/
│       └── exam.ts                 # 360 questions across 6 exam sets
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## Scoring

| Metric | Value |
|--------|-------|
| Total Questions | 60 per exam |
| Score Range | 100 &ndash; 1,000 |
| Passing Score | **720** |
| Time Limit | 90 minutes |
| Question Format | Multiple choice (A&ndash;D) |

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Author

**Romi Nur Ismanto**

---

<p align="center">
  Built with Anthropic Claude &bull; Deployed on Vercel
</p>
