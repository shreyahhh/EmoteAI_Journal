# EmotionAware — An AI-Powered Mental Health Journaling App

🔍 ## Overview

EmotionAware is a secure, AI-powered journaling web application that allows users to express their thoughts freely while receiving gentle, private mental health insights based on their writing. Using advanced natural language processing (NLP) models, the app identifies emotional patterns and provides feedback to help users understand and manage their mental well-being over time.

🎯 ## Goals

- Provide a safe space for users to journal regularly.
- Analyze journal entries using pretrained NLP models to assess sentiment, emotion, and mental health signals.
- Offer visualizations and trends of the user's emotional state over time.
- Promote mental health self-awareness while respecting user privacy.

🔑 ## Core Features

- **Journal Entry System**: Secure, distraction-free writing interface for daily reflections.
- **AI Emotional Analysis**:
  - Sentiment classification (positive, negative, neutral).
  - Emotion detection (joy, sadness, anger, fear, etc.).
  - Risk pattern detection (optional: signs of burnout, anxiety).
- **Insights Dashboard**:
  - Mood trends (weekly/monthly).
  - Emotion frequency chart.
  - Word cloud of recurring themes.
- **Smart Prompts**:
  - Adaptive journaling questions based on mood.
  - Encouragements or reflections triggered by writing tone.
- **Privacy First**:
  - Encrypted journals.
  - No third-party data sharing.
  - Opt-in AI analysis.

🧠 ## AI/NLP Stack

Using publicly available pretrained models from Hugging Face:

- `bhadresh-savani/distilbert-base-uncased-emotion` – emotion detection
- `distilbert-base-uncased-finetuned-sst-2-english` – sentiment classification
- Optional: additional models for stress/depression detection

🏗️ ## Technical Stack

| Layer          | Technology                               |
|----------------|------------------------------------------|
| **Frontend**   | React + Tailwind CSS                     |
| **Backend**    | Node.js or FastAPI                       |
| **Database**   | PostgreSQL / MongoDB / Supabase          |
| **NLP**        | Hugging Face Transformers, Python        |
| **Authentication**| Firebase Auth or Auth0                |
| **Deployment** | Vercel / Render / Railway                |

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