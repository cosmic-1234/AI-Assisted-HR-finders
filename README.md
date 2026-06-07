# 🚀 Apex CareerConnect: AI HR Outreach Portal

Apex CareerConnect is a local, AI-driven workflow that helps job applicants find target domain-specific HR contacts in India, personalize cold emails using OpenRouter AI based on their PDF resume, and send them in bulk using SMTP—completely for free.

![Visual Style](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80)

---

## ✨ Key Features

1. **Targeted HR Contact Finder**: Intelligently scrapes search engines for HR professionals at your target companies who align with your role (e.g., searching specifically for "Marketing HR" when applying for a "Marketing Intern" role).
2. **AI Contact Extraction**: Uses OpenRouter models (like `google/gemini-2.5-flash` or `meta-llama/llama-3-8b-instruct:free` for free-tier usage) to parse search snippets into clean JSON profiles (Name, Title, Company, LinkedIn, and Email).
3. **Smart Email Guesser**: When contact email addresses aren't directly available, the AI predicts the most likely corporate email layout based on standard corporate domains (e.g. `first.last@company.com`).
4. **Inline-Editable Review Grid**: View results in a table, click any cell to manually edit details, delete rows, add custom rows, and select specific recruiters.
5. **AI Cold Email Composer**: Generates personalized emails by matching your uploaded PDF resume achievements to the recruiter's company and the target job description. Includes a side-by-side preview panel to customize emails before sending.
6. **Automated Bulk Sender**: Sends cold emails in bulk via SMTP (such as a Gmail App Password) with your PDF resume attached.
7. **Interactive Campaign Progress Bar**: Monitor emails in real-time through a simulated terminal-like logs console.

---

## 🛠️ Tech Stack

*   **Frontend**: React, Vite, Lucide Icons, Vanilla CSS (styled with a custom Midnight Glassmorphic theme).
*   **Backend**: Node.js, Express, Axios & Cheerio (for no-API-key search scraping), Multer & PDF-Parse (for reading PDF resume files), Nodemailer (for SMTP transmissions).

---

## ⚙️ Quick Installation

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed.

### 1. Clone & Navigate
```bash
git clone git@github.com:cosmic-1234/AI-Assisted-HR-finders.git
cd AI-Assisted-HR-finders
```

### 2. Install Dependencies
Run the install command in the root directory to automatically install packages for the root, frontend, and backend components:
```bash
npm run install-all
```

### 3. Run the Development Server
Launch both the backend API server (port 5000) and the Vite client (defaulting to port 5173/5175) concurrently:
```bash
npm run dev
```
Open your browser and navigate to **[http://localhost:5175/](http://localhost:5175/)** (or the port outputted in your console).

---

## 📖 Step-by-Step Guide

### Step 1: Configuration
*   Provide your **OpenRouter API Key** (you can get a free key in 1 minute on OpenRouter).
*   Select your preferred **AI Model** (defaults to the free `google/gemini-2.5-flash` model).
*   Input your **Sender Name** and **Gmail SMTP settings** (requires generating a 16-character **App Password** in your Google Account security settings).
*   Upload your **Resume (PDF)**.
*   Once configured, the status indicator in the top navbar will turn green.

### Step 2: Create a Campaign
*   Enter target companies as a comma-separated list (e.g. `TCS, Infosys, Google, Wipro`).
*   Enter your target role (e.g. `Marketing Intern` or `Software Engineer`).
*   Set country (defaults to `India`).
*   Click **Search HR Contacts**.

### Step 3: Review & Edit Contacts
*   Double-click any cell in the table to edit names, job titles, or emails.
*   Check or uncheck select boxes to choose which recruiters receive emails.
*   Optionally add custom rows or delete undesired contacts.
*   Click **Personalize & Preview Emails**.

### Step 4: Preview and Personalize Drafts
*   Click a recruiter on the left sidebar to preview the customized email draft written by the AI.
*   Edit the subject line or email body to add your personal touch.
*   Click **Save Draft Changes**.

### Step 5: Send Campaign
*   Click **Send Bulk Emails**.
*   Watch live success/failure updates in the campaign log console.
