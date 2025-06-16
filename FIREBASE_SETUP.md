# Firebase Admin SDK Setup Guide

## 1. Generate Service Account Key

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** (gear icon) → **Service accounts**
4. Click **Generate new private key**
5. Download the JSON file

## 2. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and update with your values:

### Method 1: Service Account JSON (Recommended)

```bash
# Copy the entire contents of your service account JSON file here (as a single line)
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project",...}'

# Optional: Database URL (only if using Realtime Database)
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com/
```

### Method 2: Individual Environment Variables (Alternative)

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhki...\n-----END PRIVATE KEY-----\n"
```

## 3. Initialize Default Roles

After setting up the environment variables:

1. Start your development server: `npm run dev`
2. Navigate to `/users` in your application
3. Go to the "Roles" tab
4. Click "Initialize Default Roles" to create system roles

## 4. Create Your First Admin User

1. In the Firebase Console, go to **Authentication** → **Users**
2. Click **Add user** and create a user with your email
3. In your application, go to `/users`
4. Find your user and edit them to add the "Super Admin" role

## 5. Security Rules (Optional)

Update your Firestore security rules to use the custom claims:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users with admin role to read/write everything
    match /{document=**} {
      allow read, write: if request.auth != null &&
        ('admin:all' in request.auth.token.roles ||
         'Super Admin' in request.auth.token.roles);
    }

    // Allow users to read their own user document
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
    }

    // Add more specific rules based on your needs
  }
}
```

## Available Roles

The system creates these default roles:

- **Super Admin**: Full system access
- **Admin**: Administrative access to most features
- **Editor**: Can edit content but not manage users
- **Viewer**: Read-only access
- **Team Manager**: Can manage specific teams and players

## API Endpoints

The user management system provides these API endpoints:

- `GET/POST /api/users` - List/create users
- `GET/PUT/DELETE /api/users/[uid]` - Get/update/delete specific user
- `GET/POST /api/roles` - List/create roles
- `GET/PUT/DELETE /api/roles/[id]` - Get/update/delete specific role
- `POST /api/roles/init` - Initialize default roles

## Troubleshooting

1. **"Firebase service account credentials not found"**

   - Make sure your `.env.local` file is in the project root
   - Verify the environment variable names match exactly
   - Restart your development server after adding environment variables

2. **"Invalid JSON in FIREBASE_SERVICE_ACCOUNT_KEY"**

   - Ensure the JSON is properly escaped and on a single line
   - Try using the individual environment variables method instead

3. **Permission denied errors**
   - Verify your service account has the necessary permissions
   - Check that Firebase Admin SDK is enabled in your project
