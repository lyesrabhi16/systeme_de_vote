# Security model

What SVS protects, against whom, how, and where each claim is tested. It is written to be read before deciding whether to trust a real election to it: the [limits](#what-it-does-not-protect) matter as much as the protections.

## What is being protected

| asset | where it lives | who must not get it |
| --- | --- | --- |
| the **choice** of a voter | encrypted in the voter's browser with the election's Paillier public key; stored as a ciphertext in `bulletin.content` | anybody who is not the election's key holder |
| the **private key** of an election | `vote.encrypted_private_key`: encrypted with `ENCRYPTION_KEY` | everybody, until the election is over |
| **who voted** | `attributedvote.user_has_voted` (a flag per voter and election) | not secret from the people concerned; it is not linked to a ballot |
| **accounts**: password hashes, email addresses, phone numbers | `user` table | other users, and every API response |
| **sessions** | an `HttpOnly` cookie holding a JWT | scripts in the page, the logs |
| the **count** | `candidate.vote_count`, `vote.encrypted_tally`, `vote.tally_proof` | nobody: it must be verifiable by anybody |

## Who is assumed to do what

- **The voter's browser is honest.** It builds the ballot; nothing checks that what it encrypts is what the voter chose.
- **The server is trusted for secrecy, not for the count.** It holds the election keys and sees who sends which ballot, so it could read and attribute ballots (see below). But it cannot make a wrong count pass: the count is checked from public data.
- **The database is not trusted with secrets in the clear**: the private keys are encrypted, the passwords hashed. A copy of the database alone (without `ENCRYPTION_KEY`) reveals no vote.
- **The network is not trusted**: HTTPS in front of the application, cookies `Secure`, HSTS in production.

## The ballot protocol

An election has a Paillier key pair `(n, g = n + 1)`, `n` of at least 2048 bits in production. A ballot for candidates `c₁ … c_k` is `(E(v₁), …, E(v_k))` with `vᵢ ∈ {0, 1}`, `Σvᵢ ≤ 1`, and:

1. **For each `i`**, a non-interactive OR-proof (Cramer–Damgård–Schoenmakers, Fiat–Shamir over SHA-256, 128-bit challenges) that `E(vᵢ)` encrypts 0 or 1: branch 0 says `cᵢ` is an n-th power, branch 1 says `cᵢ / g` is; the prover runs the one that is true and simulates the other, and the challenge is split between them. The verifier checks `e₀ ⊕ e₁ = H(n, g, c, a₀, a₁)`, `z₀ⁿ = a₀ · c^e₀` and `z₁ⁿ = a₁ · (c/g)^e₁` modulo `n²`.
2. **A proof on `C = Πcᵢ`**, which encrypts `Σvᵢ` with randomness `Πrᵢ`, that `Σvᵢ ∈ {0, 1}`. Without it each entry passes alone while the ballot chooses every candidate.

The hashed text is the tag `svs-paillier-binary-proof-v1|` and the numbers written in hexadecimal, each padded to the width of `n²` (fixed, so that numbers of different lengths cannot be cut differently into the same text). The browser (`paillier_encryption_utils.ts`) and the server (`voting_models.py`) compute it independently.

The server also checks that the ballot has **exactly one entry per candidate of the election** (no other, none twice), that every number is in range and invertible modulo `n²` (a malformed number is an invalid proof, not an error), and that the same ballot is not already on the board. All this is CPU work (a few exponentiations of 4096 bits per candidate) and runs in a thread, off the event loop.

**The count.** For each candidate the server computes `S = Π cᵢ` over the valid ballots (starting from 1, so anybody recomputes it), decrypts `m = D(S)`, and publishes `S` and `r = (S · g⁻ᵐ mod n)^(n⁻¹ mod λ) mod n`. Then `rⁿ ≡ S · g⁻ᵐ (mod n²)` holds exactly when `S` decrypts to `m`, so anybody verifies the decryption with the public key; `r` is the randomness of a sum, which says nothing about a ballot or the key. A ballot that is not valid *as a whole* is left out as a whole and reported.

## Threats and where they are tested

Server tests are in `SVS-SERVER/app/tests`, client tests in `SVS-CLIENT/src`.

### Voting and counting

| threat | what stops it | test |
| --- | --- | --- |
| voting twice, including two requests at once | one `UPDATE … WHERE user_has_voted = false` in the transaction of the ballot; the second request gets a 409 | `test_voting.py::TestCasting::test_one_cannot_vote_twice`, `…::test_requests_at_the_same_time_cannot_all_get_through` |
| voting before the opening, after the end, or off the roll | checked on every ballot, with UTC dates | `TestCasting::test_one_cannot_vote_before_the_start`, `…::test_nor_after_the_end`, `…::test_one_must_be_on_the_electoral_roll` |
| **a ballot for several candidates** (every entry a valid 0/1) | the proof on the sum (the tests below fail if that check is removed) | `TestRefusedBallots::test_several_candidates_chosen`, `…::test_every_candidate_chosen` |
| a ballot worth more than 1 for one candidate | the per-entry proof cannot be made for a 2 or a 5 | `TestRefusedBallots::test_an_entry_that_encrypts_something_else_than_0_or_1`, `TestTheProofs` |
| a missing, repeated or unknown candidate; a changed ciphertext; proofs taken from elsewhere; a ballot made for another election | the whole ballot is checked before it is recorded | `TestRefusedBallots` |
| a ballot refused still using up the right to vote | the check comes before the claim on the right to vote | `TestCasting::test_a_refused_ballot_does_not_use_up_the_right_to_vote` |
| copying another voter's ballot from the board | an identical ballot is refused; a changed one needs the randomness | `TestCasting::test_a_ballot_cannot_be_copied_from_the_board` |
| counting while the election is open (and publishing a partial result) | refused before the end | `TestCounting::test_it_cannot_be_counted_before_the_end` |
| a wrong count, a ballot added or removed afterwards, a made-up decryption proof | `audit_election` recomputes from public data | `TestAnybodyCanCheckTheCount`, `test_seed_demo.py::test_the_counted_election_can_be_checked_by_anybody` |
| a forged bulletin written in the database | left out as a whole at the count, and reported | `TestCounting::test_a_forged_bulletin_is_left_out_as_a_whole` |
| the browser and the server disagreeing on a byte of the hashed text | fixtures made by each side, verified by the other; hash test vectors | `test_interop.py`, `paillier.test.ts` |
| changing the candidates while people vote (invalidating every ballot) | candidates are fixed at the opening, and only the vote authority edits them before | `test_access.py::TestTheCandidatesAreFixedWhenTheElectionOpens` |
| an administrator choosing the keys of an election | the update does not accept keys | `test_secrets.py::TestElectionKeys::test_an_administrator_cannot_choose_the_keys_of_an_election` |

### Accounts and sessions

| threat | what stops it | test |
| --- | --- | --- |
| guessing a password or a one-time password | 5 failures lock an account for 15 minutes (the right password included, so a lock cannot be used to find it); wrong codes are counted per address; a code dies after 3 wrong tries | `test_auth.py::TestGuessing`, `TestSigningIn::test_three_wrong_codes_end_the_attempt_even_for_the_right_one` |
| reusing a one-time password; using a sign-in code to reset a password | single use; a code is for one purpose | `TestSigningIn::test_a_one_time_password_works_once`, `TestPasswordReset::test_a_sign_in_code_cannot_reset_a_password` |
| finding who has an account | an unknown user costs the same password check; the same answer for a reset request, and for an inactive account | `TestSigningIn::test_a_wrong_password_and_an_unknown_user_get_the_same_answer`, `TestPasswordReset::test_the_answer_is_the_same_for_an_address_nobody_has` |
| a flood of emails | at most 3 one-time passwords or reset links per account per window | `TestGuessing::test_one_cannot_ask_for_a_stream_of_emails` |
| secrets in the logs | none is logged at any level; a test signs in and fails if one appears | `TestWhatIsLogged::test_no_secret_reaches_the_log` |
| a script in the page stealing the session | the token is in an `HttpOnly` cookie, never in `localStorage` | `auth.test.ts` (nothing is stored; the user is asked to the server) |
| the API answering with secrets | response models list their fields; none is a table model | `test_secrets.py` |
| reading other people's email address and phone number | the account route is for administrators and the account itself; the creator of an election is shown by name | `test_secrets.py::TestWhoseAccount`, `test_access.py::TestWhoCanSeeAnElection` |

### Deployment

| threat | what stops it | test |
| --- | --- | --- |
| running in production with a placeholder secret, a missing key, `*` as CORS origin, a small election key | the application refuses to start, and lists everything that is wrong at once | `test_env.py::TestProduction` |
| secrets printed by a configuration error | `hide_input_in_errors` | `test_env.py::TestWhatAnErrorSays` |
| exposing the database or Redis | an internal Docker network, nothing published, a Redis password | `docker-compose.yml` |
| a stale or mixed API description | `openapi.json` is checked against the code; the client is generated from it | `test_openapi.py` |

## What it does not protect

These are the limits of the design, not bugs to be fixed by a patch.

1. **Ballot secrecy depends on the operator.** The private key of an election is on the server, and so is the key that encrypts it; and the server knows which authenticated voter submitted which ballot. Whoever controls the server (or the database *and* `ENCRYPTION_KEY`) can decrypt any one ballot and say whose it is. What the design gives is that *the application* never decrypts a ballot on its own (it adds ciphertexts and decrypts sums) and that a database copy without the key is useless. Real ballot secrecy against the operator needs (a) threshold decryption, so that no machine holds the key, and (b) ballots that are not tied to a session (blind signatures or anonymous credentials).
2. **Eligibility is not publicly verifiable.** The audit proves that the ballots on the board are valid and that the count is theirs; it cannot prove that each belongs to a person on the roll who voted. A malicious server could add valid ballots (it has the public key). Individual checks exist: the receipt lets a voter find their ballot on the board, and the number of ballots is compared with the number of voters who voted.
3. **No "cast or audit".** The browser encrypts, and a voter cannot verify that it encrypted what they chose. A compromised browser, or a client modified by whoever serves the page, can encrypt a different choice and produce a valid ballot and a valid receipt.
4. **Not coercion-resistant.** The receipt does not reveal the choice, but nothing prevents a voter from voting where somebody watches, and a voter may be forced to reveal their session.
5. **Timing and metadata.** The board shows each bulletin to the hour, not the second; the order of bulletins is the order of voting; the receipt email and the access logs of a reverse proxy can still say *when* a person voted. The compose file turns the proxy's access log off for this reason; the application's own log never names a voter.
6. **Sessions are not revocable**: logging out removes the cookie, a copied token lives until it expires (1 hour by default).
7. **Availability.** Losing `ENCRYPTION_KEY` makes every election uncountable; losing the database loses the votes. There are no backups in the repository.
8. **Rate limiting trusts the forwarded address** only for the proxies listed in `FORWARDED_ALLOW_IPS`; the compose file publishes nothing but Traefik.
9. **The Kubernetes manifest has not been run**, and the dependencies are watched by Dependabot but not scanned in CI.

## For whoever runs it

- Make `ENCRYPTION_KEY` once, keep a copy off the server, and treat it like the key to the ballot box. The database backup and the key backup should not live in the same place.
- Start elections only on a deployment with HTTPS: the browser refuses to hash (`crypto.subtle`) on a page served over plain http, and says so.
- The first count is made by the scheduled job within a minute of the end; run `python -m app.utils.audit <server> <id>` from another machine, and publish the output with the result.
- Ballots cast with an older version of this application (before the proof on the sum) have an old format: the count leaves them out and reports them. Do not upgrade during an election.

## What this review found in the code it started from

The elections already used the right primitives (Paillier, zero-knowledge proofs, a public bulletin board); what was missing was most of what makes them hold. In order of seriousness:

- **The private key of every election was returned to every signed-in user** (the table model was a response model), as was the **password hash** of an account to the administrators of the accounts; an administrator could also **set the keys** of an election through its update.
- A voter could **choose every candidate** at once (no proof on the sum), **vote twice** with two requests at once (read-then-write on the flag), and **vote before the opening**; proofs were checked only at the count, and a bulletin with one bad proof still counted for its other candidates.
- **Counting was possible at any time** and stored the partial result for everybody; the administrators of the accounts could edit the **candidates of an open election**, which invalidates every ballot cast.
- **One-time passwords and tokens were written to the log**, valid for their whole life and reusable; sign-in could be guessed without limit; the defaults of the configuration were secrets anybody could read, with `*` as CORS origin and the session in `localStorage`.
- The creator of an election, with their **email address and phone number**, was sent to every voter; any signed-in user could read any account.
- Smaller: dates in local time stored as UTC, a blocking cache client in async code, the SQL (ballots included) echoed to the log, an unhashable set that crashed `/vote/voted`, every read of an election loading all its ballots, `/vote/12` answered with JSON on a page reload, build output and an editor cache committed to git, a receipt check on a column that does not exist, deployment files that could not run safely.
