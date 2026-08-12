import os
import sqlalchemy_libsql
import libsql_client.dbapi2
import traceback

libsql_client.dbapi2._connection_handlers["https"] = libsql_client.dbapi2._connection_handlers["wss"]

original_build_url = sqlalchemy_libsql._build_connection_url
def monkey_build_url(url, query, secure):
    res = original_build_url(url, query, secure)
    if res.startswith("wss://"):
        return res.replace("wss://", "https://", 1)
    if res.startswith("ws://"):
        return res.replace("ws://", "http://", 1)
    return res
sqlalchemy_libsql._build_connection_url = monkey_build_url

from sqlalchemy import create_engine

URL = "sqlite+libsql://scms-db-tharunmerupula.aws-ap-south-1.turso.io/?secure=true"
TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODY1NDIxMDcsImlkIjoiMDE5ZmY2MzItYTIwMS03YmEwLTk3OWUtNmE1ODJiZjc2ZjcwIiwia2lkIjoidTllYjVKZ1VBT0JIMmZoQW9WTk55Vmh6VzN2djhfVnVzb2RZYUxGSjF0NCIsInJpZCI6ImNiYWFmYjIwLTY5YzQtNGZiNC1iMDg4LTY4MWI3ZTJiNzEwMSJ9.Nwun3H89dRe6I1yyUyZhc5Dk1taNbHSRMs3y1OpnXte1d_T6-bHTiIHDlUI7ArGJuxtWQRbXdu6M-UEdEXsHAA"

try:
    print(f"Testing monkey-patched connection with https...")
    engine = create_engine(URL, connect_args={"auth_token": TOKEN})
    with engine.connect() as conn:
        print("Success! Connection established using HTTPS via DBAPI2.")
except Exception as e:
    traceback.print_exc()
