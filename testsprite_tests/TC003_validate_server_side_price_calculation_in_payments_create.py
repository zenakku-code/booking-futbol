import requests
import json

BASE_URL = "http://localhost:3000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
FIELDS_URL = f"{BASE_URL}/api/fields"
PAYMENTS_CREATE_URL = f"{BASE_URL}/api/payments/create"
TIMEOUT = 30

SUPERADMIN_CREDENTIALS = {
    "email": "test_admin@tikitaka.com",
    "password": "Password123!"
}

def login_as_superadmin():
    resp = requests.post(LOGIN_URL, json=SUPERADMIN_CREDENTIALS, timeout=TIMEOUT)
    resp.raise_for_status()
    # Extract cookies to maintain session
    return resp.cookies

def create_field(cookies):
    field_data = {
        "name": "Test booking placeholder",
        "complexId": "complex_123",
        "metadata": {}
    }
    resp = requests.post(FIELDS_URL, json=field_data, cookies=cookies, timeout=TIMEOUT)
    resp.raise_for_status()
    created = resp.json()
    assert "id" in created and isinstance(created["id"], str)
    return created["id"]

def delete_field(field_id, cookies):
    # No delete endpoint specified in PRD, so skip deletion if none exists
    # Could be implemented if API supports: DELETE /api/fields/{field_id}
    pass

def test_validate_server_side_price_calculation_in_payments_create():
    # Login as SUPERADMIN to obtain session cookie
    cookies = login_as_superadmin()

    booking_id = None
    try:
        # Create a booking/field to get a bookingId (simulate booking creation as field creation)
        # According to the PRD, POST /api/fields creates a field which is used as booking for payment test
        booking_id = create_field(cookies)

        # Test 1: POST /api/payments/create with bookingId and client-supplied amount
        # Expect 200 OK and server-calculated price (preference URL present and amount > client amount)
        payment_payload = {
            "bookingId": booking_id,
            "amount": 1  # Client-supplied amount that should be ignored by server
        }
        resp = requests.post(PAYMENTS_CREATE_URL, json=payment_payload, cookies=cookies, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Expected 200 OK, got {resp.status_code}"
        payment_resp = resp.json()
        # Check that a MercadoPago preference URL or equivalent is present
        # Assuming response contains "preferenceUrl" or "preference" with url
        assert (
            ("preferenceUrl" in payment_resp and isinstance(payment_resp["preferenceUrl"], str)) or
            ("preference" in payment_resp and "init_point" in payment_resp["preference"])
        ), "Missing MercadoPago preference URL in response"

        # The server-side calculation should ignore client amount
        # Check that the returned unit price is greater than the client-supplied amount of 1 if present
        if "preference" in payment_resp:
            preference = payment_resp["preference"]
            # Preference price info could vary; try to confirm unit price > 1 if exists
            # The PRD says "unit price is calculated server-side and is greater than 1"
            # We try to confirm by looking into preference.items
            if "items" in preference and isinstance(preference["items"], list) and len(preference["items"]) > 0:
                unit_price = preference["items"][0].get("unit_price")
                assert isinstance(unit_price, (int, float)) and unit_price > 1, \
                    f"Unit price {unit_price} should be greater than client-supplied amount 1"
        else:
            # If only preferenceUrl exists, skip price check as no price info returned
            pass

        # Test 2: POST /api/payments/create with missing bookingId should return 400 Bad Request
        incomplete_payload = {"amount": 1}
        resp2 = requests.post(PAYMENTS_CREATE_URL, json=incomplete_payload, cookies=cookies, timeout=TIMEOUT)
        assert resp2.status_code == 400, f"Expected 400 Bad Request when bookingId missing, got {resp2.status_code}"

    finally:
        if booking_id:
            delete_field(booking_id, cookies)

test_validate_server_side_price_calculation_in_payments_create()