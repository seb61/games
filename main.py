def exit_without_saving() -> bool:
    return input("Are you sure want to exit without saving? Yes/no: ").lower() in ("y", "yes")



def main_loop():

    def is_valid_input(input_str):
        return input_str in ("1", "2", "3", "4", "5", "6") or input_str in ("add", "edit", "remove", "print", "exit and save", "exit without saving")

    while True:
        print(f"1. Add")
        print(f"2. Edit")
        print(f"3. Remove")
        print(f"4. Print")
        print(f"5. Exit and save")
        print(f"6. Exit without saving\n")

        input_str = input("> ").lower()
        if not is_valid_input(input_str):
            print("ERROR: Invalid option\n")
            continue

        match input_str:
            case "1" | "add": # add entry
                pass
            case "2" | "edit": # edit entry
                pass
            case "3" | "remove": # remove
                pass
            case "4" | "print": # print
                pass
            case "5" | "exit and save": # exit
                pass
            case "6" | "exit without saving": # exit without saving
                if exit_without_saving():
                    return


def main(filename):
    
    print(f"Opening database ({filename})")
    print("todo...")
    main_loop()
    #db = read_csv(filename)
    
    


if __name__ == "__main__":
    main("games.csv")


