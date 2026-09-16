import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from database import normalize_role_from_user_row


class RoleNormalizationTests(unittest.TestCase):
    def test_cooperative_leader_role_is_preserved(self):
        row = {
            'role': 'cooperative_leader',
            'is_cooperative_member': 1,
            'cooperative_id': 7,
        }
        self.assertEqual(normalize_role_from_user_row(row), 'cooperative_leader')

    def test_cooperative_farmer_role_is_cooperative(self):
        row = {
            'role': 'farmer',
            'is_cooperative_member': 1,
            'cooperative_id': 7,
        }
        self.assertEqual(normalize_role_from_user_row(row), 'cooperative')

    def test_regular_farmer_role_stays_farmer(self):
        row = {
            'role': 'farmer',
            'is_cooperative_member': 0,
            'cooperative_id': None,
        }
        self.assertEqual(normalize_role_from_user_row(row), 'farmer')


if __name__ == '__main__':
    unittest.main()
