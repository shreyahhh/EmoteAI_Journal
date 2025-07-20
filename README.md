# Emote — AI-Powered Journaling App

Emote is a secure, AI-powered journaling web application that helps you reflect, grow, and receive gentle mental health insights based on your writing. Using advanced natural language processing (NLP), Emote identifies emotional patterns, provides visualizations, and offers personalized support resources. The app now includes a timeline of your entries, an AI chat assistant, activity tracking, word clouds, and more — all in a beautiful, privacy-first interface.

## ✨ Features

- **Journal Entry System:** Clean, distraction-free interface for daily reflections.
- **AI Emotional Analysis:** Each entry is analyzed for sentiment, emotions, and key themes using Google Gemini API.
- **Activity Tagging:** Tag your daily activities (exercise, work, social, etc.) and see how they relate to your mood.
- **Mood-Activity Insights:** Visualize which activities most often correlate with positive moods.
- **Weekly AI Summary:** Get a personalized summary of your week, including overall feeling, key themes, and gentle suggestions.
- **Word Cloud:** See a dynamic word cloud of your most-used words in journal entries.
- **Timeline View:** Browse your journal history in a beautiful, chronological timeline grouped by month.
- **Chat Assistant:** Ask questions about your journal history and get AI-powered, context-aware answers based on your own entries.
- **Smart Resource Recommendations:** Resources are recommended based on the actual themes in your recent entries.
- **Interactive Resource Library:** Click any resource card for AI-generated tips, exercises, and affirmations.
- **Data Export:** Download all your journal entries as JSON, CSV, or TXT for backup or analysis.
- **Settings Modal:** Manage notification preferences and daily journaling reminders.
- **Modern UI:** Responsive, accessible, and visually appealing design with dark mode and smooth transitions.
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
   - Add your Gemini API key in the relevant files (see `JournalView.jsx`, `ResourcesView.jsx`, `ChatView.jsx`, etc.).
   - Configure Firebase credentials in `frontend-new/src/firebase.js`.
4. **Run the app:**
   ```bash
   npm start
   ```
5. **Open in your browser:**
   - Visit [http://localhost:3000](http://localhost:3000)

## 📊 Key Screens

- **Journal:** Write and edit entries, see AI-powered tags for emotions, themes, and activities.
- **Insights:** View mood/sentiment charts, word cloud, mood-activity insights, and generate a weekly AI summary.
- **Timeline:** Browse your journal history by month and revisit memories.
- **Chat:** Ask Emote questions about your journal and get AI-powered, context-aware answers.
- **Resources:** Get personalized resource recommendations and interactive AI advice.
- **Settings:** Manage reminders, notifications, and export your data.

## 🧠 Ethical Considerations
- This app is not a diagnostic tool.
- Provides crisis support links and encourages seeking professional help when needed.
- User privacy and data security are prioritized.

---

For more details, see the [GitHub repo](https://github.com/shreyahhh/Emote--A-journaling-app-with-emotional-analysis-and-support). 