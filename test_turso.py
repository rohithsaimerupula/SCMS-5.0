import os
from sqlalchemy import create_engine
import sys

URL = "sqlite+libsql://scms-db-tharunmerupula.aws-ap-south-1.turso.io/?secure=true"
TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODY1NDIxMDcsImlkIjoiMDE5ZmY2MzItYTIwMS03YmEwLTk3OWUtNmE1ODJiZjc2ZjcwIiwia2lkIjoidTllYjVKZ1VBT0JIMmZoQW9WTk55Vmh6VzN2djhfVnVzb2RZYUxGSjF0NCIsInJpZCI6ImNiYWFmYjIwLTY5YzQtNGZiNC1iMDg4LTY4MWI3ZTJiNzEwMSJ9.Nwun3H89dRe6I1yyUyZhc5Dk1taNbHSRMs3y1OpnXte1d_T6-bHTiIHDlUI7ArGJuxtWQRbXdu6M-UEdEXsHAA"

try:
    print(f"Testing connection with auth_token in connect_args...")
    engine = create_engine(URL, connect_args={"auth_token": TOKEN})
    with engine.connect() as conn:
        print("Success! Connection established.")
except Exception as e:
    import traceback
    traceback.print_exc()

try:
    print(f"\nTesting connection with authToken in URL...")
    engine2 = create_engine(f"{URL}&authToken={TOKEN}")
    with engine2.connect() as conn:
        print("Success! Connection established.")
except Exception as e:
    import traceback
    traceback.print_exc()

