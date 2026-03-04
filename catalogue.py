import pickle
import os.path
from enum import Enum

class Entry:
    # Probably a better way of doing this
    def __init__(self, movie_title: str, release_year: int, rating: float = -1, genre: str = None):
        self.movie_title = movie_title

        # TODO: runtime errors are not suitable for this program; use proper checks
        assert release_year >= 1950 and release_year <= 2027, f"invalid release year: {release_year}"
        self.release_year = release_year

        assert rating <= 5, f"rating cannot be greater than 5 (have {rating})"
        self.rating = rating
        self.genre = genre 

    def __str__(self):
        return f"{self.movie_title} ({self.release_year})\trating: {self.rating}, genre: {self.genre}"

    # TODO: use built in str method
    def contains(self, string):
        return string in f"{self.movie_title} {self.release_year} {self.rating} {self.genre}"


class Catalogue:
    DB_FILE = "db.pkl"

    def add_entry(self, entry: Entry):
        # hash based on movie title
        movie_title = entry.movie_title
        if movie_title not in self.data:
            self.data[movie_title] = entry

    def search_keyword(self, keyword) -> tuple:
        if not keyword:
            return None

        res = []
        for entry in self.data.values():
            if entry.contains(keyword):
                res.append(entry)
        return res

    def search(self, entry: Entry) -> bool:
        # TODO: remove dupe code in add_entry
        return entry.movie_title in self.data

    def __init__(self):
        self.data = {}

        if os.path.isfile(self.DB_FILE):
            self.load()

    def save(self):
        with open(self.DB_FILE, "wb") as file:
            pickle.dump(self.data, file)

    def load(self):
        with open(self.DB_FILE, "rb") as file:
            self.data = pickle.load(file)

def main():
    def main_prompt():
        print("1. Add an entry")
        print("2. Edit an entry")
        print("3. Delete an entry")
        print("4. Search for an entry")
        print("5. Display entries")
        print("6. Save")
        print("7. Quit")

    def entry_prompt(prompt, ok_if_empty=False, default=None) -> str:
        res = input(prompt)
        return default if (not ok_if_empty and not res) else res

    def search_prompt() -> str:
        return input("Enter movie title: ")

    def add_entry_prompt() -> Entry:
        # bad bad bad, but sample code. Real project will have frontend deal with this
        title = entry_prompt("movie title: ")
        if not title:
            print("Invalid title")
            return None

        release_year = entry_prompt("Release year: ")
        if not release_year:
            print("Invalid release year")
            return None

        release_year = int(release_year)

        rating = input("Rating (0-5): ")
        if not rating:
            rating = -1
        else:
            rating = float(rating)

        # ignore the enum for now
        genre = input("Genre (default: none): ")
        if not genre:
            genre = ""

        return Entry(title, release_year, rating, genre)

    catalogue = Catalogue() 

    main_prompt()
    while True:
        choice = input("> ").lower()
        match choice:
            case "1" | "add":
                # not good lol
                entry = add_entry_prompt()
                if entry != None:
                    if catalogue.search(entry):
                        print(f"Error: cannot add \"{entry.movie_title}\": entry already exists in database")
                    else:
                        catalogue.add_entry(entry)
                        print(f"Added entry: {entry}")
            case "2" | "edit": # edit
                res = search_prompt()
                if res and res in catalogue.data:
                    print("Enter new entry data: \n")
                    entry = add_entry_prompt()
                    if entry != None:
                        if entry.movie_title != res:
                            del catalogue.data[res]
                        catalogue.add_entry(entry)

                        print(f"Updated entry: {entry}")
                else:
                    print(f"Error: \"{res}\" not found in database")

            case "3" | "search": # search
                res = catalogue.search_keyword(input("Enter keyword to search for: "))
                if res:
                    print(f"Found {len(res)} matches:")
                    for item in res:
                        print(item)
                else:
                    print("no results found")

            case "4" | "delete": # delete
                # Yucky
                res = search_prompt()
                if res and res in catalogue.data:
                    entry = catalogue.data[res]
                    print(f"Found entry: {entry}")
                    confirm = input("Delete? Y/N: ").lower()
                    if confirm == "y" or confirm == "yes":
                        del catalogue.data[res]
                        print(f"Deleted entry: {entry}")
                else:
                    print(f"Error: \"{res}\" not found in database")

            case "5" | "print" | "display" | "list": # display
                for entry in catalogue.data.values():
                    print(entry)

            case "6" | "save":
                 catalogue.save()

            case "7" | "quit" | "exit":
                res = input("Save changes? Y/N: ").lower()
                if res == "y" or res == "yes":
                    catalogue.save()
                    return
                else:
                    res = input("Quit without saving? Y/N").lower()
                    if res == "y" or res == "yes":
                        return

            case _: 
                print("invalid choice")
                main_prompt()
                continue
        print()
if __name__ == "__main__":
    main()
