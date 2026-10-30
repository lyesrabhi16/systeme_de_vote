"""Signing in (password, then a one-time password by email), resetting a password, and what is done to stop guessing."""

import re
from types import SimpleNamespace

import pytest
from helpers import PASSWORD, bearer, make_user
from loguru import logger

from app.models.user import SuccessfulUserLoginResponseModel
from app.utils import auth_utils, rate_limit


async def password_step(client, who="ada", password=PASSWORD, **headers):
    return await client.post(
        "/api/auth/login",
        json={"identifier": f"{who}@example.com", "password": password, "identifier_type": "email"},
        **headers,
    )


async def sign_in(client, outbox, who="ada", remember_me=False):
    """The two steps. Answers (the login id, the one-time password, the response of the second step)."""
    first = await password_step(client, who)
    assert first.status_code == 200, first.text
    login_id = first.json()["id"]
    otp = [m for m in outbox if m["function"] == "send_connection_otp_email"][-1]["otp_code"]
    second = await client.post("/api/auth/verify-otp", json={"id": login_id, "otp": otp, "remember_me": remember_me})
    return login_id, otp, second


class TestSigningIn:
    async def test_the_password_then_the_one_time_password_gives_a_token(self, client, outbox):
        await make_user("ada")
        _, otp, second = await sign_in(client, outbox)
        assert second.status_code == 200
        token = second.json()["token"]
        assert client.cookies.get("token") == token
        me = await client.post("/api/auth/user/me", json={}, headers={"Authorization": f"Bearer {token}"})
        assert me.status_code == 200
        assert me.json()["username"] == "ada"
        assert "password" not in me.json()

    async def test_the_cookie_alone_is_enough_to_know_who_is_signed_in(self, client, outbox):
        """The web client never holds the token (it is in an HttpOnly cookie): it asks who it is with no body at all."""
        await make_user("ada")
        await sign_in(client, outbox)
        me = await client.post("/api/auth/user/me")
        assert me.status_code == 200
        assert me.json()["username"] == "ada"

    async def test_nobody_is_known_without_a_token(self, client):
        assert (await client.post("/api/auth/user/me")).status_code == 401

    async def test_the_one_time_password_is_six_capitals_or_digits_and_is_sent_to_the_user(self, client, outbox):
        await make_user("ada")
        await password_step(client)
        (mail,) = outbox
        assert mail["to_email"] == ["ada@example.com"]
        assert re.fullmatch(r"[A-Z0-9]{6}", mail["otp_code"])

    async def test_the_response_to_the_first_step_hides_the_address(self, client):
        await make_user("ada")
        body = (await password_step(client)).json()
        assert body["masked_email"] == "a*a@e*********m"
        assert "ada@example.com" not in str(body)

    async def test_the_code_may_be_typed_in_lower_case(self, client, outbox):
        await make_user("ada")
        first = await password_step(client)
        otp = outbox[-1]["otp_code"]
        second = await client.post("/api/auth/verify-otp", json={"id": first.json()["id"], "otp": f" {otp.lower()} "})
        assert second.status_code == 200

    async def test_a_one_time_password_works_once(self, client, outbox):
        await make_user("ada")
        login_id, otp, second = await sign_in(client, outbox)
        assert second.status_code == 200
        client.cookies.clear()
        again = await client.post("/api/auth/verify-otp", json={"id": login_id, "otp": otp})
        assert again.status_code == 401

    async def test_three_wrong_codes_end_the_attempt_even_for_the_right_one(self, client, outbox):
        await make_user("ada")
        first = await password_step(client)
        login_id, otp = first.json()["id"], outbox[-1]["otp_code"]
        wrong = "AAAAAA" if otp != "AAAAAA" else "BBBBBB"
        statuses = [
            (await client.post("/api/auth/verify-otp", json={"id": login_id, "otp": wrong})).status_code
            for _ in range(3)
        ]
        assert statuses == [401, 401, 403]
        after = await client.post("/api/auth/verify-otp", json={"id": login_id, "otp": otp})
        assert after.status_code == 401  # the code is gone: a new login is needed

    async def test_a_made_up_login_id_is_refused(self, client):
        response = await client.post("/api/auth/verify-otp", json={"id": "x" * 43, "otp": "AAAAAA"})
        assert response.status_code == 400

    async def test_an_inactive_account_gets_no_code_and_no_token(self, client, outbox):
        """It is refused at the password, with the answer of a wrong password: no email is sent, and nothing says the account exists."""
        await make_user("ghost", active=False)
        response = await password_step(client, who="ghost")
        unknown = await password_step(client, who="nobody")
        assert response.status_code == unknown.status_code == 401
        assert response.json() == unknown.json()
        assert outbox == []

    async def test_an_account_turned_off_after_the_password_step_gets_no_token(self, client, outbox):
        user = await make_user("ada")
        first = await password_step(client)
        otp = outbox[-1]["otp_code"]
        user.is_active = False
        await user.save()
        second = await client.post("/api/auth/verify-otp", json={"id": first.json()["id"], "otp": otp})
        assert second.status_code == 403

    async def test_remember_me_makes_the_cookie_last(self, client, outbox):
        await make_user("ada")
        _, _, second = await sign_in(client, outbox, remember_me=True)
        assert "max-age" in second.headers["set-cookie"].lower()
        assert "httponly" in second.headers["set-cookie"].lower()

    async def test_a_wrong_password_and_an_unknown_user_get_the_same_answer(self, client):
        await make_user("ada")
        wrong = await password_step(client, password="not the password")
        unknown = await password_step(client, who="nobody")
        assert wrong.status_code == unknown.status_code == 401
        assert wrong.json() == unknown.json()

    async def test_logging_in_by_ssn_is_no_longer_a_thing(self, client):
        response = await client.post(
            "/api/auth/login", json={"identifier": "1", "password": "x", "identifier_type": "ssn"}
        )
        assert response.status_code == 422

    async def test_an_account_without_a_password_yet_signs_in_with_the_code_alone(self, client, outbox):
        """The first login of an account an administrator created: no password, the one-time password is the factor."""
        await make_user("newbie", password=None)
        first = await client.post(
            "/api/auth/login", json={"identifier": "newbie@example.com", "identifier_type": "email"}
        )
        assert first.status_code == 200
        assert first.json()["first_login"] is True
        otp = outbox[-1]["otp_code"]
        second = await client.post("/api/auth/verify-otp", json={"id": first.json()["id"], "otp": otp})
        assert second.status_code == 200

    async def test_a_password_is_required_once_the_account_has_one(self, client):
        await make_user("ada")
        response = await client.post(
            "/api/auth/login", json={"identifier": "ada@example.com", "identifier_type": "email"}
        )
        assert response.status_code == 401

    async def test_username_and_phone_number_work_too(self, client):
        user = await make_user("ada")
        for kind, identifier in (("username", "ada"), ("phone_number", user.phone_number)):
            response = await client.post(
                "/api/auth/login", json={"identifier": identifier, "password": PASSWORD, "identifier_type": kind}
            )
            assert response.status_code == 200, kind

    async def test_somebody_who_is_signed_in_cannot_sign_in_again(self, client):
        ada = await make_user("ada")
        response = await password_step(client, headers=bearer(ada))
        assert response.status_code == 403

    async def test_an_expired_or_made_up_token_does_not_stop_somebody_from_signing_in(self, client):
        await make_user("ada")
        response = await password_step(client, headers={"Authorization": "Bearer not-a-token"})
        assert response.status_code == 200

    async def test_logging_out_removes_the_cookie(self, client):
        response = await client.post("/api/auth/logout")
        assert response.status_code == 200
        assert "token=" in response.headers["set-cookie"]


