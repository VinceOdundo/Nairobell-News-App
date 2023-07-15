import mysql from "mysql";
export const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Localman#24",
  database: "nairobell",
});

db.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});
