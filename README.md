Modern Habit Tracker — Electron wrapper

Quick start (Windows):

1. Install dependencies:

```powershell
npm install
```

2. Run in development:

```powershell
npm run start
```

3. Build Windows installer (requires additional build tools):

```powershell
npm run dist
```

## Code signing

See [CODE_SIGNING.md](CODE_SIGNING.md) for instructions on signing your installer and executables for Windows.
Modern Habit Tracker — Electron wrapper

Quick start (Windows):

1. Install dependencies:

```powershell
npm install
```

2. Run in development:

```powershell
npm run start
```

3. Build Windows installer (requires additional build tools):

```powershell
npm run dist
```

Notes:

- The app uses the existing `habit.html`, `script.js`, and `style.css` in the same folder.
- If you want native integrations, we can add IPC in `preload.js` and `main.js`.
