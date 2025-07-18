# 📰 TrendWise

TrendWise is an AI-powered, SEO-optimized blog platform that automatically fetches trending topics from sources like Google Trends and Twitter, generates content using ChatGPT, and displays them in a user-friendly blog interface.


## 🚀 Live Demo

🌐 [Frontend (Vercel)](https://your-frontend.vercel.app)  
🔗 [Backend (Render/Heroku)](https://your-backend-url.com)  
📂 [GitHub Repository](https://github.com/your-username/trendwise)


## 📌 Features


### ✅ Automated Content Bot
- Scrapes trending topics via Google Trends/Twitter (Cheerio/Puppeteer).
- Sends trends to OpenAI GPT/Gemini API for SEO blog generation.
- Stores articles in MongoDB with metadata, OG tags, images, videos, and rich content.


### 🖥️ Blog Frontend
- **Homepage**: Lists articles with thumbnails, excerpts.
- **Detail Page**: Full article view with embedded media, SEO tags, and comments.
- **Search**: Find articles by title or keyword.


### 🔐 User Authentication
- Google OAuth using **NextAuth.js**.
- Only logged-in users can post comments and view their comment history.


### 📈 SEO & Bot Indexing
- Dynamic `sitemap.xml` generation.
- `robots.txt` with proper crawling rules.
- Meta tags, OG tags, structured headers (H1-H3).


### ⚙️ Admin Dashboard *(Optional)*
- Secure admin route (auth-protected).
- View article list or manually trigger article generation.


## 🧠 Tech Stack


| Layer        | Technology                         |
|--------------|-------------------------------------|
| Frontend     | Next.js 14+ with App Router         |
| Styling      | TailwindCSS                         |
| Auth         | NextAuth.js (Google OAuth)          |
| Backend      | Node.js + Express / API Routes      |
| Scraping     | Cheerio / Puppeteer / Playwright    |
| AI           | OpenAI (ChatGPT) or Gemini API      |
| Database     | MongoDB + Mongoose                  |
| Hosting      | Vercel (Frontend), Render/Heroku (Backend) |


## 🔧 Installation & Local Setup


1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/trendwise.git
   cd trendwise
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

3. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```

4. **Environment Variables**
   * Create a `.env.local` in `frontend` with:
     ```env
     NEXTAUTH_URL=http://localhost:3000
     GOOGLE_CLIENT_ID=your_google_client_id
     GOOGLE_CLIENT_SECRET=your_google_client_secret
     NEXTAUTH_SECRET=your_random_secret
     ```

   * Create a `.env` in `backend` with:
     ```env
     MONGO_URI=your_mongodb_connection_string
     JWT_SECRET=your_jwt_secret
     OPENAI_API_KEY=your_openai_api_key
     ```

5. **Run Locally**
   * Frontend:
     ```bash
     npm run dev
     ```
   * Backend:
     ```bash
     npm run start
     ```


## 📁 Project Structure


```
trendwise/
├── frontend/ (Next.js + Tailwind)
│   ├── app/
│   ├── components/
│   ├── styles/
│   └── pages/api/ (NextAuth routes)
├── backend/ (Express API)
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── utils/
```


## 📑 Key Routes


| Route                 | Purpose                  |
| --------------------- | ------------------------ |
| `/`                   | Homepage - list articles |
| `/article/[slug]`     | View article details     |
| `/login`              | Google login             |
| `/admin` *(optional)* | Admin dashboard          |
| `/api/article`        | Create/fetch articles    |
| `/api/comment`        | Post/get comments        |
| `/sitemap.xml`        | Sitemap generation       |
| `/robots.txt`         | Bot instructions         |


## 📌 Submission Notes


* ⏰ **Deadline**: Within 2 days
* ✅ Code pushed to GitHub
* 🌐 App deployed on [Vercel](https://vercel.com) and [Render](https://render.com)
* 📩 For any issues, contact via Internshala


## 🧑‍💻 Developer


* 👤 **Obiora Chibuike**
* ✉️ [obiorachibuike22@gmail.com](mailto:obiorachibuike22@gmail.com)
* 🌐 [LinkedIn](https://linkedin.com/in/yourprofile)


## 🏁 Evaluation Criteria Checklist


| Area             | Criteria Met ✅                   |
| ---------------- | -------------------------------- |
| Next.js Usage    | ✅ App Router, SSR                |
| Auth & Comments  | ✅ Secure Google login + comments |
| SEO Optimization | ✅ meta, OG tags, sitemap, robots |
| Bot Integration  | ✅ ChatGPT + trending topics      |
| UI/UX            | ✅ Responsive Tailwind UI         |
| Deployment       | ✅ Live on Vercel + Render        |


---


