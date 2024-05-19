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

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

async function getItems() {
  let items = [];
  try {
    const result = await db.query("select * from permalist order by id;");

    if (result != null) {
      result.rows.forEach(element => {
        items.push(element);
      });
    }
  } catch (error) {
    console.log(error);
  }
  console.log(items);
  return items;
}

app.get("/", async (req, res) => {
  const items = await getItems();

  res.render("index.ejs", {
    listTitle: "Today",
    listItems: items,
  });
});

app.post("/add", async (req, res) => {
  const item = req.body.newItem;
  
  try {
    await db.query("insert into permalist (title) values($1);", [item]);
    res.redirect("/");
  } catch (error) {
    console.log(error);
  }
});

app.post("/edit", async (req, res) => {
  const itemId = req.body.updatedItemId;
  const updatedTitle = req.body.updatedItemTitle;

  try {
    await db.query("update permalist set title = ($1) where id = $2;", [updatedTitle, itemId]);
    res.redirect("/");
  } catch (error) {
    console.log(error);
  }
});

app.post("/delete", async (req, res) => {
  const itemId = req.body.deleteItemId;
  try {
    await db.query("delete from permalist where id = $1;", [itemId]);
    res.redirect("/");
  } catch (error) {
    console.log(error);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
