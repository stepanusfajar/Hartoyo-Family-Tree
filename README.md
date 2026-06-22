# Family Tree

A family tree web app that anyone in the family can view and edit. Published via GitHub Pages with Firebase for authentication and data storage.

## Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. **Enable Authentication**: Go to Authentication → Sign-in method → Enable **Google** provider
4. **Create Firestore Database**: Go to Firestore → Create database (start in test mode, we'll lock it down)

### 2. Get Firebase Config

1. In Firebase console, go to Project Settings → General → Your apps → Add app → Web
2. Copy the `firebaseConfig` object values

### 3. Configure the App

Edit `js/app.js` and replace the placeholder values:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 4. Firestore Security Rules

Go to Firestore → Rules and replace with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /people/{person} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

This lets anyone **read** the tree, but only signed-in users **write**.

### 5. Deploy to GitHub Pages

1. Create a GitHub repo (e.g. `family-tree`)
2. Push the files:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/family-tree.git
   git push -u origin main
   ```
3. Go to repo Settings → Pages → Deploy from branch `main`, folder `/root`
4. Share the URL (e.g. `https://YOUR_USERNAME.github.io/family-tree/`)

All family members who sign in with their Google account can add and edit people.
