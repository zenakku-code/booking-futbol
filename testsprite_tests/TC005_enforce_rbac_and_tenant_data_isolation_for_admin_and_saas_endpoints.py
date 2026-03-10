import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

# Credentials based on the instructions file (assumed)
SUPERADMIN_CREDENTIALS = {"email": "test_admin@tikitaka.com", "password": "Password123!"}
NORMAL_USER_CREDENTIALS = {"email": "test_user@tikitaka.com", "password": "Password123!"}
COMPLEX_A_USER_CREDENTIALS = {"email": "complexA_user@tikitaka.com", "password": "Password123!"}

def login_and_get_cookies(credentials):
    login_resp = requests.post(
        f"{BASE_URL}/api/auth/login",
        json=credentials,
        timeout=TIMEOUT
    )
    login_resp.raise_for_status()
    # The JWT cookie is httpOnly => requests stores cookies automatically.
    return login_resp.cookies

def get_authenticated_user_complex_id(cookies):
    me_resp = requests.get(
        f"{BASE_URL}/api/auth/me",
        cookies=cookies,
        timeout=TIMEOUT
    )
    me_resp.raise_for_status()
    user_data = me_resp.json()
    # The user profile should contain their tenant/complex info, here assumed as complexId field
    return user_data.get("complexId")

def test_enforce_rbac_and_tenant_data_isolation_for_admin_and_saas_endpoints():
    # 1) SUPERADMIN can create a complex at /api/saas/complexes
    superadmin_cookies = login_and_get_cookies(SUPERADMIN_CREDENTIALS)
    complex_payload = {"name": "New Complex from Superadmin"}

    create_resp = requests.post(
        f"{BASE_URL}/api/saas/complexes",
        json=complex_payload,
        cookies=superadmin_cookies,
        timeout=TIMEOUT
    )
    assert create_resp.status_code == 201, f"Expected 201 Created for SUPERADMIN, got {create_resp.status_code}"

    created_complex = create_resp.json()
    created_complex_id = created_complex.get("id")

    try:
        # 2) Normal user cannot create a complex (403 Forbidden)
        normal_user_cookies = login_and_get_cookies(NORMAL_USER_CREDENTIALS)
        forbidden_resp = requests.post(
            f"{BASE_URL}/api/saas/complexes",
            json={"name": "Malicious Complex"},
            cookies=normal_user_cookies,
            timeout=TIMEOUT
        )
        assert forbidden_resp.status_code == 403, f"Expected 403 Forbidden for normal user, got {forbidden_resp.status_code}"

        # 3) Normal user tied to complex_A: GET /api/fields returns only their tenant's data
        complexA_cookies = login_and_get_cookies(COMPLEX_A_USER_CREDENTIALS)

        # Get actual complexId of complexA user
        complexA_complex_id = get_authenticated_user_complex_id(complexA_cookies)
        assert complexA_complex_id is not None, "Could not determine complexId for complexA user"

        fields_resp = requests.get(
            f"{BASE_URL}/api/fields",
            cookies=complexA_cookies,
            timeout=TIMEOUT
        )
        assert fields_resp.status_code == 200, f"Expected 200 OK for fields listing, got {fields_resp.status_code}"

        fields_data = fields_resp.json()
        # Each field must belong to the tenant complexA only
        for field in fields_data:
            field_complex_id = field.get("complexId")
            # Use actual complexId from /api/auth/me for this user
            assert field_complex_id == complexA_complex_id, f"Field data leaked: found complexId {field_complex_id} for complexA user expected {complexA_complex_id}"

        # 4) Attempt to GET fields for complex_B with complex_A user; expect 403 or empty list
        fields_complex_b_resp = requests.get(
            f"{BASE_URL}/api/fields?complexId=complex_B",
            cookies=complexA_cookies,
            timeout=TIMEOUT
        )
        assert fields_complex_b_resp.status_code in (200, 403), f"Expected 200 or 403 when accessing other tenant complex, got {fields_complex_b_resp.status_code}"

        if fields_complex_b_resp.status_code == 200:
            data_b = fields_complex_b_resp.json()
            # Should return empty list to prevent data leakage
            assert isinstance(data_b, list), "Expected list response for fields data"
            assert len(data_b) == 0, f"Expected empty list for unauthorized tenant data, got {len(data_b)} items"
    finally:
        # Cleanup: delete complex created by SUPERADMIN if id is available
        if created_complex_id:
            try:
                del_resp = requests.delete(
                    f"{BASE_URL}/api/saas/complexes/{created_complex_id}",
                    cookies=superadmin_cookies,
                    timeout=TIMEOUT
                )
                # Accept 200 OK or 204 No Content on delete success
                assert del_resp.status_code in (200, 204), f"Expected 200 or 204 on complex deletion, got {del_resp.status_code}"
            except Exception as e:
                print(f"Cleanup failed for complex deletion: {e}")

test_enforce_rbac_and_tenant_data_isolation_for_admin_and_saas_endpoints()
