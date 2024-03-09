import 'dotenv/config'
import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import { dirname }  from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));


app.get('/', (req, res) => {
    console.log(req.originalUrl);
    res.render('index.ejs');
})

app.get('/SimonGame', (req, res) => {
    console.log(req.originalUrl);
    res.render('games/SimonGame.ejs');
})

app.post('/SimonGame', (req, res) => {
    res.send(req.body);
})
app.get('/Wordle', (req, res) => {
    console.log(req.originalUrl);
    res.render('games/Wordle/home.ejs');
})

app.get('/Wordle_:wordLenght', (req, res) => {
    console.log(req.originalUrl);
    const wordLenght = Number(req.params.wordLenght);
    if (!wordLenght || wordLenght < 5 || wordLenght > 8)
        return res.send({})
    const number = Math.floor(Math.random() * 1000)
    res.render('games/Wordle/game.ejs', { lenght : wordLenght , number});
})
app.post('/Wordle_:wordLenght', (req, res) => {
    const {lenght, number , guess, row} = req.body
    if (!lenght || lenght < 5 || lenght > 8 || number < 0 || number > 1000)
        return res.send([])
    const word = fs.readFileSync(__dirname + `/tmp/Wordle/${lenght}.txt`).toString().split('\n')[number].toUpperCase();
    const correct = [];
    for (let i = 0; i < lenght; i++) {
        let state = 0;
        if (word[i] == guess[i]) {
            state = 1
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
    let data = { correct , won: word == guess}
    if (lenght == row) 
        data.word = word;
    res.send(data);
})

app.get('/Trivia', (req, res) => {
    console.log(req.originalUrl);
    res.render('games/Trivia/home.ejs');
})
app.post('/Trivia', (req, res) => {
    const { category, difficulty, type, token } = req.body
    
    res.render('games/Trivia/game.ejs', { category, difficulty, type, token });
})

app.get('/FlappyBird', (req, res) => {
    console.log(req.originalUrl);
    res.render('games/FlappyBird/home.ejs', {})
})

app.get('*', (req, res) => {
    res.redirect('/')
})

app.listen(process.env.PORT, () => {
    console.log(`Server started on port ${process.env.PORT}`);
})