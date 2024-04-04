import express from "express";
import bodyParser from "body-parser";
import { dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const port = 3000;

//app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
   //console.log(__dirname + "/src/views/index.ejs");
   //res.render(__dirname + "/src/views/index.ejs");
   const dataaa = {
      title: "EJS Tags",
      seconds: new Date().getSeconds(),
      items: ["apple", "banana", "cherry"],
      htmlContent: "<strong>This is some strong text</strong>",
    };
    
    res.render(__dirname + "/views/index.ejs", { data: dataaa });
});

app.listen(port, () => {
   console.log(`Server running on port: ${port}`);
});