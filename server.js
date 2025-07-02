// server.js
// To configure the server port and CORS origin, set PORT and CORS_ORIGIN in your .env file. Defaults: PORT=3000, CORS_ORIGIN='*'.
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: {
      origin:"https://chat-app-production-9bba.up.railway.app",,
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("New client connected");

    socket.on("join-room", ({ roomCode, username }) => {
      socket.join(roomCode);
      socket.to(roomCode).emit("receive-message", {
        text: `${username} joined the chat`,
        sender: "System"
      });
    });

    socket.on("send-message", ({ roomCode, message }) => {
      io.to(roomCode).emit("receive-message", message);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
