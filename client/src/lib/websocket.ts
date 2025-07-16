const ws = new WebSocket("wss://njuga-server.up.railway.app/ws");

ws.onopen = () => {
  console.log("Connected to WebSocket server");
};

ws.onmessage = (event) => {
  console.log("Received:", event.data);
};

ws.onclose = () => {
  console.log("WebSocket connection closed");
};

export default ws;
