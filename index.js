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
import { setTimeout } from "timers/promises";
import { checkPrime } from "crypto";

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
  tries: {
    type: String,
    default: 3,
  },
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
  maxPlayers: Number,
});

const hubSchema = new mongoose.Schema({
  hubName: String,
  hubCode: String,
  leaderBoard: [{ gameName: String, leaderBoard: [LeaderBoard] }],
  state: {
    type: String,
    default: "wating",
  },
  currentGame: {
    type: String,
    default: "room",
  },
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
  res.render("pages/index.ejs", { auth: req.isAuthenticated() });
});
app.get("/home", (req, res) => {
  res.render("test.ejs");
});

app.get("/room", async (req, res) => {
  if (req.isAuthenticated() && req.user.hub) {
    const hub = await Hub.findOne({ hubCode: req.user.hub });
    if (hub) {
      if (!hub.queue[0]) {
        if (cheackGames(hub)) {
          hub.state = "done";
          await hub.save();
        }
        return res.render("LeaderBoard.ejs", { hub: hub.hubName });
      }
      return res.render("rooms/room.ejs", {
        hubCode: req.user.hub,
        full: hub.maxPlayers == hub.players.length,
        next: hub.queue[0],
      });
    }
  }
  res.redirect("/rooms");
});
app.post("/room", async (req, res) => {
  if (req.isAuthenticated() && req.user.hub) {
    const hub = await Hub.findOne({ hubCode: req.user.hub });
    if (hub) return res.json(hub);
  }
  res.json(false);
});
app.get("/room/api", async (req, res) => {
  if (req.isAuthenticated() && req.user.hub) {
    const hub = await Hub.findOne({ hubCode: req.user.hub });
    if (hub) return res.json(hub.leaderBoard);
  }
  res.json(false);
});

app.get("/rooms", async (req, res) => {
  if (req.isAuthenticated()) {
    const hub = await Hub.findOne({ hubCode: req.user.hub });
    return res.render("rooms/rooms.ejs", { type: 0, member: hub != null });
  }
  res.redirect("/");
});
app.post("/rooms", (req, res) => {
  if (req.isAuthenticated()) {
    return res.render("rooms/rooms.ejs", { type: req.body.type });
  } else res.redirect("/");
});

app.post("/hub", async (req, res) => {
  const { score, gameName } = req.body;
  if (req.isAuthenticated()) {
    const hub = await Hub.findOne({
      hubCode: req.user.hub,
      players: req.user.name,
    });
    if (hub && hub.state == "started") {
      if (hub.state == "done") return res.json(false);
      let game = hub.leaderBoard.filter(
        (element) => element.gameName == gameName
      )[0];
      if (game) game = game.leaderBoard;
      else return res.json(false);
      const index = game.findIndex(
        (element) => element.userName == req.user.name
      );
      if (index != -1) {
        const record = game[index];
        if (score == true) record.score++;
        else record.score = record.score < score ? score : record.score;
        if (record.tries > 0) {
          record.tries--;
        }
        await hub.save();
        return res.json(record.tries <= 0);
      }
      return res.json(false);
    }
    await User.findOneAndUpdate(
      { username: req.user.username },
      { $set: { hub: null } }
    );
    return res.json(false);
  }
  res.json(false);
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
    const queue = (await Game.find({ maxPlayers: 1 })).map((a) => a.gameName);
    const hub = Hub({
      hubName: name,
      hubCode: hubcode,
      leaderBoard: [],
      players: [req.user.name],
      gamesPLayed: [],
      queue: queue,
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
      state = 2;
    } else {
      for (let j = 0; j < lenght; j++) {
        if (guess[i] == word[j]) {
          state = 1;
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
  if (lenght == row) {
    data.word = word;
  }
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
const room = io.of("/room");

io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});
TTT.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});
RPS.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});
room.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

function cheackGames(hub, name) {
  const played = hub.gamesPLayed.length;
  const games = hub.leaderBoard;
  for (let i = 0; i < played; i++) {
    for (let j = 0; j < games[i].leaderBoard.length; j++) {
      if (
        Number(games[i].leaderBoard[j].tries) > 0 &&
        (games[i].leaderBoard[j].userName == name || name == undefined)
      )
        return false;
    }
  }
  return true;
}
room.on("connection", async (socket) => {
  const user = await isAuthenticated(socket.request.session);
  const hub = await Hub.findOne({ hubCode: user.hub });
  if (cheackGames(hub, user.name)) {
    socket.join(user.hub);
    if (
      hub.leaderBoard.filter((game) => game.gameName === hub.queue[0]).length ==
      0
    ) {
      hub.leaderBoard.push({ gameName: hub.queue[0], leaderBoard: [] });
    }
    const index = hub.leaderBoard.findIndex(
      (element) => element.gameName === hub.queue[0]
    );
    if (index != -1) {
      const i = hub.leaderBoard[index].leaderBoard.findIndex(
        (element) => element.userName === user.name
      );
      if (i == -1) {
        hub.leaderBoard[index].leaderBoard.push({
          userName: user.name,
          score: 0,
        });
      }
      await hub.save();
    }
    room.to(user.hub).emit("player_joined", user.name);
  } else {
    socket.emit("returnToGame", hub.currentGame);
  }

  socket.on("disconnect", async () => {
    const hub = await Hub.findOne({ hubCode: user.hub });
    socket.leave(user.hub);
    if (hub.state == "wating") {
      let index = hub.leaderBoard.findIndex(
        (element) => element.gameName === hub.queue[0]
      );
      if (index !== -1) {
        const i = hub.leaderBoard[index].leaderBoard.findIndex(
          (element) => element.userName === user.name
        );
        if (i !== -1) hub.leaderBoard[index].leaderBoard.splice(i, 1);
      }
      hub.save();
      room.to(user.hub).emit("player_joined", user.name);
    }
  });

  socket.on("start_game", async () => {
    const hub = await Hub.findOne({ hubCode: user.hub });
    const index = hub.leaderBoard.findIndex(
      (element) => element.gameName === hub.queue[0]
    );
    if (
      index != -1 &&
      hub.maxPlayers == hub.leaderBoard[index].leaderBoard.length
    ) {
      hub.state = "started";
      hub.gamesPLayed.push(hub.queue[0]);
      hub.currentGame = hub.queue[0];
      hub.queue.splice(0, 1);
      hub.save();
      room.to(user.hub).emit("start", user.name);
    }
  });
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

async function isAuthenticated(session) {
  if (session && session.passport && session.passport.user)
    return await User.findOne({ username: session.passport.user })
      .select("name hub username")
      .exec();
  else return false;
}
TTT.on("connection", async (socket) => {
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

io.on("connection", async (socket) => {
  let room = socket.handshake.headers.referer;
  let user = await isAuthenticated(socket.request.session);
  let name = "Guest";
  if (user) {
    name = user.name;
    if (user.hub) room = user.hub;
  }
  socket.join(room);
  socket.on("message", (message) => {
    socket.to(room).emit("message", { name, message });
  });
});
