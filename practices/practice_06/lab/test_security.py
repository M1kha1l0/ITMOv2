"""Security regression tests verifying all vulnerabilities are mitigated."""

import json
import unittest

from service import Shop


class SecurityTest(unittest.TestCase):
    def setUp(self):
        self.shop = Shop()
        self.addCleanup(self.shop.close)

    def request(self, method, path, body=None, headers=None):
        with self.shop.lock:
            return self.shop.dispatch(method, path, body or {}, headers or {})

    def login(self, username="alice", password="learn-alice"):
        status, result = self.request("POST", "/login", {"username": username, "password": password})
        self.assertEqual(status, 200)
        return {"X-Token": result["token"]}

    def test_sqli_in_profile_blocked(self):
        auth = self.login("alice", "learn-alice")
        status, res = self.request("GET", "/profile?id=1%20OR%201=1", headers=auth)
        self.assertEqual(status, 403)

    def test_sqli_in_search_blocked(self):
        auth = self.login("alice", "learn-alice")
        status, res = self.request("GET", "/search?q='%20OR%20'1'='1", headers=auth)
        self.assertEqual(status, 200)
        self.assertEqual(len(res), 0)

    def test_idor_in_profile_blocked(self):
        auth_alice = self.login("alice", "learn-alice")
        status, res = self.request("GET", "/profile?id=2", headers=auth_alice)
        self.assertEqual(status, 403)
        self.assertIn("error", res)

    def test_orders_require_auth(self):
        status, res = self.request("GET", "/orders")
        self.assertEqual(status, 401)

    def test_orders_isolated_per_user(self):
        auth_alice = self.login("alice", "learn-alice")
        auth_bob = self.login("bob", "learn-bob")
        status_a, orders_a = self.request("GET", "/orders", headers=auth_alice)
        self.assertEqual(status_a, 200)
        self.assertEqual(len(orders_a), 1)
        self.assertEqual(orders_a[0]["owner"], 1)

        status_b, orders_b = self.request("GET", "/orders", headers=auth_bob)
        self.assertEqual(status_b, 200)
        self.assertEqual(len(orders_b), 1)
        self.assertEqual(orders_b[0]["owner"], 2)

    def test_price_tampering_blocked(self):
        auth_alice = self.login("alice", "learn-alice")
        status, order = self.request(
            "POST",
            "/orders",
            {"product": "chair", "price": 0.01},
            headers=auth_alice,
        )
        self.assertEqual(status, 201)
        self.assertEqual(order["price"], 5000)

    def test_role_spoofing_in_admin_export_blocked(self):
        # Anonymous with spoofed header
        status, res = self.request("GET", "/admin/export", headers={"X-Role": "staff"})
        self.assertEqual(status, 403)

        # Customer with spoofed header
        auth_alice = self.login("alice", "learn-alice")
        status, res = self.request("GET", "/admin/export", headers={**auth_alice, "X-Role": "staff"})
        self.assertEqual(status, 403)

    def test_path_traversal_and_cross_user_file_access_blocked(self):
        auth_alice = self.login("alice", "learn-alice")

        # Alice attempts to read Bob's receipt
        status, _ = self.request("GET", "/files?user=bob&path=receipt.txt", headers=auth_alice)
        self.assertEqual(status, 403)

        # Alice attempts path traversal to operator note
        status, _ = self.request("GET", "/files?user=../private&path=operator-note.txt", headers=auth_alice)
        self.assertIn(status, (400, 403))

    def test_sensitive_data_in_debug_logs_protected(self):
        # Generate login log entry
        self.login("alice", "learn-alice")

        # Anonymous cannot access logs
        status, _ = self.request("GET", "/debug/logs")
        self.assertEqual(status, 403)

        # Customer cannot access logs
        auth_alice = self.login("alice", "learn-alice")
        status, _ = self.request("GET", "/debug/logs", headers=auth_alice)
        self.assertEqual(status, 403)

        # Staff can access, but passwords and tokens are masked
        auth_staff = self.login("staff", "learn-staff")
        status, logs = self.request("GET", "/debug/logs", headers=auth_staff)
        self.assertEqual(status, 200)
        for entry in logs:
            body = entry.get("body")
            if isinstance(body, dict) and "password" in body:
                self.assertEqual(body["password"], "***")
            headers = entry.get("headers", {})
            if "X-Token" in headers:
                self.assertEqual(headers["X-Token"], "***")

    def test_stored_xss_in_reviews_sanitized(self):
        payload = "<script>alert('XSS')</script>"
        status, _ = self.request("POST", "/reviews", {"product": "chair", "text": payload})
        self.assertEqual(status, 201)

        status, html_content = self.request("GET", "/reviews/view")
        self.assertEqual(status, 200)
        self.assertNotIn("<script>", html_content)
        self.assertIn("&lt;script&gt;alert(&#x27;XSS&#x27;)&lt;/script&gt;", html_content)

    def test_assistant_execute_requires_auth(self):
        status, _ = self.request(
            "POST",
            "/assistant/execute",
            {"decision": {"tool": "read_file", "arguments": {"path": "files/alice/receipt.txt"}}},
        )
        self.assertEqual(status, 401)

    def test_assistant_execute_delete_tree_forbidden_for_customers(self):
        auth_alice = self.login("alice", "learn-alice")
        status, res = self.request(
            "POST",
            "/assistant/execute",
            {"decision": {"tool": "delete_tree", "arguments": {"path": "."}}},
            headers=auth_alice,
        )
        self.assertEqual(status, 403)
        self.assertTrue(self.shop.sandbox.root.exists())

    def test_assistant_execute_export_profiles_forbidden_for_customers(self):
        auth_alice = self.login("alice", "learn-alice")
        status, res = self.request(
            "POST",
            "/assistant/execute",
            {"decision": {"tool": "export_profiles"}},
            headers=auth_alice,
        )
        self.assertEqual(status, 403)

    def test_assistant_execute_read_file_cross_user_forbidden(self):
        auth_alice = self.login("alice", "learn-alice")
        # Alice tries to read Bob's receipt
        status, _ = self.request(
            "POST",
            "/assistant/execute",
            {"decision": {"tool": "read_file", "arguments": {"path": "files/bob/receipt.txt"}}},
            headers=auth_alice,
        )
        self.assertEqual(status, 403)

        # Alice tries path traversal to operator secret
        status, _ = self.request(
            "POST",
            "/assistant/execute",
            {"decision": {"tool": "read_file", "arguments": {"path": "files/alice/../../private/operator-note.txt"}}},
            headers=auth_alice,
        )
        self.assertIn(status, (400, 403))

    def test_assistant_context_requires_auth_and_isolates_orders(self):
        # Anonymous cannot get context
        status, _ = self.request("GET", "/assistant/context?order_id=1")
        self.assertEqual(status, 401)

        # Alice cannot get Bob's order context (order 2)
        auth_alice = self.login("alice", "learn-alice")
        status, res = self.request("GET", "/assistant/context?order_id=2", headers=auth_alice)
        self.assertEqual(status, 200)
        self.assertIn("Заказ: []", res["prompt"])


if __name__ == "__main__":
    unittest.main()
