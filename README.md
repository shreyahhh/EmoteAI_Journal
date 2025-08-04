# Emote — An AI-Powered Journaling and Emotional Wellness Companion

Emote is a modern, AI-driven journaling application designed to be your personal companion for emotional wellness. It provides a private and secure space to articulate your thoughts and feelings, track your moods, set personal goals, and gain valuable insights into your emotional patterns. With the power of Google's Gemini API, Emote offers intelligent chat support, helping you navigate your feelings and providing a supportive conversational partner whenever you need it.

## ✨ Features

-   **Secure User Authentication:** Sign up and log in securely using Firebase Authentication, ensuring your journal remains private and personal.
-   **Daily Journaling:** A rich text editor to write, edit, and save your daily journal entries.
-   **AI-Powered Chat:** Engage in conversations with an AI assistant (powered by Gemini) that offers support, guidance, and a listening ear.
-   **Mood Tracking:** Select and record your mood for each journal entry, creating a visual timeline of your emotional state.
-   **Goal Setting & Tracking:** Define, manage, and track your personal wellness goals directly within the app.
-   **Insights Dashboard:** Visualize your emotional trends, mood patterns, and journaling habits over time with intuitive charts and graphs.
-   **Timeline View:** See a chronological view of your journal entries and moods.
-   **Curated Resources:** Access a collection of articles, videos, and other resources to support your mental and emotional well-being.
-   **User Settings:** Customize your experience and manage your account details.

## 🚀 Recent Improvements

### Performance & User Experience
- **Error Boundaries:** Added comprehensive error handling to prevent app crashes
- **React.memo Optimization:** Improved performance with memoized components
- **Enhanced Loading States:** Better visual feedback during app initialization
- **Accessibility Improvements:** Added ARIA labels, keyboard navigation, and focus management
- **Toast Notifications:** Real-time user feedback system

### Code Quality & Reliability
- **API Rate Limiting:** Intelligent request queuing and retry logic for Gemini API
- **Input Validation:** Comprehensive validation and sanitization
- **TypeScript-ready Structure:** Organized utils and improved type safety
- **Keyboard Shortcuts:** Power user features for efficient navigation
- **Mobile-first Design:** Enhanced responsive design patterns

### Developer Experience
- **Fixed Build Issues:** Resolved ESLint errors and React 19 compatibility
- **Better Testing Setup:** Mocked Firebase for reliable testing
- **Enhanced Tailwind Config:** Custom animations and design tokens
- **Component Library:** Reusable UI components (ConfirmDialog, ErrorBoundary)

## 🛠 Tech Stack

-   **Frontend:**
    -   [React 19](https://reactjs.org/) - Latest React with concurrent features
    -   [React Router](https://reactrouter.com/) - For declarative routing
    -   [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

-   **Backend & Database:**
    -   [Firebase](https://firebase.google.com/) - Used for:
        -   **Authentication:** Manages user sign-up and login
        -   **Firestore:** A NoSQL database for storing journal entries, user data, and goals

-   **Artificial Intelligence:**
    -   [Google Gemini API](https://ai.google.dev/) - Powers intelligent chat and emotional analysis

## 📋 Getting Started

To get a local copy up and running, follow these steps.

### Prerequisites

- [Node.js](https://nodejs.org/) (version 16 or higher)
- [npm](https://www.npmjs.com/get-npm) or [yarn](https://yarnpkg.com/)
- Firebase project with Firestore and Authentication enabled
- Google Gemini API key

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/shreyahhh/Emote--A-journaling-app-with-emotional-analysis-and-support.git
    cd Emote--A-journaling-app-with-emotional-analysis-and-support/frontend-new
    ```

2.  **Install dependencies:**
    ```bash
    npm install --legacy-peer-deps
    ```
    
    > **Note:** The `--legacy-peer-deps` flag is required due to React 19 compatibility with some packages.

3.  **Set up environment variables:**
    
    Create a `.env.local` file in the `frontend-new` directory:
    ```env
    REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
    REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
    REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
    REACT_APP_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
    REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
    REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
    REACT_APP_GEMINI_API_KEY=your_gemini_api_key
    ```
    
    **Get your keys:**
    - **Firebase:** [Firebase Console](https://console.firebase.google.com/)
    - **Gemini API:** [Google AI Studio](https://aistudio.google.com/app/apikey)

4.  **Run the application:**
    ```bash
    npm start
    ```
    
    The application will be available at `http://localhost:3000`.

### Building for Production

```bash
npm run build
```

The optimized build will be in the `build` folder, ready for deployment.

### Running Tests

```bash
npm test
```

## ⌨️ Keyboard Shortcuts

- `Ctrl + N` - New journal entry
- `Ctrl + S` - Save entry
- `Ctrl + 1-6` - Navigate between tabs
- `?` - Show keyboard shortcuts help
- `Escape` - Close modals/dialogs

## 🎯 Key Screens

- **Journal:** Write and edit entries with AI-powered emotional analysis
- **Insights:** View mood/sentiment charts, word clouds, and AI-generated summaries
- **Timeline:** Browse your journal history by month and revisit memories
- **Chat:** Ask Emote questions about your journal and get context-aware answers
- **Resources:** Get personalized resource recommendations and interactive AI advice
- **Settings:** Manage reminders, notifications, and export your data

## 🔒 Privacy & Ethics

- **Not a diagnostic tool:** This app is for wellness support, not medical diagnosis
- **Privacy first:** Your data stays private and secure
- **Crisis support:** Provides links to professional help when needed
- **Ethical AI:** Responsible use of AI for emotional support

## 🚀 Deployment

### Using Docker (Recommended)

```bash
docker build -t emote-app .
docker run -p 3000:80 emote-app
```

### Using Static Hosting

The built application can be deployed to any static hosting service:
- Netlify
- Vercel
- Firebase Hosting
- AWS S3 + CloudFront

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini AI for emotional analysis capabilities
- Firebase for reliable backend infrastructure
- The React and open-source community for excellent tools and libraries

---

*Made with ❤️ for emotional wellness and mental health support*
