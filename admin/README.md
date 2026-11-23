# Admin tools

Tools that run on a parent's computer, not in the website. They use the Firebase Admin SDK.
Adapted from the same tool in the Kids Games repo.

**Do not put a service account key in this folder or anywhere in this repo.** The repo is public.
A service account key gives full control of the Firebase project.

## reset-pin.mjs — set a new PIN for an account

Use it when someone forgets the PIN. The site cannot do this, and the Firebase console cannot set
a password directly: its "Reset password" sends an email, and an `@kidschinese.invalid` address gets no email.

### One-time setup

1. Install Node.js 22 or later (https://nodejs.org).
2. Open a terminal in this `admin` folder. Run:

   ```
   npm install
   ```

`js/firebase/config.js` must have the project config (see `firebase/SETUP.md`). The tool reads
the project ID from it and refuses a key for another project.

### Get a key

1. Firebase console → ⚙ Project settings → **Service accounts** → **Generate new private key**.
2. Save the file as `<home folder>/kidschinese-admin/service-account.json`
   (Windows: `C:\Users\<you>\kidschinese-admin\service-account.json`).
   Any other path outside the repo also works with `--key <path>`.
3. Safer: delete the key after use. Google Cloud console → IAM & Admin → Service accounts →
   `firebase-adminsdk-…` → Keys → delete. Make a new key next time.

### Run

```
node reset-pin.mjs                 list the accounts, pick one, type the new PIN
node reset-pin.mjs --player JY     go straight to account JY
node reset-pin.mjs --list          list the accounts only, change nothing
node reset-pin.mjs --key <path>    use a key file at another path
```

The script:

1. Stops if the config is missing, or the key is missing, inside the repo, or for another project.
2. Lists the `@kidschinese.invalid` accounts with their code (YC, JY, SL, CJ).
3. Asks for the new 6-digit PIN two times at a hidden prompt (shows `*`).
   The PIN is not stored, logged, or put on the command line.
4. Asks you to type `yes`, then sets the PIN in Firebase Authentication.

After a change:

- Devices still signed in as that account are signed out when their sign-in next refreshes.
- The 30-minute wrong-PIN lock is stored on each device (`kc-lock`). The script cannot clear it.
