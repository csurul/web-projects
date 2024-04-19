import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "569103",
  port: 5432,
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function checkVisisted() {
  const result = await db.query("SELECT country_code FROM visited_countries");

  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

let isFounded = true;

app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  res.render("index.ejs", { countries: countries, total: countries.length, wasFound: isFounded });
});


app.post("/add", async (req, res) => {
  const countryEntry = req.body.country;
  const visitedCountry = req.body.country.slice(0, 1).toUpperCase() + req.body.country.slice(1, req.body.country.length).toLowerCase();
  console.log(visitedCountry);
  const result = await db.query(`select country_code from countries where country_name = '${req.body.country}'`)
  if (result.rows.length !== 0) {
    await db.query("insert into visited_countries (country_code) values ($1)", [result.rows[0].country_code]);

    isFounded = true;
  } else {
    isFounded = false; 
  }
  res.redirect("/");
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
