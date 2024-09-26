import express from "express";
import http from "http";
import { v4 as uuidv4 } from "uuid";
import { Server } from "socket.io";
import { ExpressPeerServer } from "peer";
import cors from 'cors'
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

const app = express();
const server = http.createServer(app);

app.set("view engine", "ejs");
app.use(cors())
app.use(express.static("public"));

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*", // Use environment variable for security
    methods: ["GET", "POST"],
  },
});

const peerServer = ExpressPeerServer(server, {
  debug: true,
});

app.use("/peer.js", peerServer);

app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

app.get("/:room", (req, res, next) => {
  try {
    res.render("room", { roomId: req.params.room });
  } catch (error) {
    next(error);
  }
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", userId);

    socket.on("disconnect", () => {
      console.log(`User ${userId} disconnected from room ${roomId}`);
      socket.to(roomId).emit("user-disconnected", userId);
    });

    socket.on("error", (error) => {
      console.error(`Socket error: ${error}`);
    });
  });
});

server.listen(process.env.PORT || 3030, () => {
  console.log(`Running on port ${process.env.PORT || 3030}`);
});
