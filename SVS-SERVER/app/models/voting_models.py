from pydantic import BaseModel


class BinaryZKProofModel(BaseModel):
    a0: str
    a1: str
    e0: str
    e1: str
    z0: str
    z1: str

    def _fs_hash(self, values: list[int], challenge_mask: int) -> int:
        import hashlib

        combined = ""
        for v in values:
            # v.toString(16) in JS is hex(v)[2:] in Python
            # padStart(512, "0") ensures each number occupies 512 chars
            hex_val = hex(v)[2:].lower().zfill(512)
            combined += hex_val

        # TextEncoder.encode() defaults to UTF-8
        data = combined.encode("utf-8")

        # SHA-256
        hash_hex = hashlib.sha256(data).hexdigest()

        # Convert to BigInt and apply the same CHALLENGE_MASK
        return int(hash_hex, 16) & challenge_mask

    # Replace this with your actual CHALLENGE_MASK value from TypeScript

    def verify(self, public_key, ciphertext: int) -> bool:
        from loguru import logger

        logger.debug(
            f"Verifying ZK Proof with public key n={public_key.n}, g={public_key.g}, ciphertext={ciphertext}"
        )
        # e.g., (1 << 128) - 1
        CHALLENGE_MASK = (1 << 128) - 1

        n = public_key.n
        g = public_key.g
        n_sq = n**2

        # Extract integer values
        a0, a1 = int(self.a0), int(self.a1)
        e0, e1 = int(self.e0), int(self.e1)
        z0, z1 = int(self.z0), int(self.z1)

        # 1. Recompute the Total Challenge 'e' exactly like the frontend
        # Order matters: n, g, ciphertext, a0, a1
        e_total = self._fs_hash([n, g, ciphertext, a0, a1], CHALLENGE_MASK)

        # 2. Verify Challenge Split: e == (e0 XOR e1) & MASK
        if (e0 ^ e1) != e_total:
            logger.error(
                f"Challenge mismatch: e0 XOR e1 = {e0 ^ e1} does not equal total challenge {e_total}"
            )
            return False

        # 3. Verify Branch 0: z0^n ≡ a0 * c^e0 (mod n^2)
        left0 = pow(z0, n, n_sq)
        right0 = (a0 * pow(ciphertext, e0, n_sq)) % n_sq
        if left0 != right0:
            logger.error(
                f"Branch 0 verification failed: left = {left0}, right = {right0}"
            )
            return False

        # 4. Verify Branch 1: z1^n ≡ a1 * (c/g)^e1 (mod n^2)
        g_inv = pow(g, -1, n_sq)
        c_over_g = (ciphertext * g_inv) % n_sq
        left1 = pow(z1, n, n_sq)
        right1 = (a1 * pow(c_over_g, e1, n_sq)) % n_sq
        if left1 != right1:
            logger.error(
                f"Branch 1 verification failed: left = {left1}, right = {right1}"
            )
            return False
        return left1 == right1


class VoteCastContentModel(BaseModel):
    candidate_id: int
    encrypted_value: str
    proof: BinaryZKProofModel


class VoteCastData(BaseModel):
    content: list[VoteCastContentModel]
