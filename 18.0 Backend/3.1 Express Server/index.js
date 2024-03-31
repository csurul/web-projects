import express from "express"
const app = express();
const port = 3000;

app.get("/index.html", (req, res) => {
    
})

app.get("/contact", (req, res) => {
    res.send("<h1>Cüneyt Sürül<h1><h2>+905397633190<h2>");
})

app.get("/about", (req, res) => {
    res.send("<p>This is the first web application builded by me and i am proud of myself<p>");
})

app.listen(3000, () => {
    console.log(`Server running on port ${port}.`);
})