import express from "express";
import bodyParser from "body-parser";
import { dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const port = 3000;

//const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

//default parameters
let type = "a weekday";
let advice = "it's time to work hard!";

app.use(bodyParser.urlencoded({extended: true}));

function dayCheck(req, res, next){
    type = "a weekday";
    advice = "it's time to work hard!";

    if (req.body["date"] !== undefined) {       
        const date = new Date(req.body["date"] + "T00:00:00Z") ;
        console.log(date); 
        console.log(date.toString()); 
     
        console.log("getUTCFullYear: " + date.getUTCFullYear());
        console.log("getUTCMonth: " + date.getUTCMonth());
        console.log("getUTCDay: " + date.getUTCDay());

        //get the day number*/
        const today = date.getDay();
        console.log("today: " + today); 

        if (today === 6 || today === 0) {
            type = "the weekend";
            advice = "it's time to have some fun!";
        }    
    }

    next();
}


app.use(dayCheck);

app.get("/", function (req, res) {
    
    res.sendFile(__dirname + "/public/index.html");
    //console.log(document.getElementById("datePicker"));
});

app.post("/check", function (req, res) {
    res.render(__dirname + "/views/index.ejs", { dayType: type, advice: advice });
})

app.listen(port, function () {
    console.log(`listening to port: ${port}`);
})
