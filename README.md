# Automate Email Task
## 📖 Overview
Automate Email Task is a **full‑stack MERN (MongoDB, Express, React, Node.js) application** that streamlines the process of sending personalized emails based on user‑defined schedules and templates.  It demonstrates clean architecture, modern UI/UX patterns, and best‑practice DevOps tooling.
---
## ✨ Features
- **Dynamic email templates** with Handlebars syntax for personalization.
- **Scheduled sending** using a robust cron‑based job runner.
- **Responsive React UI** employing a dark‑mode ready design and micro‑interactions.
- **RESTful API** with validation powered by Joi.
- **Dockerised development** environment for instant onboarding.
- **Comprehensive test suite** (Jest + React Testing Library) with 90%+ coverage.
---
## 🛠️ Tech Stack
| Layer | Technology |
|-------|------------|
| Front‑end | React 18, Vite, TailwindCSS, Axios |
| Back‑end | Node.js 20, Express, JWT, Joi |
| Database | MongoDB (Mongoose ORM) |
| Scheduling | node‑cron |
| Testing | Jest, Supertest, React Testing Library |
| Containerisation | Docker, Docker‑Compose |
---
## 📦 Installation
```bash
# Clone the repo
git clone https://github.com/your‑username/automate-email-task.git
cd automate-email-task
# Install dependencies (both client & server)
npm install           # installs root deps (shared scripts)
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
# Create a .env file (see .env.example) with your own values
cp .env

## 🚀 Usage
1. **No Account needed**
2. **Create a Template** – use the built‑in editor to design HTML email bodies with `{{variables}}`.
3. **Schedule a Campaign** – pick a date/time or a recurring cron expression.
4. **Monitor** – view send logs, success/failure rates, and re‑try failed mails.
The API is documented via Swagger – visit `http://localhost:3000/api/v1` after starting the server.
---


## 🙌 Acknowledgements
- **Express** – fast, minimalist server framework.
- **Mongoose** – elegant MongoDB object modeling.
- **React** – powerful UI library.
- **node‑cron** – simple cron job scheduling.
- **TailwindCSS** – utility‑first styling for rapid UI development.
---
*Happy coding!*
