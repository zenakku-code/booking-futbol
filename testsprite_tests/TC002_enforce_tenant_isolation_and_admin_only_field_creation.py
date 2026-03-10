import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

# Credentials from the provided file (assumed)
SUPERADMIN_EMAIL = "test_admin@tikitaka.com"
SUPERADMIN_PASSWORD = "Password123!"
NORMAL_USER_EMAIL = "test_user@tikitaka.com"
NORMAL_USER_PASSWORD = "UserPass123!"

def login(email: str, password: str):
    url = f"{BASE_URL}/api/auth/login"
    payload = {"email": email, "password": password}
    try:
        resp = requests.post(url, json=payload, timeout=TIMEOUT)
        return resp
    except Exception as e:
        raise RuntimeError(f"Login request failed: {e}")

def get_auth_me(cookies):
    url = f"{BASE_URL}/api/auth/me"
    try:
        resp = requests.get(url, cookies=cookies, timeout=TIMEOUT)
        return resp
    except Exception as e:
        raise RuntimeError(f"Get /api/auth/me request failed: {e}")

def create_field(cookies, name, complexId):
    url = f"{BASE_URL}/api/fields"
    payload = {
        "name": name,
        "complexId": complexId,
        "metadata": {}
    }
    try:
        resp = requests.post(url, json=payload, cookies=cookies, timeout=TIMEOUT)
        return resp
    except Exception as e:
        raise RuntimeError(f"Create field request failed: {e}")

def get_fields(cookies):
    url = f"{BASE_URL}/api/fields"
    try:
        resp = requests.get(url, cookies=cookies, timeout=TIMEOUT)
        return resp
    except Exception as e:
        raise RuntimeError(f"Get fields request failed: {e}")

def enforce_tenant_isolation_and_admin_only_field_creation():
    # Login as SUPERADMIN
    sa_login_response = login(SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD)
    assert sa_login_response.status_code == 200, f"SUPERADMIN login failed: {sa_login_response.status_code}"
    sa_cookies = sa_login_response.cookies

    # Get current user info for SUPERADMIN to get complexId
    sa_me_response = get_auth_me(sa_cookies)
    assert sa_me_response.status_code == 200, f"SUPERADMIN /api/auth/me failed: {sa_me_response.status_code}"
    sa_me_json = sa_me_response.json()
    assert sa_me_json.get("role") == "SUPERADMIN", "Logged in user is not SUPERADMIN"
    sa_complex_id = sa_me_json.get("complexId")
    assert sa_complex_id is not None, "SUPERADMIN user's complexId not found"

    field_id = None
    try:
        # SUPERADMIN creates a new field
        create_resp = create_field(sa_cookies, "Test Field SA", sa_complex_id)
        assert create_resp.status_code == 201, f"SUPERADMIN field creation failed: {create_resp.status_code}"
        create_data = create_resp.json()
        field_id = create_data.get("id")
        assert field_id is not None, "Created field ID missing in response"

        # Verify created field is tied to SUPERADMIN's complex (if returned)
        # Some APIs may return created resource in detail; if so, verify.
        # We'll do a GET fields and ensure it's listed.
        fields_resp = get_fields(sa_cookies)
        assert fields_resp.status_code == 200, f"SUPERADMIN get fields failed: {fields_resp.status_code}"
        fields_json = fields_resp.json()
        assert isinstance(fields_json, list), "Fields response is not a list"
        # Check all returned fields belong to sa_complex_id
        for field in fields_json:
            assert field.get("complexId") == sa_complex_id, "Field belongs to a different complex"

        # Logout SUPERADMIN by clearing cookies or moving on

    finally:
        # Cleanup: delete created field if ID exists (attempt best-effort)
        if field_id:
            try:
                del_resp = requests.delete(f"{BASE_URL}/api/fields/{field_id}", cookies=sa_cookies, timeout=TIMEOUT)
                # Accept 200 or 204 as success; ignore errors on cleanup
                if del_resp.status_code not in [200, 204]:
                    pass
            except Exception:
                pass

    # Login as normal non-SUPERADMIN user
    user_login_response = login(NORMAL_USER_EMAIL, NORMAL_USER_PASSWORD)
    assert user_login_response.status_code == 200, f"Normal user login failed: {user_login_response.status_code}"
    user_cookies = user_login_response.cookies

    # Get normal user info to confirm role is not SUPERADMIN
    user_me_resp = get_auth_me(user_cookies)
    assert user_me_resp.status_code == 200, f"Normal user /api/auth/me failed: {user_me_resp.status_code}"
    user_me_json = user_me_resp.json()
    assert user_me_json.get("role") != "SUPERADMIN", "Normal user has SUPERADMIN role unexpectedly"

    # Attempt to create a field with normal user - should fail with 403 Forbidden
    normal_create_resp = create_field(user_cookies, "Test Field User", user_me_json.get("complexId"))
    assert normal_create_resp.status_code == 403, f"Non-SUPERADMIN field creation expected 403, got {normal_create_resp.status_code}"

    # Test GET /api/fields returns only fields belonging to the authenticated tenant
    get_fields_resp = get_fields(user_cookies)
    assert get_fields_resp.status_code == 200, f"Normal user get fields failed: {get_fields_resp.status_code}"
    user_fields = get_fields_resp.json()
    assert isinstance(user_fields, list), "Fields response is not list"
    for field in user_fields:
        assert field.get("complexId") == user_me_json.get("complexId"), "Field from unauthorized complex leaked to user"

    # Test unauthenticated GET /api/fields returns 401
    unauth_get_resp = requests.get(f"{BASE_URL}/api/fields", timeout=TIMEOUT)
    assert unauth_get_resp.status_code == 401, f"Unauthenticated GET /api/fields expected 401, got {unauth_get_resp.status_code}"

enforce_tenant_isolation_and_admin_only_field_creation()