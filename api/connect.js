import mysql from "mysql";

export const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "@MamaNelly1961",
  database: "nairobell",
});
