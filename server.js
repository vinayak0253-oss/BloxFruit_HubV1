

const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const fs = require("fs");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

app.use(
  session({
    secret: "blox-fruit-hub-secret",
    resave: false,
    saveUninitialized: false
  })
);

const database = "users.json";

function getUsers() {
  if (!fs.existsSync(database)) {
    fs.writeFileSync(database, "[]");
  }

  return JSON.parse(fs.readFileSync(database));
}

function saveUsers(users) {
  fs.writeFileSync(
    database,
    JSON.stringify(users, null, 2)
  );
}
app.post("/register", async (req, res) => {;
const { username, password } = req.body;

  let users = getUsers();

  const exists = users.find(
    user => user.username === username
  );

  if (exists) {
    return res.send("Username already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  users.push({
    username: username,
    password: hashedPassword,
    level: 0,
    fruit: "None",
    money: 0
  });

  saveUsers(users);

  res.redirect("/login.html");
});


app.post("/login", async (req, res) => {

  const { username, password } = req.body;

  let users = getUsers();

  const user = users.find(
    u => u.username === username
  );

  if (!user) {
    return res.send("Account not found");
  }

  const match = await bcrypt.compare(
    password,
    user.password
  );

  if (!match) {
    return res.send("Wrong password");
  }

  req.session.user = user.username;

  res.redirect("/dashboard.html");
});
app.get("/dashboard", (req, res) => {

  if (!req.session.user) {
    return res.redirect("/login.html");
  }

  res.redirect("/dashboard.html");

});

app.get("/logout", (req, res) => {

  req.session.destroy(() => {
    res.redirect("/login.html");
  });

});

app.listen(3000, () => {

  console.log("==================================");
  console.log("Blox Fruit Hub Started!");
  console.log("Open: http://localhost:3000");
  console.log("==================================");

});
