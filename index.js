import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import { Server } from "socket.io";
import { createServer } from "http";
import fs from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";
import session from "express-session";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";
import MongoStore from "connect-mongo";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const mongoStore  = MongoStore.create({
  mongoUrl: process.env.DB,
  dbName: 'miniGamesHub',
  collectionName: "sessions",
});

mongoStore.on("error", function (error) {
  console.log(error);
});

const sessionMiddleware = session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  store: mongoStore,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
  },
});

app.use(sessionMiddleware);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.DB);

const LeaderBoard = {
  userName: String,
  score: Number,
};
const Room = {
  roomName: String,
  roomID: String,
  players: [{ id: String, name: String }],
  maxPlayers: Number,
};

const userSchema = new mongoose.Schema({
  name: String,
  userName: String,
  password: String,
  games: mongoose.Schema.Types.Mixed,
});
userSchema.plugin(passportLocalMongoose);

const gameSchema = new mongoose.Schema({
  gameName: String,
  leaderBoard: [LeaderBoard],
  rooms: [Room],
  data: mongoose.Schema.Types.Mixed,
});

const hubSchema = new mongoose.Schema({
  leaderBoard: [{ gameName: String, leaderBoard: [LeaderBoard] }],
  players: [{ id: String, UserName: String }],
  gamesPLayed: [String],
  queue: [String],
});

const User = mongoose.model("User", userSchema);
const Game = mongoose.model("Game", gameSchema);
const Hub = mongoose.model("Hub", hubSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.get("/login", async (req, res) => {
  if (req.isAuthenticated()) return res.redirect("/");
  res.render("forms/login.ejs");
});
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failWithError: true,
  }),
  function (err, req, res, next) {
    res.render("forms/login.ejs", { msg: "wrong username or passoword" });
  }
);
app.get("/signup", async (req, res) => {
  if (req.isAuthenticated()) return res.redirect("/");
  res.render("forms/signup.ejs");
});
app.post("/signup", async function (req, res) {
  let name = req.body.name,
    username = req.body.username,
    pass = req.body.password;
  User.register({ name: name, username: username }, pass, (err, user) => {
    if (err) res.render("forms/signup.ejs", { msg: "username already exists" });
    else res.redirect("/");
  });
});

app.get("/leaderboard", (req, res) => {
  res.render("LeaderBoard.ejs");
});

app.get("/leaderboard/api", async (req, res) => {
  res.json(await Game.find({}).select("gameName leaderBoard").exec());
});
app.get("/SimonGame", async (req, res) => {
  if (!(await Game.findOne({ gameName: "SimonGame" }))) {
    const simonGame = Game({
      gameName: "SimonGame",
      leaderBoard: [
        {
          userName: "AjwadG",
          score: 10,
        },
      ],
      rooms: [],
      data: null,
    });
    simonGame.save();
  }
  res.render("games/SimonGame.ejs");
});

app.post("/SimonGame", (req, res) => {
  res.send(req.body);
});
app.get("/Wordle", async (req, res) => {
  if (!(await Game.findOne({ gameName: "Wordle" }))) {
    const Wordle = Game({
      gameName: "Wordle",
      leaderBoard: [
        {
          userName: "AjwadG",
          score: 10,
        },
        {
          userName: "Ahmad",
          score: 20,
        },
      ],
      rooms: [],
      data: null,
    });
    Wordle.save();
  }
  // console.log(req.originalUrl);
  res.render("games/Wordle/home.ejs");
});

app.get("/Wordle_:wordLenght", (req, res) => {
  const wordLenght = Number(req.params.wordLenght);
  if (!wordLenght || wordLenght < 5 || wordLenght > 8) return res.send({});
  const number = Math.floor(Math.random() * 1000);
  res.render("games/Wordle/game.ejs", { lenght: wordLenght, number });
});
app.post("/Wordle_:wordLenght", (req, res) => {
  if (req.isAuthenticated()) {
    const a = req;
  }
  const { lenght, number, guess, row } = req.body;
  if (!lenght || lenght < 5 || lenght > 8 || number < 0 || number > 1000)
    return res.send([]);
  const word = fs
    .readFileSync(__dirname + `/tmp/Wordle/${lenght}.txt`)
    .toString()
    .split("\n")
    [number].toUpperCase();
  const correct = [];
  for (let i = 0; i < lenght; i++) {
    let state = 0;
    if (word[i] == guess[i]) {
      state = 1;
    } else {
      for (let j = 0; j < lenght; j++) {
        if (guess[i] == word[j]) {
          state = 2;
          break;
        }
      }
    }
    correct.push(state);
  }
  let data = { correct, won: word == guess };
  if (lenght == row) data.word = word;
  res.send(data);
});

app.get("/Trivia", (req, res) => {
  res.render("games/Trivia/home.ejs");
});
app.post("/Trivia", (req, res) => {
  const { category, difficulty, type, token } = req.body;

  res.render("games/Trivia/game.ejs", { category, difficulty, type, token });
});

app.get("/FlappyBird", (req, res) => {
  res.render("games/FlappyBird/home.ejs", {});
});

app.get("/chat", async (req, res) => {
  if (req.isAuthenticated())
    return res.render("Chat/chat.ejs", { name: req.user.name });
  res.render("Chat/home.ejs");
});
app.post("/chat", (req, res) => {
  res.render("Chat/chat.ejs", { name: req.body.name });
});

app.get("/RPS", (req, res) => {
  res.render("games/RPS/game.ejs");
});
app.get("/TTT", (req, res) => {
  res.render("games/TTT/game.ejs");
});

app.get("*", (req, res) => {
  res.redirect("/");
});

server.listen(process.env.PORT, () => {
  console.log(`Server started on port ${process.env.PORT}`);
});

const TTT = io.of("/TTT");
const RPS = io.of("/RPS");

io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});
TTT.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});
RPS.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

RPS.on("connection", (socket) => {
  console.log(socket.client.server.engine.clientsCount);
  socket.on("join_RPS", (id, callBack) => {
    id = id ? id : uuidv4();
    socket.join(id);
    socket.to(id).emit("joined");
    callBack(id);
  });

  socket.on("RPS_pick", (pick, gameID) => {
    socket.to(gameID).emit("RPS_pick", pick, gameID);
  });
});

function isAuthenticated(session) {
  if (session && session.passport && session.passport.user)
    return session.passport.user;
  else false;
}
TTT.on("connection", (socket) => {
  // console.log(socket.client.server.engine.clientsCount);
  const user = isAuthenticated(socket.request.session);
  if (user) {
    console.log("User connected:", user);
  }
  socket.on("join_TTT", (id, callBack) => {
    id = id ? id : uuidv4();
    socket.join(id);
    socket.to(id).emit("joined");
    callBack(id);
  });

  socket.on("TTT_pick", (pick, gameID, turn) => {
    socket.to(gameID).emit("TTT_pick", pick, gameID, turn);
  });
});

io.on("connection", (socket) => {
  // console.log(socket.client.server.engine.clientsCount);
  // console.log(socket.id);
  socket.on("message", (name, message) => {
    socket.broadcast.emit("message", { name, message });
  });
});
