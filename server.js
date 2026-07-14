const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

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
  fs.writeFileSync(database, JSON.stringify(users, null, 2));
}

// Home → Register
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

// Show Login Page
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Show Register Page
app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});// Register User
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  let users = getUsers();

  const exists = users.find(
    user => user.username === username
  );

  if (exists) {
    return res.send("Username already exists!");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  users.push({
    username: username,
    password: hashedPassword,
    level: 0,
    money: 0,
    fruit: "None"
  });

  saveUsers(users);

  // After registering → Login page
  res.redirect("/login.html");
});

// Login User
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  let users = getUsers();

  const user = users.find(
    u => u.username === username
  );

  if (!user) {
    return res.send("Account not found!");
  }

  const match = await bcrypt.compare(
    password,
    user.password
  );

  if (!match) {
    return res.send("Wrong password!");
  }

  req.session.user = user.username;

  // After login → Dashboard
  res.redirect("/dashboard");
});// Dashboard
app.get("/dashboard", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login.html");
  }

  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Get logged in user
app.get("/api/user", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({
      error: "Not logged in"
    });
  }

  let users = getUsers();

  const user = users.find(
    u => u.username === req.session.user
  );

  if (!user) {
    return res.status(404).json({
      error: "User not found"
    });
  }

  res.json({
    username: user.username,
    level: user.level,
    money: user.money,
    fruit: user.fruit
  });
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login.html");
  });
});// Save player data
app.post("/api/save", (req, res) => {
  if (!req.session.user) {
    return res.status(401).send("Not logged in");
  }

  let users = getUsers();

  const user = users.find(
    u => u.username === req.session.user
  );

  if (!user) {
    return res.status(404).send("User not found");
  }

  user.level = Number(req.body.level || user.level);
  user.money = Number(req.body.money || user.money);
  user.fruit = req.body.fruit || user.fruit;

  saveUsers(users);

  res.send("Saved successfully");
});

// Start server
app.listen(PORT, () => {
  console.log(`Blox Fruit Hub running on port ${PORT}`);
});