class TestGuessing:
    async def test_after_five_failures_the_account_is_locked_for_a_while_even_with_the_right_password(self, client):
        await make_user("ada")
        for _ in range(5):
            assert (await password_step(client, password="wrong")).status_code == 401
        locked = await password_step(client)  # the right one
        assert locked.status_code == 429
        assert int(locked.headers["retry-after"]) > 0
        assert locked.json()["detail"]["code"] == "RATE_LIMIT_EXCEEDED"

    async def test_signing_in_successfully_does_not_use_up_the_attempts(self, client):
        await make_user("ada")
        for _ in range(8):
            assert (await password_step(client)).status_code == 200

    async def test_one_account_locked_does_not_lock_another(self, client):
        await make_user("ada"), await make_user("grace")
        for _ in range(5):
            await password_step(client, password="wrong")
        assert (await password_step(client, who="grace")).status_code == 200

    async def test_too_many_wrong_codes_from_one_address_are_stopped(self, client):
        from app.routers.auth_router import OTP_FAILURES_PER_ADDRESS

        for _ in range(OTP_FAILURES_PER_ADDRESS):
            await client.post(
                "/api/auth/verify-otp", json={"id": "x" * 43, "otp": "AAAAAA"}
            )  # a 400 each: made-up ids do not count
        user = await make_user("ada")
        request = SimpleNamespace(client=SimpleNamespace(host="203.0.113.7"))
        for _ in range(OTP_FAILURES_PER_ADDRESS):
            await rate_limit.count_attempt(request, "otp", None, 900)  # type: ignore[arg-type]
        with pytest.raises(Exception) as error:
            await rate_limit.ensure_below(request, "otp", None, 0, OTP_FAILURES_PER_ADDRESS)  # type: ignore[arg-type]
        assert error.value.status_code == 429  # type: ignore[attr-defined]
        other = SimpleNamespace(client=SimpleNamespace(host="203.0.113.8"))
        await rate_limit.ensure_below(other, "otp", None, 0, OTP_FAILURES_PER_ADDRESS)  # type: ignore[arg-type]
        assert user.id

    async def test_one_cannot_ask_for_a_stream_of_emails(self, client, outbox):
        await make_user("ada")
        login_id = (await password_step(client)).json()["id"]
        statuses = [(await client.post("/api/auth/resend-otp", json={"id": login_id})).status_code for _ in range(5)]
        assert statuses == [200, 200, 200, 429, 429]

    async def test_a_resent_code_replaces_the_first(self, client, outbox):
        await make_user("ada")
        login_id = (await password_step(client)).json()["id"]
        first = outbox[-1]["otp_code"]
        await client.post("/api/auth/resend-otp", json={"id": login_id})
        second = outbox[-1]["otp_code"]
        assert (
            await client.post("/api/auth/verify-otp", json={"id": login_id, "otp": first})
        ).status_code == 401 or first == second
        assert (await client.post("/api/auth/verify-otp", json={"id": login_id, "otp": second})).status_code == 200


