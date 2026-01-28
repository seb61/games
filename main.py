
def main_loop():

    def is_valid_input(input_str):
        return input_str in ("1", "2", "3", "4", "5", "6")

    while True:
        print(f"1. Add")
        print(f"2. Edit")
        print(f"3. Remove")
        print(f"4. Print")
        print(f"5. Exit and save")
        print(f"6. Exit without saving\n")

        input_str = input("> ")
        if not is_valid_input(input_str):
            print("ERROR: Invalid option\n")
            continue

        match int(input_str):
            case 1: # add entry
                pass
            case 2: # edit entry
                pass
            case 3: # remove
                pass
            case 4: # print
                pass
            case 5: # exit
                pass
            case 6: # exit without saving
                return


def main(filename):
    
    print(f"Opening database ({filename})")
    print("todo...")
    main_loop()
    #db = read_csv(filename)
    
    


if __name__ == "__main__":
    main("games.csv")



