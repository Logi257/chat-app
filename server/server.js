import express from "express";
import cors from "cors";
import "dotenv/config";
import http from "http";
import { connectDB } from "./libs/db.js";
import userRouter from "./routes/userRoute.js";
import messageRouter from "./routes/messageRoute.js";
import { Server } from "socket.io";
import { log } from "console";

//Create Express app && Http Server
const app = express();
const server = http.createServer(app);

//Initialize socket.io server
export const io = new Server(server, {
  cors: { origin: "*" },
});

//Store online users
export const userSocketMap = {}; // {userId:socketId}

//Socket.io connection handler
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User Connected", userId);

  if (userId) userSocketMap[userId] = socket.id;

  //Emit online users to all connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("User Disonnected", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

//MiddleWare
app.use(express.json({ limit: "4mb" }));
app.use(cors());

//Routes Setup
app.use("/api/status", (req, res) => res.send("Server is Live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

//Connect to DB

await connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log("Server Started on Port: " + PORT));
