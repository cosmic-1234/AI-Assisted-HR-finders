import express from 'express';
import cors from 'cors';
import multer from 'multer';
import pdf from 'pdf-parse';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Role keywords extractor to target domain-specific HR
function getRoleKeywords(role) {
  if (!role) return '';
  const lowercaseRole = role.toLowerCase();
  
  if (lowercaseRole.includes('marketing')) return 'Marketing';
  if (lowercaseRole.includes('sales') || lowercaseRole.includes('business development') || lowercaseRole.includes('bd')) return 'Sales';
  if (lowercaseRole.includes('finance') || lowercaseRole.includes('accountant') || lowercaseRole.includes('accounting')) return 'Finance';
  if (lowercaseRole.includes('hr') || lowercaseRole.includes('human resources') || lowercaseRole.includes('recruiting') || lowercaseRole.includes('talent')) return 'HR';
  if (lowercaseRole.includes('software') || lowercaseRole.includes('engineer') || lowercaseRole.includes('developer') || lowercaseRole.includes('tech') || lowercaseRole.includes('code') || lowercaseRole.includes('programmer') || lowercaseRole.includes('frontend') || lowercaseRole.includes('backend') || lowercaseRole.includes('fullstack')) return 'Tech';
  if (lowercaseRole.includes('design') || lowercaseRole.includes('ui') || lowercaseRole.includes('ux') || lowercaseRole.includes('graphic')) return 'Design';
  if (lowercaseRole.includes('product') || lowercaseRole.includes('pm')) return 'Product';
  if (lowercaseRole.includes('operation') || lowercaseRole.includes('ops')) return 'Operations';
  
  // Default fallback: extract longest words
  const words = role.split(' ').filter(w => w.length > 3 && !['intern', 'junior', 'senior', 'lead', 'manager', 'associate'].includes(w.toLowerCase()));
  return words.length > 0 ? words[0] : '';
}

// Helper: Scrape DuckDuckGo Search Results
async function scrapeDuckDuckGo(query) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(data);
    const results = [];
    
    $('.result').each((i, el) => {
      const title = $(el).find('.result__title').text().trim();
      const link = $(el).find('.result__url').text().trim();
      const snippet = $(el).find('.result__snippet').text().trim();
      if (title || snippet) {
        results.push({ title, link, snippet });
      }
    });
    
    return results;
  } catch (error) {
    console.error(`DuckDuckGo Scrape error for query "${query}":`, error.message);
    return [];
  }
}

// Endpoint: Resume Upload and Text Extraction
app.post('/api/upload-resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const filePath = req.file.path;
    const fileBuffer = fs.readFileSync(filePath);
    
    const parsedPdf = await pdf(fileBuffer);
    
    res.json({
      message: 'Resume parsed successfully',
      filename: req.file.filename,
      originalName: req.file.originalname,
      text: parsedPdf.text
    });
  } catch (error) {
    console.error('Error parsing resume PDF:', error);
    res.status(500).json({ error: 'Failed to parse resume PDF' });
  }
});

