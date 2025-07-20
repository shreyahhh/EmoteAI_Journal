# Emote — AI-Powered Journaling App

Emote is a secure, AI-powered journaling web application that helps you reflect, grow, and receive gentle mental health insights based on your writing. Using advanced natural language processing (NLP), Emote identifies emotional patterns, provides visualizations, and offers personalized support resources.
ERROR
children is not a function
TypeError: children is not a function
    at Wordcloud (http://localhost:3000/main.d0f82b94b046597ad3c2.hot-update.js:124:6)
    at react-stack-bottom-frame (http://localhost:3000/static/js/bundle.js:80594:18)
    at renderWithHooks (http://localhost:3000/static/js/bundle.js:70804:20)
    at updateFunctionComponent (http://localhost:3000/static/js/bundle.js:72497:17)
    at beginWork (http://localhost:3000/static/js/bundle.js:73083:16)
    at runWithFiberInDEV (http://localhost:3000/static/js/bundle.js:68575:68)
    at performUnitOfWork (http://localhost:3000/static/js/bundle.js:75156:93)
    at workLoopSync (http://localhost:3000/static/js/bundle.js:75049:38)
    at renderRootSync (http://localhost:3000/static/js/bundle.js:75033:7)
    at performWorkOnRoot (http://localhost:3000/static/js/bundle.js:74797:42)

## ✨ Features

- **Journal Entry System:** Clean, distraction-free interface for daily reflections.
- **AI Emotional Analysis:** Each entry is analyzed for sentiment, emotions, and key themes using Google Gemini API.
- **Weekly AI Summary:** Get a personalized summary of your week, including overall feeling, key themes, and gentle suggestions.
- **Smart Resource Recommendations:** Resources are recommended based on the actual themes in your recent entries.
- **Interactive Resource Library:** Click any resource card for AI-generated tips, exercises, and affirmations.
- **Data Visualization:** View mood and sentiment trends, dot representation, and more in the Insights tab.
- **Privacy First:** Your data is private and securely stored.

## 🛠️ Tech Stack

- **Frontend:** React, Tailwind CSS, Recharts
- **Backend:** Firebase (Firestore, Auth)
- **AI/NLP:** Google Gemini API

## 🚀 Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/shreyahhh/Emote--A-journaling-app-with-emotional-analysis-and-support.git
   cd Emote--A-journaling-app-with-emotional-analysis-and-support
   ```
2. **Install dependencies:**
   ```bash
   cd frontend-new
   npm install
   ```
3. **Set up environment variables:**
   - Add your Gemini API key in the relevant files (see `JournalView.jsx`, `ResourcesView.jsx`, etc.).
   - Configure Firebase credentials in `frontend-new/src/firebase.js`.
4. **Run the app:**
   ```bash
   npm start
   ```
5. **Open in your browser:**
   - Visit [http://localhost:3000](http://localhost:3000)

## 📊 Key Screens

- **Journal:** Write and edit entries, see AI-powered tags for emotions and themes.
- **Insights:** View mood/sentiment charts, dot representation, and generate a weekly AI summary.
- **Resources:** Get personalized resource recommendations and interactive AI advice.

## 🧠 Ethical Considerations
- This app is not a diagnostic tool.
- Provides crisis support links and encourages seeking professional help when needed.
- User privacy and data security are prioritized.

---

For more details, see the [GitHub repo](https://github.com/shreyahhh/Emote--A-journaling-app-with-emotional-analysis-and-support). 