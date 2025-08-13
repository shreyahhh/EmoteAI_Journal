# Firebase Setup Guide

## Prerequisites
1. A Firebase project (create one at https://console.firebase.google.com/)
2. Firebase Authentication enabled
3. Firestore Database enabled

## Setup Steps

### 1. Create a .env file
Create a `.env` file in the `frontend-new` directory with the following content:

```
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 2. Get Firebase Configuration
1. Go to your Firebase Console
2. Click on your project
3. Click the gear icon (⚙️) next to "Project Overview"
4. Select "Project settings"
5. Scroll down to "Your apps" section
6. Click on the web app (</>) or create one if it doesn't exist
7. Copy the configuration values from the provided code snippet

### 3. Replace Placeholder Values
Replace the placeholder values in your `.env` file with the actual values from Firebase:
- `your_api_key_here` → Your actual API key
- `your_project_id` → Your actual project ID
- `your_project_id.firebaseapp.com` → Your actual auth domain
- etc.

### 4. Enable Authentication
1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Enable "Email/Password" authentication method
4. Add your email as a test user if needed

### 5. Enable Firestore
1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" for development
4. Select a location for your database

### 6. Restart the Application
After setting up the `.env` file, restart your React application:
```bash
npm start
```

## Demo Mode
If you don't have Firebase set up yet, the application will run in demo mode with placeholder data. You'll see warning messages in the console, but the app will still function for testing the UI and navigation.

## Troubleshooting
- Make sure all environment variable names start with `REACT_APP_`
- Restart the development server after creating/modifying the `.env` file
- Check the browser console for any error messages
- Ensure your Firebase project has the necessary services enabled
