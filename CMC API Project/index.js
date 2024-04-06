import express, { response } from "express";
//import bodyParser from "body-parser";
import axios from "axios";

import { dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));

import fse from "fs";

const parentFolder = __dirname.substring(0, __dirname.lastIndexOf("\\"));
const filePath = "/Local Workouts/1_CMC_APIKEY.txt";
let apiKey = null;

fse.readFile(parentFolder + filePath, {encoding: 'utf-8'}, function(err,data){
    if (!err) {
        apiKey = data;
    } else {
        console.log(err);
    }
});

/*fse.read(__dirname + "/1_CMC_APIKEY.txt", Buffer.alloc(100), function(err,data){
    if (!err) {
        console.log('received data: ' + data);
        
    } else {
        console.log(err);
    }
});*/

const app = express();
const port = 3000;

app.use(express.static("public"));
//app.use(bodyParser.urlencoded({ extended: true }));

let result = null;

app.get("/", async (req, res) => {
  res.render("index.ejs", { content: "No data" });
});

app.post("/pull", async (req, res) => {
  try {
    result = await axios.get('https://pro-api.coinmarketcap.com/v1/exchange/map?limit=10&&sort=volume_24h', {
      headers: {
        'X-CMC_PRO_API_KEY': apiKey,
      },
    });
  } catch (error) {
    result = null;
    res.status(500).send(error.message);
  }
  
  if (result) {
    console.log(result.data);
    res.render("index.ejs", { content: JSON.stringify(result.data) });
  } else {
    res.render("index.ejs", { content: "Response is undefined" });
  }
  
});

app.listen(port, () => {
   console.log(`Server running on port: ${port}`);
});