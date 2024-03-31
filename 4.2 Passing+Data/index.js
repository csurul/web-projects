import express from "express";
import bodyParser from "body-parser";

const app = express();
const port = 3000;
var numLetters;

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", function(req, res) {
  res.render("/Users/csurul/Projects/Web Development Projects/4.2 Passing+Data/views/index.ejs");
});

function countLetters(req, res, next) {
  console.log(req.body);
  if (req.body["fName"] !== '' && req.body["lName"] !== '') {
    numLetters = req.body["fName"].length + req.body["lName"].length;
  } else {
    numLetters = null;
    console.log("req.body is null");
  }
  
  next();
}

app.use(countLetters);

app.post("/submit",function (req, res) {
  res.render("/Users/csurul/Projects/Web Development Projects/4.2 Passing+Data/views/index.ejs",
  {numberOfLetters: numLetters});
});

app.listen(port, function() {
  console.log(`Listening to port ${port}`);
});
