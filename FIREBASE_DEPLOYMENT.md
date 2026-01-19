# 🔥 Firebase Hosting Setup

## Prerequisites
- Google account
- Node.js installed (comes with npm)

## One-Time Setup

### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```
This will open a browser for Google authentication.

### 3. Initialize Firebase Project
```bash
firebase init hosting
```

When prompted:
- **Use an existing project or create a new one?** → Create a new project or select existing
- **What do you want to use as your public directory?** → `.` (current directory)
- **Configure as a single-page app?** → Yes
- **Set up automatic builds and deploys with GitHub?** → No (we'll deploy manually)
- **Overwrite index.html?** → No

### 4. Update .firebaserc
After initialization, a `.firebaserc` file will be created with your project ID.

## Deploying to Firebase

### Deploy Everything
```bash
firebase deploy
```

### Deploy Hosting Only
```bash
firebase deploy --only hosting
```

## Workflow

1. Make changes to your files
2. Test locally
3. Commit to git:
   ```bash
   git add .
   git commit -m "Your message"
   git push
   ```
4. Deploy to Firebase:
   ```bash
   firebase deploy
   ```

## Important Notes

- **Admin panel excluded**: The `admin/` folder won't be deployed (see firebase.json ignore list)
- **class-defaults.json included**: The defaults file WILL be deployed
- **Free tier**: Firebase has generous free limits (10GB bandwidth/month)
- **Custom domain**: You can add your own domain in Firebase Console → Hosting

## Useful Commands

```bash
# Preview locally before deploying
firebase serve

# View deployment history
firebase hosting:sites:list

# View live URL
firebase hosting:channel:list
```

## Live URL
After deployment, your app will be available at:
`https://YOUR-PROJECT-ID.web.app`

## Troubleshooting

### "Command not found: firebase"
- Restart terminal after installing firebase-tools
- Or use: `npx firebase` instead of `firebase`

### Deployment fails
- Check if logged in: `firebase login:list`
- Re-login: `firebase logout` then `firebase login`

### Old files not updating
- Clear Firebase cache: `firebase hosting:disable` then `firebase deploy`