class TestPasswordReset:
    async def request_reset(self, client, outbox, email="ada@example.com"):
        response = await client.post("/api/auth/password-reset", json={"email": email})
        assert response.status_code == 200
        mails = [m for m in outbox if m["function"] == "send_password_reset_email"]
        if not mails:
            return None
        query = dict(part.split("=") for part in mails[-1]["url"].split("?")[1].split("&"))
        return query["uid"], query["otp"]

    async def test_a_reset_link_lets_somebody_choose_a_new_password(self, client, outbox):
        await make_user("ada")
        uid, otp = await self.request_reset(client, outbox)
        done = await client.post(
            "/api/auth/password-reset/validate", json={"id": uid, "otp": otp, "password": "a brand new one"}
        )
        assert done.status_code == 200
        assert (await password_step(client, password="a brand new one")).status_code == 200
        assert (await password_step(client, password=PASSWORD)).status_code == 401

    async def test_the_answer_is_the_same_for_an_address_nobody_has(self, client, outbox):
        await make_user("ada")
        known = await client.post("/api/auth/password-reset", json={"email": "ada@example.com"})
        unknown = await client.post("/api/auth/password-reset", json={"email": "nobody@example.com"})
        assert known.status_code == unknown.status_code == 200
        assert known.json() == unknown.json()
        assert len([m for m in outbox if m["function"] == "send_password_reset_email"]) == 1

    async def test_the_new_password_must_be_long_enough(self, client, outbox):
        await make_user("ada")
        uid, otp = await self.request_reset(client, outbox)
        response = await client.post(
            "/api/auth/password-reset/validate", json={"id": uid, "otp": otp, "password": "short"}
        )
        assert response.status_code == 422
        assert (await password_step(client, password=PASSWORD)).status_code == 200  # nothing changed

    async def test_a_reset_link_works_once(self, client, outbox):
        await make_user("ada")
        uid, otp = await self.request_reset(client, outbox)
        body = {"id": uid, "otp": otp, "password": "a brand new one"}
        assert (await client.post("/api/auth/password-reset/validate", json=body)).status_code == 200
        assert (
            await client.post("/api/auth/password-reset/validate", json={**body, "password": "another new one"})
        ).status_code == 401

    async def test_a_sign_in_code_cannot_reset_a_password(self, client, outbox):
        await make_user("ada")
        login_id = (await password_step(client)).json()["id"]
        login_otp = outbox[-1]["otp_code"]
        response = await client.post(
            "/api/auth/password-reset/validate", json={"id": login_id, "otp": login_otp, "password": "a brand new one"}
        )
        assert response.status_code == 401

    async def test_a_reset_code_cannot_sign_somebody_in(self, client, outbox):
        await make_user("ada")
        _, reset_otp = await self.request_reset(client, outbox)
        login_id = (await password_step(client)).json()["id"]
        response = await client.post("/api/auth/verify-otp", json={"id": login_id, "otp": reset_otp})
        assert response.status_code == 401

    async def test_one_cannot_ask_for_a_stream_of_reset_emails(self, client, outbox):
        await make_user("ada")
        statuses = [
            (await client.post("/api/auth/password-reset", json={"email": "ada@example.com"})).status_code
            for _ in range(5)
        ]
        assert statuses == [200, 200, 200, 429, 429]


