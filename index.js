import 'dotenv/config'
import express from "express";
import bodyParser from "body-parser";
import { dirname }  from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));


app.get('/', (req, res) => {
    res.render('index.ejs');
})

app.get('/SimonGame', (req, res) => {
    res.render('games/SimonGame.ejs');
})

app.post('/SimonGame', (req, res) => {
    res.send(req.body);
})


app.get('*', (req, res) => {
    res.redirect('/')
})

app.listen(process.env.PORT, () => {
    console.log(`Server started on port ${process.env.PORT}`);
})