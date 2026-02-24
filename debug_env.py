
import os
from dotenv import load_dotenv

load_dotenv()

pw = os.getenv("AWS_DB_PASSWORD")
if pw:
    print(f"Password length: {len(pw)}")
    print(f"Starts with: {pw[0]}")
    print(f"Ends with: {pw[-1]}")
    # Fix the quote issue
    has_quote = "'" in pw
    print(f"Contains ' : {has_quote}")
else:
    print("Password not found in environment.")

user = os.getenv("AWS_DB_USERNAME")
print(f"User: {user}")
