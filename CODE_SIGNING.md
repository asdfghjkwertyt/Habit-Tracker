Code signing (Windows)

To sign your installer and executables on Windows, obtain a code signing certificate from a trusted CA (e.g., DigiCert, Sectigo).

Recommended steps:

1. Purchase an EV or standard code signing cert and export it as a PFX file.
2. Set environment variables during build (CI) or locally:
   - `CSC_LINK`: path to the PFX file (or a secure URL)
   - `CSC_KEY_PASSWORD`: password for the PFX

3. electron-builder will pick up `CSC_LINK` and sign the installer automatically.

Local example (PowerShell):

```powershell
$env:CSC_LINK = "C:\path\to\your\certificate.pfx"
$env:CSC_KEY_PASSWORD = "yourPfxPassword"
npm run dist
```

Notes:

- For automated builds (CI/CD), store the PFX securely (secret store) and set these env vars in the pipeline.
- For NSIS, signing both the `.exe` installer and the `.exe` inside the installer is recommended.
- If you don't sign, Windows may show an untrusted publisher warning.
