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

const mongoStore = MongoStore.create({
  mongoUrl: process.env.DB,
  dbName: "miniGamesHub",
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
const games = {
  Wordle: Number,
  TTT: Number,
  RPS: Number,
  FlappyBird: Number,
  SimonGame: Number,
  Trivia: Number,
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
  hub: {
    type: String,
    default: null,
  },
  games: games,
});
userSchema.plugin(passportLocalMongoose);

const gameSchema = new mongoose.Schema({
  gameName: String,
  leaderBoard: [LeaderBoard],
  rooms: [Room],
  data: mongoose.Schema.Types.Mixed,
});

const hubSchema = new mongoose.Schema({
  hubName: String,
  hubCode: String,
  leaderBoard: [{ gameName: String, leaderBoard: [LeaderBoard] }],
  players: [String],
  gamesPLayed: [String],
  queue: [String],
  maxPlayers: Number,
});

const User = mongoose.model("User", userSchema);
const Game = mongoose.model("Game", gameSchema);
const Hub = mongoose.model("Hub", hubSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

async function saveScore(name, gameName, score) {
  if (!(await Game.findOne({ gameName }))) {
    const newGame = Game({
      gameName,
      leaderBoard: [],
      rooms: [],
      data: null,
    });
    newGame.save();
  }
  const user = await User.findOne({ name });
  if (user.games) {
    if (score === true) {
      user.games[gameName] =
        user.games[gameName] != undefined ? user.games[gameName] + 1 : 1;
    } else {
      user.games[gameName] =
        user.games[gameName] == undefined || user.games[gameName] < score
          ? score
          : user.games[gameName];
    }
  } else {
    user.games = { [gameName]: Number(score) };
  }
  await user.save();
  console.log(user.hub);
  const game = await Game.findOne({ gameName });
  if (
    !game.leaderBoard.find((o, i) => {
      if (o.userName === user.username) {
        if (o.score < user.games[gameName] || o.score == undefined)
          o.score = user.games[gameName];
        return true;
      }
    })
  ) {
    game.leaderBoard.push({
      userName: user.username,
      score: user.games[gameName],
    });
  }
  game.save();
}

app.get("/", (req, res) => {
  res.render("index.ejs", { auth: req.isAuthenticated() });
});

app.get("/room", async (req, res) => {
  if (
    req.isAuthenticated() &&
    req.user.hub &&
    (await Hub.findOne({ hubCode: req.user.hub }))
  ) {
    return res.send("<h1> we made it </h1>");
  }
  res.send("<h1> not yet </h1>");
});

app.get("/rooms", (req, res) => {
  if (req.isAuthenticated()) return res.render("rooms.ejs", { type: 0 });
  res.redirect("/");
});
app.post("/rooms", (req, res) => {
  if (req.isAuthenticated()) {
    return res.render("rooms.ejs", { type: req.body.type });
  } else res.redirect("/");
});

app.post("/rooms/api/join", async (req, res) => {
  if (req.isAuthenticated()) {
    await Hub.updateMany(
      { players: req.user.name },
      { $pull: { players: req.user.name } }
    );
    const hub = await Hub.findOne({ hubCode: req.body.hubCode });
    if (hub && hub.maxPlayers > hub.players.length) {
      await User.findOneAndUpdate(
        { username: req.user.username },
        { $set: { hub: req.body.hubCode } }
      );
      hub.players.push(req.user.name);
      await hub.save();
      await Hub.deleteMany({ $or: [{ players: [] }, { players: null }] });
    }
    return res.json(true);
  } else res.status(404).json(false);
});

app.post("/rooms/api/create", async (req, res) => {
  const name = req.body.hubName;
  if (req.isAuthenticated()) {
    await Hub.updateMany(
      { players: req.user.name },
      { $pull: { players: req.user.name } }
    );
    const hubcode = uuidv4();
    const hub = Hub({
      hubName: name,
      hubCode: hubcode,
      leaderBoard: [],
      players: [req.user.name],
      gamesPLayed: [],
      queue: [],
      maxPlayers: Number(req.body.max),
    });
    hub.save();
    await User.findOneAndUpdate(
      { username: req.user.username },
      { $set: { hub: hubcode } }
    );
    await Hub.deleteMany({ $or: [{ players: [] }, { players: null }] });
    return res.json(true);
  } else res.status(404).json(false);
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

app.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/");
    }
  });
});
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
    else res.redirect("/login");
  });
});

app.get("/leaderboard", (req, res) => {
  res.render("LeaderBoard.ejs");
});

app.get("/leaderboard/api", async (req, res) => {
  res.json(await Game.find({}).select("gameName leaderBoard").exec());
});
app.get("/SimonGame", async (req, res) => {
  res.render("games/SimonGame.ejs");
});

app.post("/SimonGame", async (req, res) => {
  if (req.isAuthenticated())
    await saveScore(req.user.name, "SimonGame", req.body.level);

  res.send(req.body);
});
app.get("/Wordle", async (req, res) => {
  // console.log(req.originalUrl);
  res.render("games/Wordle/home.ejs");
});

app.get("/Wordle_:wordLenght", (req, res) => {
  const wordLenght = Number(req.params.wordLenght);
  if (!wordLenght || wordLenght < 5 || wordLenght > 8) return res.send({});
  const number = Math.floor(Math.random() * 1000);
  res.render("games/Wordle/game.ejs", { lenght: wordLenght, number });
});
app.post("/Wordle_:wordLenght", async (req, res) => {
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
  if (req.isAuthenticated() && word == guess) {
    await saveScore(req.user.name, "Wordle", true);
  }
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

app.post("/Trivia/api", async (req, res) => {
  if (req.isAuthenticated()) {
    await saveScore(req.user.name, "Trivia", req.body.score);
  }
  res.json("added");
});

app.get("/FlappyBird", (req, res) => {
  res.render("games/FlappyBird/home.ejs", {});
});

app.post("/FlappyBird/api", async (req, res) => {
  if (req.isAuthenticated()) {
    await saveScore(req.user.name, "FlappyBird", req.body.score);
  }
  res.json("added");
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
app.post("/RPS/api", async (req, res) => {
  if (req.isAuthenticated()) {
    await saveScore(req.user.name, "RPS", req.body.score);
  }
  res.json("added");
});

app.get("/TTT", (req, res) => {
  res.render("games/TTT/game.ejs");
});
app.post("/TTT/api", async (req, res) => {
  if (req.isAuthenticated()) {
    await saveScore(req.user.name, "TTT", req.body.score);
  }
  res.json("added");
});

app.get("/dino", (req, res) => {
  res.render("games/dino/game.ejs");
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
  // console.log(socket.client.server.engine.clientsCount);
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
