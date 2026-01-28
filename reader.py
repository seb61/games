import csv, sys

def read_csv(filename: str):
    with open(filename) as csv_file:
        reader = csv.DictReader(csv_file, delimiter=',')
        for row in reader:
            print(row)

if __name__ == "__main__":
    read_csv(sys.argv[1])

            