class TestWhatIsLogged:
    async def test_no_secret_reaches_the_log(self, client, outbox):
        """Not the password, not the one-time password, not the token: whatever the level of the log."""
        await make_user("ada")
        lines: list[str] = []
        sink = logger.add(lines.append, level="DEBUG")
        try:
            login_id, otp, second = await sign_in(client, outbox)
            token = second.json()["token"]
            await client.post("/api/auth/user/me", json={}, headers={"Authorization": f"Bearer {token}"})
            await client.post("/api/auth/user/me", json={"token": token})
            await password_step(client, password="a wrong password")
            await client.post("/api/auth/password-reset", json={"email": "ada@example.com"})
        finally:
            logger.remove(sink)
        text = "\n".join(lines)
        assert text  # the log was captured
        for secret in (PASSWORD, "a wrong password", otp, token, login_id):
            assert secret not in text
        reset_otp = [m for m in outbox if m["function"] == "send_password_reset_email"][-1]["url"].split("otp=")[1]
        assert reset_otp not in text


class TestHelpers:
    @pytest.mark.parametrize(
        "email, masked",
        [
            ("ada@example.com", "a*a@e*********m"),
            ("jo@x.org", "j*@x***g"),
            ("a@b.co", "a@b**o"),
            ("a@b", "a@b"),
        ],
    )
    def test_masking_an_address(self, email, masked):
        assert SuccessfulUserLoginResponseModel.mask_email(email) == masked

    def test_a_password_is_checked_against_its_hash(self):
        hashed = auth_utils.hash_string("secret value")
        assert auth_utils.verify_hash("secret value", hashed)
        assert not auth_utils.verify_hash("Secret value", hashed)
        assert hashed != "secret value"

    def test_a_token_carries_the_user_and_expires(self):
        from app.models.auth_models import JWT_DATA

        token = auth_utils.generate_token(JWT_DATA(id=7), expires_in=60)
        assert auth_utils.verify_token(token).id == 7
        expired = auth_utils.generate_token(JWT_DATA(id=7), expires_in=-5)
        with pytest.raises(ValueError):
            auth_utils.verify_token(expired)
        with pytest.raises(ValueError):
            auth_utils.verify_token(token[:-2] + "xx")
