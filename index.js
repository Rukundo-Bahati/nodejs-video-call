import express from "express";
import http from "http";
import { v4 as uuidv4 } from "uuid";
import { Server } from "socket.io";
import { ExpressPeerServer } from "peer";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

const app = express();
const server = http.createServer(app);

app.set("view engine", "ejs");
app.use(cors());
app.use(express.static("public"));

// Setup Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"],
  },
});

// Setup PeerJS Server
const peerServer = ExpressPeerServer(server, {
  debug: true,
});

app.use("/peerjs", peerServer); // Ensure matching with client path

// Serve a unique room on root URL
app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

// Serve the video chat room
app.get("/:room", (req, res, next) => {
  try {
    res.render("room", { roomId: req.params.room });
  } catch (error) {
    next(error);
  }
});

// Socket.IO handling for users joining/disconnecting
io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    console.log(`User ${userId} joined room ${roomId}`);
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", userId); // Notify others in the room

    socket.on("disconnect", () => {
      console.log(`User ${userId} disconnected from room ${roomId}`);
      socket.to(roomId).emit("user-disconnected", userId); // Notify others
    });

    socket.on("error", (error) => {
      console.error(`Socket error: ${error}`);
    });
  });
});

// Start server on a dynamic port (Railway) or port 3030 for local dev
server.listen(process.env.PORT || 3030, () => {
  console.log(`Server running on port ${process.env.PORT || 3030}`);
});
