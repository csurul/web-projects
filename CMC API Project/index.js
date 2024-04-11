import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

import { dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));



import fs from "fs";

const parentFolder = __dirname.substring(0, __dirname.lastIndexOf("/"));
//const parentFolder = __dirname.substring(0, __dirname.lastIndexOf("\\"));
const filePath = "/Local Workouts/1_CMC_APIKEY.txt";
let apiKey = null;

//read the coinmarketcap apikey from a file located in another folder
fs.readFile(parentFolder + filePath, {encoding: 'utf-8'}, function(err, data){
    if (!err) {
        apiKey = data;
    } else {
        console.log(err);
    }
});

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

let result = null;
let result2 = null;

app.get("/", async (req, res) => {
  res.render("index.ejs", { data: "" });
});

app.post("/list_exchange", async (req, res) => {
  
  
});

async function ListExchange() {
  
}

let resultMetrics;
let resultCryptos;
let resultExchanges;

app.post("/map_cryptocurreny", async (req, res) => {
  try {
    resultMetrics = await axios.get('https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest', {
      headers: {
        'X-CMC_PRO_API_KEY': apiKey,
      },
    });
  } catch (error) {
    resultMetrics = null;
    res.status(500).send(error.message);
  }
  
  try {
    resultExchanges = await axios.get('https://pro-api.coinmarketcap.com/v1/exchange/map?limit=10&&sort=volume_24h', {
      headers: {
        'X-CMC_PRO_API_KEY': apiKey,
      },
    });
  } catch (error) {
    resultExchanges = null;
    res.status(500).send(error.message);
  }

  try {
    resultCryptos = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/map?sort=cmc_rank&&limit=10', {
      headers: {
        'X-CMC_PRO_API_KEY': apiKey,
      },
    });
  } catch (error) {
    resultCryptos = null;
    res.status(500).send(error.message);
  }
  
  let cryptoInfoLink = "https://pro-api.coinmarketcap.com/v2/cryptocurrency/info?id="
  let cryptoIDS = [];
  resultCryptos.data.data.forEach(element => {
    cryptoIDS.push(element.id);
    cryptoInfoLink += element.id + ",";
  });
  cryptoInfoLink = cryptoInfoLink.substring(0, cryptoInfoLink.length - 1);
  console.log(cryptoInfoLink);

  try {
    result2 = await axios.get(cryptoInfoLink, {
      headers: {
        'X-CMC_PRO_API_KEY': apiKey,
      },
    });
  } catch (error) {
    resultCryptos = null;
    res.status(500).send(error.message);
  }

  if (result2) {
    //console.log(result2.data.data);
    //console.log(result2.data.data[cryptoIDS[1]].id + result2.data.data[cryptoIDS[1]].symbol);
   
    res.render("index.ejs", { metrics: resultMetrics.data.data, exchanges: resultExchanges.data.data, data: result2.data.data, ids: cryptoIDS });
  } else {
    res.render("index.ejs", { data: "Response is undefined" });
  }

  /*if (result) {
    console.log(result.data.data);

    res.render("index.ejs", { data: result.data.data });
  } else {
    res.render("index.ejs", { data: "Response is undefined" });
  }*/
  
});


app.post("/search_crypto", async (req, res) => {
  try {
    console.log(req.body.slug); 
    result = await axios.get('https://pro-api.coinmarketcap.com/v2/cryptocurrency/info?slug=' + req.body.slug, {
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
    res.render("crypto.ejs", { data: result.data.data });
  } else {
    res.render("crypto.ejs", { data: "Response is undefined" });
  }
  
});

app.listen(port, () => {
   console.log(`Server running on port: ${port}`);
});