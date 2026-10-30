# SVS-CLIENT

The web client: React 19, TypeScript, Vite, Tailwind CSS 4, shadcn/ui. The project as a whole is described in the [main README](../README.md).

```text
src/
  api/client.ts            the configured SDK (cookies, same origin, one place for the global error handling)
  api/sdk/                 GENERATED from ../SVS-SERVER/openapi.json: do not edit
  services/voting/         makes the ballot in the browser: Paillier encryption and the zero-knowledge proofs
  services/auth.ts         sign-in steps; the session is an HttpOnly cookie, the client never holds the token
  pages/, components/      the pages (home, vote, administration) and their components
  schemas/                 Zod schemas of the forms
tests/, src/**/*.test.ts   Vitest
scripts/interop-fixture.ts ballots made here, for the server's tests to verify
```

## Commands

```bash
bun install
bun run dev                    # http://localhost:5173, /api is proxied to http://localhost:8000 (VITE_API_URL to change it)
bun run test                   # Vitest
bun run lint                   # ESLint
bun run build                  # type-check and production build into dist/ (the Docker image copies it into the API)
bun run generate-API-CLIENT    # regenerate src/api/sdk after `make openapi` in ../SVS-SERVER (needs a JRE; the generator is pinned)
bun run interop-fixture        # rewrite ../SVS-SERVER/app/tests/fixtures/ts_ballots.json
```

## The ballot

`services/voting/paillier_encryption_utils.ts` builds a ballot: for each candidate an encryption of 0 or 1 with a proof that it is a 0 or a 1, and a proof that the sum of all of them is 0 or 1 (`buildBallot`). The server checks all of it before recording the ballot, and anybody can check it again from the public bulletin board. The challenge of the proofs is hashed exactly as the server hashes it (`fsHash` here, `fs_hash` in `app/models/voting_models.py`): a ballot made here is accepted by the server's code in `SVS-SERVER/app/tests/test_interop.py`, and a ballot made by the server's Python voter verifies here in `src/services/voting/paillier.test.ts`.

`crypto.subtle` (SHA-256) exists only on pages served over HTTPS (or localhost): over plain http voting says so instead of failing.

## Things to know

- **The API is on the same origin as the page**, under `/api`: there is no base URL to configure, and the session cookie needs it.
- `src/api/sdk` is not linted (it is generated); the rest of the code is, with `bun run lint`.
