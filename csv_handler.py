# 1/28/2026
# CSV Handler Module
# Reads, Writes, and Manipulates CSV Files

import csv
import sys
import os
from typing import List, Dict, Optional

def is_valid_csv(file_path: str) -> bool:
    """Checks if the given file is a valid CSV file."""
    # check if file exists
    if not os.path.exists(file_path):
        return False
    try:
        # try to read the file as CSV
        with open(file_path, mode='r', newline='', encoding='utf-8') as file:
            csv.Sniffer().sniff(file.read(1024))
            return True
    except (csv.Error, UnicodeDecodeError):
        return False

def read_csv(file_path: str) -> Optional[List[Dict]]:
    """Reads a CSV file and returns list of dictionaries."""
    # check if file exists
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found.")
        return None
    
    # check if file is a valid CSV
    if not is_valid_csv(file_path):
        print(f"Error: {file_path} is not a valid CSV file.")
        return None
    
    try:
        # read the CSV file
        with open(file_path, mode='r', newline='', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            data = list(reader)
            return data # return list of dictionaries
    except csv.Error as e:
        print(f"CSV Error: {e}")
        return None
            
def display_csv(file_path: str) -> None:
    """Reads and displays CSV file in formatted table."""
    data = read_csv(file_path)
    if not data:
        return
    
    # headers
    headers = list(data[0].keys())
    print(", ".join(headers))
    
    # rows
    for row in data:
        values = [str(row.get(h, '')) for h in headers]
        print(", ".join(values))

def write_csv(file_path: str, data: List[Dict], fieldnames: List[str]) -> bool:
    """Writes data to a CSV file."""
    try:
        # write the CSV file
        with open(file_path, mode='w', newline='', encoding='utf-8') as file:
            writer = csv.DictWriter(file, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(data)
        print(f"Successfully wrote to {file_path}")
        return True
    except IOError as e:
        print(f"Error writing to {file_path}: {e}")
        return False
    
def append_row(file_path: str, row: Dict) -> bool:
    """Appends a single row to CSV file."""
    # check if file exists
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found.")
        return False
    
    try:
        # append the row to the CSV file
        with open(file_path, mode='a', newline='', encoding='utf-8') as file:
            fieldnames = list(row.keys())
            writer = csv.DictWriter(file, fieldnames=fieldnames)
            writer.writerow(row)
        print(f"Successfully appended row to {file_path}")
        return True
    except IOError as e:
        print(f"Error appending to {file_path}: {e}")
        return False

def update_row(file_path: str, row_id: str, updated_row: Dict) -> bool:
    """Updates a row in CSV file by ID."""
    data = read_csv(file_path)
    if not data:
        return False
    
    found = False
    # search
    for i, row in enumerate(data):
        if row.get('Id') == row_id:
            data[i].update(updated_row)
            found = True
            break
    
    if not found:
        print(f"Error: Row with Id {row_id} not found.")
        return False
    
    fieldnames = list(data[0].keys())
    return write_csv(file_path, data, fieldnames)

def delete_row(file_path: str, row_id: str) -> bool:
    """Deletes a row from CSV file by ID."""
    data = read_csv(file_path)
    if not data:
        return False
    
    original_count = len(data)
    data = [row for row in data if row.get('Id') != row_id] # filter out the row to delete
    
    if len(data) == original_count:
        print(f"Error: Row with Id {row_id} not found.")
        return False
    
    fieldnames = list(data[0].keys()) if data else [] # handle empty case
    return write_csv(file_path, data, fieldnames)

def search_games(file_path: str, search_key: str, search_value: str) -> Optional[List[Dict]]:
    """Searches for games by a specific field."""
    data = read_csv(file_path)
    if not data:
        return None
    
    results = [row for row in data if row.get(search_key) == search_value] # filter rows
    return results if results else None