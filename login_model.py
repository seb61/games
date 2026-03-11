class LoginModel:
    def __init__(self):
        #basic for testing, replace later
        self.users = {
            "test": "test"
        }
    
    #login logic
    def login(self, username, password):
        if username in self.users and self.users[username] == password:
            return True
        return False