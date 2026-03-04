import tkinter as tk

class appView:
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

    username_title = tk.Label(master=login_frame, text="Username:", bg="#FFFFFF")
    username_title.pack()
    username_entry = tk.Entry(master=login_frame, width=25, border=1.5)
    username_entry.pack(pady=5)

    password_title = tk.Label(master=login_frame, text="Password:", bg="#FFFFFF")
    password_title.pack(pady=5)
    password_entry = tk.Entry(master=login_frame,width=25, show='*', border=1.5)
    password_entry.pack(pady=5)

    login_button = tk.Button(master=login_frame, text="Login")
    login_button.pack(pady=15)

    window.mainloop()