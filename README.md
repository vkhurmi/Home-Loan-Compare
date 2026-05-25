# Project Documentation: NZ Home Loan Tracker

## Project Overview

A comprehensive web application to track and visualize home loan interest rates from all major New Zealand banks, displaying historical trends and current rates through interactive charts and graphs.

## Tech Stack

### Frontend

- **Framework:** React 18.2.0
- **Visualization:** Recharts 2.10.3
- **Styling:** Tailwind CSS 3.4.19
- **Icons:** Lucide React 0.263.1
- **Deployment:** Vercel

### Backend

- **Runtime:** Node.js 18.20.8
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** pg (node-postgres)
- **CORS:** Enabled for cross-origin requests
- **Deployment:** Railway

### Web Scraping

- **Library:** Puppeteer (for automated data collection)
- **Target Banks:** ANZ, ASB, BNZ, Westpac, Kiwibank
- **Schedule:** Node-cron for automated daily scraping

## Project Structure

```
Home-Loan-Compare/
├── backend/            # API server
│   ├── server.js      # Express server with REST API
│   ├── package.json   # Backend dependencies
│   ├── railway.toml   # Railway deployment config
│   ├── Procfile       # Process file for Railway
│   └── .env.example   # Environment variables template
├── scraper/           # Data collection service
│   ├── scraper.js     # Puppeteer web scraping scripts
│   ├── package.json   # Scraper dependencies
│   └── .env.example   # Scraper environment variables
├── frontend/          # React application
│   ├── src/
│   │   ├── App.js     # Main React component
│   │   ├── index.js   # React entry point
│   │   └── index.css  # Tailwind CSS imports
│   ├── public/        # Static assets
│   ├── package.json   # Frontend dependencies
│   ├── tailwind.config.js
│   └── postcss.config.js
└── README.md
```

## Database Schema

### Banks Table

```sql
CREATE TABLE banks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  website VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Rates Table

```sql
CREATE TABLE rates (
  id SERIAL PRIMARY KEY,
  bank_id INTEGER REFERENCES banks(id),
  rate_date DATE NOT NULL,
  term_1year DECIMAL(5,3),
  term_2year DECIMAL(5,3),
  term_3year DECIMAL(5,3),
  term_5year DECIMAL(5,3),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(bank_id, rate_date)
);
```

## API Endpoints

### Health Check

**GET** `/health`

Returns server and database status

### Banks

**GET** `/api/banks`

Returns list of all banks

### Rates

**GET** `/api/rates`

Returns all historical rate data with bank names

**POST** `/api/rates`

Add a single rate entry

**POST** `/api/rates/bulk`

Add multiple rate entries at once

## Features

- **Interactive Charts:** Line charts showing rate trends over time with toggle between 1, 2, 3, and 5-year fixed terms
- **Multi-Bank Comparison:** Compare rates across multiple banks simultaneously using checkboxes
- **Current Best Rates:** Display of lowest current rates for each term across all banks
- **Historical Data:** Visualization of rate changes from July 2025 to present
- **Data Export:** CSV export functionality for historical rates
- **Automated Scraping:** Daily automated collection of current rates from bank websites
- **Responsive Design:** Mobile-friendly interface with Tailwind CSS

## Deployment

### Backend (Railway)

**Production URL:** https://home-loan-compare-production.up.railway.app

**Database:** PostgreSQL (Railway managed)

**Environment Variables:**

- `DATABASE_URL` - Auto-set by Railway PostgreSQL
- `NODE_ENV=production`
- `PORT` - Auto-set by Railway

### Frontend (Vercel)

**Production URL:** https://home-loan-compare.vercel.app

**Build Settings:**

- Framework: Create React App
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `build`

**Environment Variables:**

- `REACT_APP_API_URL=https://home-loan-compare-production.up.railway.app`

## Running Locally

### Backend

```bash
cd backend
npm install
# Create .env with DATABASE_URL
npm run dev
# Server runs on http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
npm start
# App runs on http://localhost:3000
```

### Scraper

```bash
cd scraper
npm install
# Create .env with API_URL
npm run scrape        # Run once
npm run scrape:schedule # Run on schedule
```

## Data Seeding

To populate the database with historical data:

```bash
cd backend
node seed-historical-data.js  # For local development
node seed-production.js       # For production database
```

## Banks Tracked

1. ANZ - https://www.anz.co.nz
2. ASB - https://www.asb.co.nz
3. BNZ - https://www.bnz.co.nz
4. Westpac - https://www.westpac.co.nz
5. Kiwibank - https://www.kiwibank.co.nz
6. TSB - https://www.tsbbank.co.nz
7. SBS - https://www.sbsbank.co.nz
8. Cooperative Bank - https://www.co-operativebank.co.nz
9. HSBC - https://www.hsbc.co.nz
10. China Construction Bank - https://www.nz.ccb.com

## Troubleshooting

### Frontend Not Loading Data

- Verify `REACT_APP_API_URL` environment variable is set in Vercel
- Check browser console (F12) for API errors
- Test backend directly: `curl https://backend-url/api/banks`
- Verify CORS settings in backend allow Vercel domain

### Backend Connection Issues

- Check Railway logs for startup errors
- Verify `DATABASE_URL` is set in Railway variables
- Test health endpoint: `curl https://backend-url/health`
- Ensure Root Directory is set to `backend` in Railway settings

### Scraper Failures

- Bank websites may have changed structure - update CSS selectors
- Run debug scripts to inspect page structure
- Verify Puppeteer dependencies are installed
- Check if bank websites are blocking automated access

## Future Enhancements

- Email alerts when rates drop below threshold
- Mortgage calculator integration
- User accounts to save preferences
- Rate predictions using historical data
- Mobile application
- Public API for third-party integrations
- Additional banks (regional and international)
- Rate change notifications via webhook

## Cost Analysis

**Railway (Backend + Database):**

- Free $5 credit per month
- Covers ~500MB PostgreSQL + backend hosting
- ~10,000 requests per month within free tier

**Vercel (Frontend):**

- 100% free for hobby projects
- Unlimited bandwidth
- Automatic SSL certificates

**Total Monthly Cost:** $0 (within free tiers)

## Key Learnings & Solutions

### Tailwind CSS Setup

Required proper configuration of `tailwind.config.js`, `postcss.config.js`, and importing directives in `index.css`

### React Scripts Installation

Fixed by ensuring `react-scripts@5.0.1` in package.json (not `^0.0.0`)

### Railway Deployment

Required splitting Puppeteer dependencies into separate scraper service to avoid Chromium build issues on Railway

### Environment Variables

Frontend requires `REACT_APP_` prefix for Create React App to recognize environment variables

### Web Scraping

Each bank website requires custom CSS selectors and data extraction logic due to different page structures

## Project Status

✅ **Completed:**

- Frontend React application with interactive charts
- Backend REST API with PostgreSQL database
- Web scraping for 5 major NZ banks
- Deployment to Railway (backend) and Vercel (frontend)
- Historical data seeding
- Responsive design with Tailwind CSS

🚀 **Live Application:** https://home-loan-compare.vercel.app

## Contact & Repository

**GitHub Repository:** Home-Loan-Compare

**Project Owner:** khurmi

**Last Updated:** February 10, 2026

[Adv Features](https://www.notion.so/Adv-Features-30fcad7c79b88053bbb9ce59da768cbb?pvs=21)
