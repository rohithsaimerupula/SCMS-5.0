import asyncio
import libsql_client
import json

URL = "https://scms-db-tharunmerupula.aws-ap-south-1.turso.io"
TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODY1NDIxMDcsImlkIjoiMDE5ZmY2MzItYTIwMS03YmEwLTk3OWUtNmE1ODJiZjc2ZjcwIiwia2lkIjoidTllYjVKZ1VBT0JIMmZoQW9WTk55Vmh6VzN2djhfVnVzb2RZYUxGSjF0NCIsInJpZCI6ImNiYWFmYjIwLTY5YzQtNGZiNC1iMDg4LTY4MWI3ZTJiNzEwMSJ9.Nwun3H89dRe6I1yyUyZhc5Dk1taNbHSRMs3y1OpnXte1d_T6-bHTiIHDlUI7ArGJuxtWQRbXdu6M-UEdEXsHAA"

async def test_https():
    try:
        print("Testing HTTPS via libsql_client.create_client...")
        client = libsql_client.create_client(URL, auth_token=TOKEN)
        async with client:
            rs = await client.execute("SELECT 1")
            print("HTTPS Success!", rs.rows)
    except Exception as e:
        import traceback
        traceback.print_exc()

async def test_wss():
    try:
        print("\nTesting WSS via libsql_client.create_client...")
        client = libsql_client.create_client(URL.replace("https", "wss"), auth_token=TOKEN)
        async with client:
            rs = await client.execute("SELECT 1")
            print("WSS Success!", rs.rows)
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(test_https())
asyncio.run(test_wss())
