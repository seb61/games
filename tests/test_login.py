import unittest
from login_model import LoginModel

#python -m unittest discover tests

class TestView(unittest.TestCase):
    def setUp(self):
        self.login_model = LoginModel()

    def test_empty(self):
        self.assertFalse(self.login_model.login("",""), "empty")

    def test_correct(self):
        self.assertTrue(self.login_model.login("test","test"), "correct")

    def test_wrong_pass(self):
        self.assertFalse(self.login_model.login("test","wrong"), "wrong pass")

    def test_wrong_user(self):
        self.assertFalse(self.login_model.login("wrong","test"), "wrong user")

if __name__ == "__main__":
    unittest.main()