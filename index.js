const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "goodreads.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// Get Books API
app.get("/books/", async (request, response) => {
  const getBooksQuery = `
  SELECT
    *
  FROM
    book
  ORDER BY
    book_id;`;
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});

//Register User API
app.post("/users/", async (request, response) => {
  const { name, username, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const checkUserQuery = `
        SELECT *
        FROM user
        WHERE username LIKE '${username}';
    `;
  const dbUser = await db.get(checkUserQuery);
  //Create User
  if (dbUser === undefined) {
    const createUserQuery = `
            INSERT INTO user(name, username, password, gender, location)
            VALUES (
                '${name}',
                '${username}',
                '${hashedPassword}',
                '${gender}',
                '${location}'
            );
        `;
    const dbResponse = await db.run(createUserQuery);
    const userId = dbResponse.lastID;
    response.send("User Created Successfully");
  } else {
    response.status(400);
    response.send("User Already Exists");
  }
});

//Login User API
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const checkUserQuery = `
        SELECT *
        FROM user
        WHERE username = '${username}';
    `;
  const dbUser = await db.get(checkUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.send("Login Successful");
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});
