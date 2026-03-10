import requests
import hmac
import hashlib
import json

BASE_URL = "http://localhost:3000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
WEBHOOK_URL = f"{BASE_URL}/api/webhooks/mercadopago"

# Credentials from the referenced security guidelines file for SUPERADMIN user
SUPERADMIN_EMAIL = "test_admin@tikitaka.com"
SUPERADMIN_PASSWORD = "Password123!"

# This secret should match process.env.MP_WEBHOOK_SECRET on server side,
# for demo purposes we define it statically here.
MP_WEBHOOK_SECRET = "very_secret_webhook_key"

def login_get_session_cookie(email, password):
    resp = requests.post(
        LOGIN_URL,
        json={"email": email, "password": password},
        timeout=30
    )
    resp.raise_for_status()
    # Extract httpOnly session cookie containing JWT
    cookies = resp.cookies.get_dict()
    assert any("jwt" in k.lower() for k in cookies.keys()), "JWT cookie not present"
    return cookies

def generate_hmac_signature(secret, body_bytes):
    return hmac.new(secret.encode(), body_bytes, hashlib.sha256).hexdigest()

def test_verify_mercadopago_webhook_authenticity_and_sandbox_exception():
    # 1. Login to get session cookie (not strictly needed for the webhook, but following instructions)
    login_cookies = login_get_session_cookie(SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD)

    headers = {
        "Content-Type": "application/json"
    }

    # a) Valid signed live payload
    live_payload = {"id": "987654", "status": "approved", "live_mode": True}
    # Use consistent serialization for signature and raw data
    live_payload_str = json.dumps(live_payload, separators=(',', ':'), sort_keys=True)
    live_payload_bytes = live_payload_str.encode()

    signature = generate_hmac_signature(MP_WEBHOOK_SECRET, live_payload_bytes)
    headers["x-signature"] = signature

    resp = requests.post(
        WEBHOOK_URL,
        data=live_payload_bytes,
        headers=headers,
        timeout=30
    )
    assert resp.status_code == 200, f"Expected 200 OK for valid signed live payload, got {resp.status_code}"

    # b) Sandbox payload without x-signature header - should be accepted (200 OK)
    sandbox_payload = {"id": "123456", "live_mode": False}
    resp = requests.post(
        WEBHOOK_URL,
        json=sandbox_payload,
        headers={"Content-Type": "application/json"},  # no x-signature
        timeout=30
    )
    assert resp.status_code == 200, f"Expected 200 OK for sandbox payload without signature, got {resp.status_code}"

    # c) Live payload without x-signature header - should be rejected 403 Forbidden with message "Invalid signature"
    live_payload_no_sig = {"id": "123456", "status": "approved", "live_mode": True}
    resp = requests.post(
        WEBHOOK_URL,
        json=live_payload_no_sig,
        headers={"Content-Type": "application/json"},
        timeout=30
    )
    assert resp.status_code == 403, f"Expected 403 Forbidden for live payload without signature, got {resp.status_code}"
    try:
        error_json = resp.json()
        assert (
            "Invalid signature" in error_json.get("message", "")
        ), "Expected error message to contain 'Invalid signature'"
    except Exception:
        # If response is not JSON or missing field
        assert False, "Response for invalid signature does not contain expected JSON error message"

    # d) Live payload with invalid signature - also rejected 403 Forbidden
    invalid_signature_headers = {
        "Content-Type": "application/json",
        "x-signature": "invalidsignature123"
    }
    resp = requests.post(
        WEBHOOK_URL,
        json=live_payload_no_sig,
        headers=invalid_signature_headers,
        timeout=30
    )
    assert resp.status_code == 403, f"Expected 403 Forbidden for live payload with invalid signature, got {resp.status_code}"
    try:
        error_json = resp.json()
        assert (
            "Invalid signature" in error_json.get("message", "")
        ), "Expected error message to contain 'Invalid signature'"
    except Exception:
        assert False, "Response for invalid signature does not contain expected JSON error message"


test_verify_mercadopago_webhook_authenticity_and_sandbox_exception()
