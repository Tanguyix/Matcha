const mysql = require('mysql');

let connection = mysql.createConnection({
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: 'root',
    database: 'matcha',
    multipleStatements: 'true'
})

connection.connect( (err) => {
    if (err) throw err
    console.log('You are now connected...');

    const sql = "CREATE TABLE IF NOT EXISTS users (" +
        "id INT NOT NULL AUTO_INCREMENT PRIMARY KEY," +
        "login VARCHAR (24), " +
        "firstName VARCHAR(30), " +
        "lastName VARCHAR(30), " +
        "email VARCHAR(50), " +
        "pwd VARCHAR(128)); " +
        "" +
        "CREATE TABLE IF NOT EXISTS additional(" +
        "id INT NOT NULL AUTO_INCREMENT PRIMARY KEY," +
        "gender VARCHAR(8)" +
        "user_id INT NOT NULL," +
        "sexuality VARCHAR(20)," +
        "bio VARCHAR(460)," +
        "pictures VARCHAR(1024));"
    connection.query(sql , (err, result) => {
        if (err) throw err;
        console.log("Result: " + result);
    })
    connection.end();
})
