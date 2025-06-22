# Logware — An AI-Powered Mental Health Journaling App

🔍 ## Overview

Logware is a secure, AI-powered journaling web application that allows users to express their thoughts freely while receiving gentle, private mental health insights based on their writing. Using advanced natural language processing (NLP) models, the app identifies emotional patterns on a sentence-by-sentence basis and provides feedback to help users understand and manage their mental well-being.

🎯 ## Goals

- Provide a safe space for users to journal regularly.
- Analyze journal entries using pretrained NLP models to assess sentiment, emotion, and mental health signals.
- Offer visualizations and trends of the user's emotional state over time.
- Promote mental health self-awareness while respecting user privacy.

🔑 ## Core Features

- **Journal Entry System**: A clean, distraction-free writing interface for daily reflections.
- **Database Integration**: Journal entries are securely saved to a Supabase database.
- **Sentence-by-Sentence AI Emotional Analysis**:
  - The application processes each sentence individually to provide a nuanced emotional analysis.
  - It identifies a range of emotions, including joy, sadness, anger, fear, love, and surprise.
- **Data Visualization**:
  - **Emotion Breakdown**: A pie chart visualizes the percentage of each emotion detected in the journal entry.
  - **Detailed Analysis**: Each sentence is displayed with its corresponding emotion, allowing for a granular view of the user's text.
- **Interpretive Summary**: A dynamically generated note provides a high-level summary of the emotional landscape of the journal entry.

🧠 ## AI/NLP Stack

- **Emotion Detection Model**: Utilizes the `j-hartmann/emotion-english-distilroberta-base` model from Hugging Face for high-quality emotion analysis.
- **Sentence Tokenization**: The `nltk` (Natural Language Toolkit) library is used to split journal entries into individual sentences for more accurate processing.

🏗️ ## Technical Stack

| Layer          | Technology                               |
|----------------|------------------------------------------|
| **Frontend**   | React (with Vite), Tailwind CSS, Recharts |
| **Backend**    | Python with FastAPI                      |
| **Database**   | Supabase (PostgreSQL)                    |
| **NLP**        | Hugging Face Transformers, NLTK, PyTorch |
| **Deployment** | (Not yet deployed)                       |

💡 ## Stretch Goals

- Mobile version (React Native or Flutter).
- AI therapist mode for journaling reflection.
- Guided journaling tracks (e.g., anxiety, motivation, grief).
- Integration with wearable data (e.g., stress from Fitbit).

🚨 ## Ethical Considerations

- Include disclaimers: "This app is not a diagnostic tool."
- Provide resources for mental health support (hotlines, referrals).
- Ensure informed consent for emotional analysis.
- Allow opt-out of AI features at any time. 