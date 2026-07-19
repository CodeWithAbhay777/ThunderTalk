# Thunder Talk

Single-user, browser-encrypted personal diary. MongoDB stores only AES-256-GCM ciphertext and its random IV; plaintext and encryption keys never reach the server.

## Setup

1. Copy `.env.example` to `.env.local` and set every value. `AUTH_PASSWORD_BCRYPT_HASH` must be the complete 60-character value produced by `bcrypt.hash(password, 12)`; `12` is its work factor. In a Next `.env` file, escape each dollar sign as `\$` so environment-variable expansion does not corrupt the hash. Use a random `JWT_SECRET` of at least 32 bytes.
2. Start MongoDB with a dedicated account and TLS in any remote deployment.
3. Run `npm run dev`.

The login password is checked by the API only to obtain an HTTP-only session cookie. After successful login the browser derives a non-extractable AES key using PBKDF2-SHA-256 (600,000 iterations) and a random per-entry salt stored with each encrypted entry. Each save produces a new 96-bit random AES-GCM IV.

The password will appear in your own browser's Network request payload. That is normal for password authentication: the request is encrypted in transit by HTTPS, while browser developer tools deliberately let the local user inspect what they enter. Client-side hashing cannot hide it safely because the resulting hash becomes a reusable password equivalent. The app automatically locks after five minutes without activity; lock the operating system whenever you leave your desk. Never deploy this application over plain HTTP.
