import tkinter as tk

class appView:
    # This class is a GUI Application for the login and registration page. The application uses tkinter for making the
    # window. The window has a fixed size. So does the text, so they are formatted well together.

    # This is the general sizing and appearance customization of the main attributes within the window application
    # What the users see, not the functionality of the system.
    window = tk.Tk(className="Movie Application")
    window.geometry("500x400")
    window.configure(bg="#494d5f")
    #add minimum size 
    window.resizable(0, 0)

    login_frame = tk.Frame(master=window, bg="#FFFFFF")
    login_frame.place(anchor='center', relx=0.5, rely=0.5, relwidth=0.55, relheight=0.55)

    login_title= tk.Label(master=login_frame,text="Login / Register", anchor='center', justify='center', bg="#FFFFFF", font=("Arial", 16))
    #login_title.place(anchor='center', relx=0.5, rely=0.25)
    login_title.pack(pady=10)

    # Requesting username input
    username_title = tk.Label(master=login_frame, text="Username:", bg="#FFFFFF")
    username_title.pack()
    username_entry = tk.Entry(master=login_frame, width=25, border=1.5)
    username_entry.pack(pady=5)

    #Requesting password input
    password_title = tk.Label(master=login_frame, text="Password:", bg="#FFFFFF")
    password_title.pack(pady=5)
    password_entry = tk.Entry(master=login_frame,width=25, show='*', border=1.5)
    password_entry.pack(pady=5)

    # Login button
    login_button = tk.Button(master=login_frame, text="Login")
    login_button.pack(pady=15)

    # Begin the main loop
    window.mainloop()