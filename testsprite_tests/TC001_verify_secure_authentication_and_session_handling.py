import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

# Credentials as per the provided guidelines file
VALID_EMAIL = "test_admin@tikitaka.com"
VALID_PASSWORD = "Password123!"
INVALID_EMAIL = "invalid@example.com"
INVALID_PASSWORD = "wrong"


def test_verify_secure_authentication_and_session_handling():
    session = requests.Session()

    # 1. Test login with valid credentials
    login_payload_valid = {"email": VALID_EMAIL, "password": VALID_PASSWORD}
    login_response = session.post(
        f"{BASE_URL}/api/auth/login",
        json=login_payload_valid,
        timeout=TIMEOUT,
    )
    assert login_response.status_code == 200, f"Expected 200 but got {login_response.status_code}"
    # Validate presence of cookie with JWT (session cookie)
    cookies = login_response.cookies
    assert any(
        cookie.value and 'jwt' in cookie.name.lower() for cookie in cookies
    ), "httpOnly JWT cookie not found in login response"

    # 2. Test access to /api/auth/me with authenticated session
    me_response = session.get(f"{BASE_URL}/api/auth/me", timeout=TIMEOUT)
    assert me_response.status_code == 200, f"Expected 200 but got {me_response.status_code}"
    user_data = me_response.json()
    # Validate that the user profile has the role SUPERADMIN
    assert "role" in user_data, "Missing role in user profile"
    assert user_data["role"].upper() == "SUPERADMIN", f"Expected role SUPERADMIN but got {user_data['role']}"

    # 3. Test login with invalid credentials
    session_invalid = requests.Session()
    login_payload_invalid = {"email": INVALID_EMAIL, "password": INVALID_PASSWORD}
    login_invalid_response = session_invalid.post(
        f"{BASE_URL}/api/auth/login",
        json=login_payload_invalid,
        timeout=TIMEOUT,
    )
    assert login_invalid_response.status_code == 401, f"Expected 401 but got {login_invalid_response.status_code}"

    # 4. Test access to /api/auth/me without authentication
    session_no_auth = requests.Session()
    me_no_auth_response = session_no_auth.get(f"{BASE_URL}/api/auth/me", timeout=TIMEOUT)
    assert me_no_auth_response.status_code == 401, f"Expected 401 but got {me_no_auth_response.status_code}"


test_verify_secure_authentication_and_session_handling()
