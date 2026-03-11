import unittest
import tkinter as tk
from view import appView

class TestView(unittest.TestCase):
    def setUp(self):
        #create an instance like this to skip __init__, taking only the required components
        self.app = appView.__new__(appView)
        self.app.window = tk.Tk()
        self.app.username_entry = tk.Entry(self.app.window)
        self.app.password_entry = tk.Entry(self.app.window)
        self.app.message = tk.Label(self.app.window)
        self.app.users = {"test": "test"}

    def test_empty(self):
        self.app.username_entry.delete(0, tk.END)
        self.app.password_entry.delete(0, tk.END)
        self.app.login()
        self.assertEqual(self.app.message['text'], "Enter username and password")

    def test_correct(self):
        self.app.username_entry.delete(0, tk.END)
        self.app.password_entry.delete(0, tk.END)
        self.app.username_entry.insert(0, "test")
        self.app.password_entry.insert(0, "test")
        self.app.login()
        self.assertEqual(self.app.message['text'], "Logged in as test")

    def test_wrong_pass(self):
        self.app.username_entry.delete(0, tk.END)
        self.app.password_entry.delete(0, tk.END)
        self.app.username_entry.insert(0, "test")
        self.app.password_entry.insert(0, "wrong")
        self.app.login()
        self.assertEqual(self.app.message['text'], "Wrong")

    def test_wrong_user(self):
        self.app.username_entry.delete(0, tk.END)
        self.app.password_entry.delete(0, tk.END)
        self.app.username_entry.insert(0, "unknown")
        self.app.password_entry.insert(0, "pass")
        self.app.login()
        self.assertEqual(self.app.message['text'], "Wrong")

if __name__ == "__main__":
    unittest.main()