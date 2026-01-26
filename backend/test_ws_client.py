import asyncio
import websockets
import json

async def hello():
    uri = "ws://localhost:8000/ws/live/TEST_LOC_01"
    async with websockets.connect(uri) as websocket:
        print(f"Connected to {uri}")
        try:
            # Wait for 1 message then exit successfully
            message = await asyncio.wait_for(websocket.recv(), timeout=30)
            print(f"MESSAGE_RECEIVED: {message}")
        except asyncio.TimeoutError:
            print("Timeout waiting for message")

if __name__ == "__main__":
    asyncio.run(hello())
