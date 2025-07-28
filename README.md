# Emote — An AI-Powered Journaling and Emotional Wellness Companion

Emote is a modern, AI-driven journaling application designed to be your personal companion for emotional wellness. It provides a private and secure space to articulate your thoughts and feelings, track your moods, set personal goals, and gain valuable insights into your emotional patterns. With the power of Google's Gemini API, Emote offers intelligent chat support, helping you navigate your feelings and providing a supportive conversational partner whenever you need it.

## Features

-   **Secure User Authentication:** Sign up and log in securely using Firebase Authentication, ensuring your journal remains private and personal.
-   **Daily Journaling:** A rich text editor to write, edit, and save your daily journal entries.
-   **AI-Powered Chat:** Engage in conversations with an AI assistant (powered by Gemini) that offers support, guidance, and a listening ear.
-   **Mood Tracking:** Select and record your mood for each journal entry, creating a visual timeline of your emotional state.
-   **Goal Setting & Tracking:** Define, manage, and track your personal wellness goals directly within the app.
-   **Insights Dashboard:** Visualize your emotional trends, mood patterns, and journaling habits over time with intuitive charts and graphs.
-   ** timeline View:** See a chronological view of your journal entries and moods.
-   **Curated Resources:** Access a collection of articles, videos, and other resources to support your mental and emotional well-being.
-   **User Settings:** Customize your experience and manage your account details.

## Tech Stack

-   **Frontend:**
    -   [React](https://reactjs.org/) - A JavaScript library for building user interfaces.
    -   [React Router](https://reactrouter.com/) - For declarative routing in the application.
    -   CSS3 - For styling and a responsive user experience.

-   **Backend & Database:**
    -   [Firebase](https://firebase.google.com/) - Used for:
        -   **Authentication:** Manages user sign-up and login.
        -   **Firestore:** A NoSQL database for storing journal entries, user data, and goals.

-   **Artificial Intelligence:**
    -   [Google Gemini API](https://ai.google.dev/) - Powers the intelligent chat feature for emotional analysis and support.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

Make sure you have Node.js and npm installed on your machine.

-   [Node.js](https://nodejs.org/)
-   [npm](https://www.npmjs.com/get-npm)

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name/frontend-new
    ```

2.  **Install NPM packages:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    -   Create a `.env.local` file in the `frontend-new` directory.
    -   Add the following environment variables with your Firebase and Gemini API keys. You can get these from the [Firebase Console](https://console.firebase.google.com/) and [Google AI Studio](https://aistudio.google.com/app/apikey).

    ```env
    REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
    REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
    REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
    REACT_APP_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
    REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
    REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
    REACT_APP_GEMINI_API_KEY=your_gemini_api_key
    ```

4.  **Run the application:**
    ```sh
    npm start
    ```

    The application will be available at `http://localhost:3000`.



## Key Screens

- **Journal:** Write and edit entries, see AI-powered tags for emotions, themes, and activities.
- **Insights:** View mood/sentiment charts, word cloud, mood-activity insights, and generate a weekly AI summary.
- **Timeline:** Browse your journal history by month and revisit memories.
- **Chat:** Ask Emote questions about your journal and get AI-powered, context-aware answers.
- **Resources:** Get personalized resource recommendations and interactive AI advice.
- **Settings:** Manage reminders, notifications, and export your data.

## Ethical Considerations
- This app is not a diagnostic tool.
- Provides crisis support links and encourages seeking professional help when needed.
- User privacy and data security are prioritized.

---