// Endpoint: Search HR Emails
app.post('/api/search', async (req, res) => {
  const { companies, role, country = 'India', openRouterKey, model = 'google/gemini-2.5-flash' } = req.body;
  
  if (!companies || !Array.isArray(companies) || companies.length === 0) {
    return res.status(400).json({ error: 'Companies list is required' });
  }
  if (!role) {
    return res.status(400).json({ error: 'Role is required' });
  }
  if (!openRouterKey) {
    return res.status(400).json({ error: 'OpenRouter API Key is required' });
  }

  const roleKeyword = getRoleKeywords(role);
  const resultsByCompany = {};

  try {
    for (const company of companies) {
      console.log(`Processing company: ${company}`);
      
      // Build search queries
      const query1 = `site:in.linkedin.com/in/ "${company}" ("${roleKeyword} HR" OR "${roleKeyword} Recruiter" OR "HR" OR "recruiter" OR "talent acquisition" OR "human resources")`;
      const query2 = `"${company}" "${roleKeyword} HR" OR "recruiter" email ${country}`;
      
      const [results1, results2] = await Promise.all([
        scrapeDuckDuckGo(query1),
        scrapeDuckDuckGo(query2)
      ]);
      
      const combinedResults = [...results1, ...results2];
      
      if (combinedResults.length === 0) {
        resultsByCompany[company] = [];
        continue;
      }
      
      // Format snippets for LLM
      const snippetsText = combinedResults
        .slice(0, 12)
        .map((r, index) => `${index + 1}. Title: ${r.title}\nLink: ${r.link}\nSnippet: ${r.snippet}\n`)
        .join('\n');
        
      // Prompt OpenRouter to extract contact structures
      const prompt = `
You are an expert AI recruiter assistant. We have searched the web for HR/recruiter contacts at the company "${company}" in ${country} related to the role "${role}".
Here is a list of web search result snippets:
---
${snippetsText}
---

Your job is to analyze these snippets and extract a JSON list of HR professionals, recruiters, talent acquisition managers, or human resources leads at "${company}".
We are particularly looking for contacts that align with the "${roleKeyword}" department if possible, but general HR contacts are also highly valued.

For each contact you identify, extract:
1. "name": The full name of the person. If not available, do not include.
2. "title": Job title (e.g. HR Manager, Recruiter, Talent Acquisition Lead, Marketing Recruiter).
3. "company": Should be "${company}".
4. "linkedin": The LinkedIn profile URL if found in the search snippet.
5. "email": The email address of the person.
   - If a valid email is explicitly found in the snippets, extract it.
   - If NO email is found in the snippets, predict/guess their corporate email address based on their name and the company's domain.
     - Company: "${company}"
     - Assume standard professional corporate email patterns. (e.g., first.last@company.com, firstlast@company.com, first@company.com). Use the company's actual domain name if known (e.g., google.com for Google, wipro.com for Wipro, tcs.com for TCS).
     - Set the boolean flag "isPredicted" to true if the email is guessed/predicted, or false if it was found directly.

Respond with a JSON object in the following format. Ensure the output is valid JSON and contains NO extra markdown text outside of the JSON block:
{
  "contacts": [
    {
      "name": "...",
      "title": "...",
      "company": "...",
      "linkedin": "...",
      "email": "...",
      "isPredicted": true/false
    }
  ]
}
`;

      try {
        const response = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: model,
            messages: [
              { role: 'system', content: 'You are a precise JSON extractor.' },
              { role: 'user', content: prompt }
            ],
            response_format: { type: "json_object" }
          },
          {
            headers: {
              'Authorization': `Bearer ${openRouterKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'http://localhost:5173',
              'X-Title': 'Job Finder Workflow'
            },
            timeout: 25000
          }
        );
        
        let contentText = response.data.choices[0].message.content;
        
        // Strip markdown blocks if the LLM returned it despite instructions
        if (contentText.includes('```json')) {
          contentText = contentText.split('```json')[1].split('```')[0].trim();
        } else if (contentText.includes('```')) {
          contentText = contentText.split('```')[1].split('```')[0].trim();
        }
        
        const parsed = JSON.parse(contentText);
        resultsByCompany[company] = parsed.contacts || [];
      } catch (err) {
        console.error(`AI Extraction failed for ${company}:`, err.message);
        resultsByCompany[company] = [];
      }
    }
    
    res.json({ success: true, results: resultsByCompany });
  } catch (error) {
    console.error('Search API error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// Endpoint: Personalize Email Draft
app.post('/api/personalize', async (req, res) => {
  const { contact, role, resumeText, openRouterKey, model = 'google/gemini-2.5-flash' } = req.body;
  
  if (!contact || !role || !openRouterKey) {
    return res.status(400).json({ error: 'Missing contact, role, or openRouterKey' });
  }
  
  const resumeContext = resumeText ? `Candidate Resume Text:\n${resumeText}` : 'No resume uploaded.';
  
  const prompt = `
You are a highly qualified candidate applying for the "${role}" position.
Write a personalized, short, and compelling cold email to the following HR contact:

HR Contact Details:
- Name: ${contact.name || 'HR Team'}
- Title: ${contact.title || 'HR Manager'}
- Company: ${contact.company}

Context:
${resumeContext}

Writing Guidelines:
1. Subject Line: Create an eye-catching, professional subject line (e.g., "Application for ${role} - [Your Name]" or something tailored to ${contact.company}).
2. Tone: Polite, eager, and highly professional.
3. Content: State the role you're applying for, and reference 1 or 2 matching highlights (skills, experience, or projects) from the resume text that align with this role or company. Keep it short (100-150 words).
4. No Placeholders: Do not leave any bracketed placeholders like [Your Name] or [Date]. Make a professional guess or leave them out. Use "Regards, Candidate" if you don't know the candidate's name, or infer it from the resume if present.
5. Format: Return ONLY a JSON object with the fields "subject" and "body". Do not add any markdown wrapper.

{
  "subject": "...",
  "body": "..."
}
`;

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: model,
        messages: [
          { role: 'system', content: 'You are a professional cold email writer.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" }
      },
      {
        headers: {
          'Authorization': `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'Job Finder Workflow'
        },
        timeout: 20000
      }
    );
    
    let contentText = response.data.choices[0].message.content;
    
    if (contentText.includes('```json')) {
      contentText = contentText.split('```json')[1].split('```')[0].trim();
    } else if (contentText.includes('```')) {
      contentText = contentText.split('```')[1].split('```')[0].trim();
    }
    
    const parsed = JSON.parse(contentText);
    res.json({ success: true, subject: parsed.subject, body: parsed.body });
  } catch (error) {
    console.error('Email personalization failed:', error.message);
    res.status(500).json({ error: 'Failed to generate personalized email draft' });
  }
});

// Endpoint: Send Email via Nodemailer
app.post('/api/send', async (req, res) => {
  const { smtpConfig, to, subject, body, resumeFilename } = req.body;
  
  if (!smtpConfig || !to || !subject || !body) {
    return res.status(400).json({ error: 'Missing required email fields or smtpConfig' });
  }
  
  try {
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: parseInt(smtpConfig.port),
      secure: smtpConfig.secure, // true for 465, false for other ports
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass
      }
    });
    
    const mailOptions = {
      from: `"${smtpConfig.senderName || 'Job Candidate'}" <${smtpConfig.user}>`,
      to: to,
      subject: subject,
      text: body
    };
    
    // Attach resume if specified and exists
    if (resumeFilename) {
      const filePath = path.join(uploadDir, resumeFilename);
      if (fs.existsSync(filePath)) {
        mailOptions.attachments = [
          {
            filename: resumeFilename.split('-').slice(2).join('-') || 'Resume.pdf', // Remove unique suffix from filename
            path: filePath
          }
        ];
      }
    }
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Nodemailer error:', error);
    res.status(500).json({ error: error.message || 'Failed to send email' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
