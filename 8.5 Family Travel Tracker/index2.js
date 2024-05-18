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

let currentUserId = 1;

let users = [];

async function checkVisisted() {
  const result = await db.query(
    "select country_code from visited_countries join users on users.id = user_id where user_id = $1;", 
    [currentUserId]
  );
  
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

async function getCurrentUser() {
  const result = await db.query("SELECT * FROM users order by id");
  users = result.rows;
  return users.find((user) => user.id == currentUserId);
}

app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  const currentUser = await getCurrentUser();

  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: currentUser.color,
  });
});

app.post("/add", async (req, res) => {
  const input = req.body["country"];
  const currentUser = await getCurrentUser();

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    if (result != null) {
      const data = result.rows[0];
      const countryCode = data.country_code;

      try {
        await db.query("insert into visited_countries (country_code, user_id) values ($1, $2);",
              [countryCode, currentUser.id]);

        res.redirect("/");
      } catch (error) {
        console.log(err);
      }
    }
    
  } catch (error) {
    console.log(err);
  }
});

app.post("/user", async(req, res) => {
  if(req.body.add === "new") {
    res.render("new.ejs");
  } else {
    currentUserId = req.body.user;
    res.redirect("/");
  }
})

app.post("/new", async (req, res) => {
  const name = req.body.name;
  const color = req.body.color;

  const result = await db.query(
    "INSERT INTO users (name, color) VALUES($1, $2) RETURNING *;",
    [name, color]
  );

  const id = result.rows[0].id;
  currentUserId = id;

  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
