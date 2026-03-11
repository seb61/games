import tkinter as tk
from login_model import LoginModel

class appView:
    def __init__(self):
        self.login_model = LoginModel()
        # This class is a GUI Application for the login and registration page. The application uses tkinter for making the
        # window. The window has a fixed size. So does the text, so they are formatted well together.

        # This is the general sizing and appearance customization of the main attributes within the window application
        # What the users see, not the functionality of the system.
        self.window = tk.Tk(className="Movie Application")
        self.window.geometry("500x400")
        self.window.configure(bg="#494d5f")
        #add minimum size 
        self.window.resizable(0, 0)

        self.login_frame = tk.Frame(master=self.window, bg="#FFFFFF")
        self.login_frame.place(anchor='center', relx=0.5, rely=0.5, relwidth=0.55, relheight=0.7)

        self.login_title= tk.Label(master=self.login_frame,text="Login / Register", anchor='center', justify='center', bg="#FFFFFF", font=("Arial", 16))
        #login_title.place(anchor='center', relx=0.5, rely=0.25)
        self.login_title.pack(pady=10)

        # Requesting username input
        self.username_title = tk.Label(master=self.login_frame, text="Username:", bg="#FFFFFF")
        self.username_title.pack()
        self.username_entry = tk.Entry(master=self.login_frame, width=25, border=1.5)
        self.username_entry.pack(pady=5)

        #Requesting password input
        self.password_title = tk.Label(master=self.login_frame, text="Password:", bg="#FFFFFF")
        self.password_title.pack(pady=5)
        self.password_entry = tk.Entry(master=self.login_frame,width=25, show='*', border=1.5)
        self.password_entry.pack(pady=5)

        # Login button
        self.login_button = tk.Button(master=self.login_frame, text="Login", command=self.login)
        self.login_button.pack(pady=15)

        #test usernames and passwords
        self.users = {
            "test": "test"
        }

        #message label
        self.message = tk.Label(master=self.login_frame, text="", bg="#FFFFFF")
        self.message.pack()

        # Begin the main loop
        self.window.mainloop()

    #login logic
    def login(self):
        username = self.username_entry.get()
        password = self.password_entry.get()

        if not username or not password:
            self.message.config(text="Enter username and password")
        elif self.login_model.login(username, password):
            self.message.config(text=f"Logged in as {username}")
        else:
            self.message.config(text="Wrong")

appView()