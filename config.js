import express from "express";
import bodyParser from "body-parser";
import env from "dotenv";
import rateLimit from "express-rate-limit";
import { Server } from "socket.io";
import http from "http";
import session from "express-session";
import cors from "cors";
import MongoDBStore from 'connect-mongodb-session';

const production = process.env.NODE_ENV === "production";
env.config();

//create app and server
const app = express();
const server = http.createServer(app);

//parse posts
app.use(express.json());

//cors
const corsOptions = {
  origin: production ? process.env.CLIENT_URL : "http://localhost:3001",
};
const io = new Server(server, {
  cors: corsOptions,
});
app.use(cors(corsOptions));

//session store
const store = new MongoDBStore(session)({
  uri: process.env.DB_URL,
  databaseName: "chat-db",
  collection: 'mySessions'
});

//session
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "session-secret",
  resave: true,
  saveUninitialized: true,
  proxy: production,
  store: store,
  cookie: {
    secure: production,
    sameSite: "strict",
    maxAge: 1000 * 60 * 60 * 24 * 30,//1 month
    httpOnly: true,
  }
});
app.use(sessionMiddleware);
io.engine.use(sessionMiddleware);

// Define rate limit rules
const limiter = rateLimit({
  windowMs: 10 * 1000, // 10s
  max: 10,
  message: "Too many requests from this IP, please try again later."
});
app.use(limiter);

export { app, server, io };