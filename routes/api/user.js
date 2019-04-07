const express = require('express');
const router = express.Router();

const crypto = require('crypto');
const pw_hash = require('password-hash');
const mysql = require('mysql');

let connection = mysql.createConnection({
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: 'root',
    database: 'matcha'
})

connection.connect(function(err) {
    if (err) throw err
    console.log('You are now connected...')
})

router.post('/signin', (req, res) => {
    let response = {
        email : req.query.email,
        login : req.query.login,
        firstName : req.query.firstname,
        lastName : req.query.lastname,
        gender : req.query.gender,
        password : req.query.password,
        re_pw : req.query.confirm
    }
    let error = false;
    let res_array = [];

    //Check if login is unique (see how to do multiple queries)
    let sql = `SELECT login from users WHERE login = "${response.login}";`;
    connection.query(sql , (err, result) => {
        if (err) throw err;
        if (result.length != 0) {
            error = true;
            res_array.push({
                error: "login",
                errorText: "Le login existe deja"
            });
        }

        //Check if login is long enough
        if (typeof response.login == 'undefined' || !response.login.match('^[a-zA-Z]{4,30}$')) {
            error = true;
            res_array.push({
                error: "login",
                errorText: "Le login doit etre forme de 4 a 30 lettres"
            });
        }

        //Check is password is long and good enough
        if (typeof response.password == 'undefined' || !response.password.match('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,64}$')) {
            error = true;
            res_array.push({
                error: "password",
                errorText: "Le mot de passe doivent contenir au moins 8 caracteres (au moins une minuscule, une majuscule et un chiffre)"
            });
        }

        //Check if passwords are both equal
        else if (typeof response.password == 'undefined' || typeof response.password == 'undefined' ||  response.password != response.re_pw) {
            error = true;
            res_array.push({
                error: "password",
                errorText: "Les mots de passe ne correspondent pas"
            });
        }


        //Check if gender is either Male or female
        if (typeof response.gender == 'undefined' || response.gender != "male" && response.gender != "female") {
            error = true;
            res_array.push({
                error: "gender",
                errorText: "Le genre est errone"
            });
        }

        //Check if both names are incorrect
        if ((typeof response.firstName == 'undefined' || !response.firstName.match('^([a-zA-Zàáâäçèéêëìíîïñòóôöùúûü]+(( |\')[a-zA-Zàáâäçèéêëìíîïñòóôöùúûü]+)*)+([-]([a-zA-Zàáâäçèéêëìíîïñòóôöùúûü]+(( |\')[a-zA-Zàáâäçèéêëìíîïñòóôöùúûü]+)*)+)*$')) && (typeof response.lastName == 'undefined' || !response.lastName.match('^([a-zA-Zàáâäçèéêëìíîïñòóôöùúûü]+(( |\')[a-zA-Zàáâäçèéêëìíîïñòóôöùúûü]+)*)+([-]([a-zA-Zàáâäçèéêëìíîïñòóôöùúûü]+(( |\')[a-zA-Zàáâäçèéêëìíîïñòóôöùúûü]+)*)+)*$'))) {
            error = true;
            res_array.push({
                error: "name",
                errorText: "Le prenom et le nom sont invalides"
            });
        }

        //Check if firstname is correct
        else if (typeof response.firstName == 'undefined' || !response.firstName.match('^([a-zA-Zàáâäçèéêëìíîïñòóôöùúûü]+(( |\')[a-zA-Zàáâäçèéêëìíîïñòóôöùúûü]+)*)+([-]([a-zA-Zàáâäçèéêëìíîïñòóôöùúûü]+(( |\')[a-zA-Zàáâäçèéêëìíîïñòóôöùúûü]+)*)+)*$')) {
            error = true;
            res_array.push({
                error: "name",
                errorText: "Le prenom est invalide"
            });
        }

        //Check if lastname is correct
        else if (typeof response.lastName == 'undefined' || !response.lastName.match('^([a-zA-Zàáâäçèéêëìíîïñòóôöùúûü]+(( |\')[a-zA-Zàáâäçèéêëìíîïñòóôöùúûü]+)*)+([-]([a-zA-Zàáâäçèéêëìíîïñòóôöùúûü]+(( |\')[a-zA-Zàáâäçèéêëìíîïñòóôöùúûü]+)*)+)*$')) {
            error = true;
            res_array.push({
                error: "name",
                errorText: "Le nom est invalide"
            });
        }

        //Check if email has right format
        if (typeof response.email == 'undefined' || !response.email.match('^(([^<>()\\[\\]\\\\.,;:\\s@"]+(\\.[^<>()\\[\\]\\\\.,;:\\s@"]+)*)|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$')) {
            error = true;
            res_array.push({
                error: "email",
                errorText: "L'email est invalide"
            });
        }

        //send json if there is an error and quit
        if (error) {
            res.status(400);
            res.end(JSON.stringify(res_array));
            return;
        }

        //hash pw
        let hashed_pw = pw_hash.generate(response.password);

        //insert user in db
        const sql2 = "INSERT INTO users(login, firstName, lastName, email, pwd) " +
            `VALUES("${response.login}", "${response.firstName}", "${response.lastName}", "${response.email}", "${hashed_pw}");`;

        connection.query(sql2 , (err, result) => {
            if (err) throw err;
            const sql3 = "INSERT INTO additional(gender, user_id)" +
                `VALUES("${response.gender}", ${result.insertId})`;
            connection.query(sql3 , (err, result) => {
                if (err) throw err;
            })
        })

        //Send an email if everything is alright

        //end if everything went fine
        res.end();
    })
});

router.post('/login', (req, res) => {
    let response = {
        login : req.query.login,
        password : req.query.password,
    }

    let error = false;
    let res_array = [];

    //Check if password and login are not empty and defined
    if (typeof response.login == 'undefined' || response.login == "") {
        error = true;
        res_array.push({
            error: "login",
            errorText: "le login est requis"
        })
    }
    if (typeof response.password == 'undefined' || response.password == "") {
        error = true;
        res_array.push({
            error: "password",
            errorText: "le mot de passe est requis"
        })
    }

    //If both fields are full, keep going with the connection
    if (!error) {
        //Check if login matches a user
        let sql = `SELECT login, pwd from users WHERE login = "${response.login}";`;
        connection.query(sql , (err, result) => {
            if (err) throw err;
            if (result.length == 0) {
                error = true;
                res_array.push({
                    error: "password",
                    errorText: "Erreur de connection. Login et/ou mot de passe errones"
                })
            }
            //Check if password is wrong
            else if (!pw_hash.verify(response.password, result[0].pwd)) {
                error = true;
                res_array.push({
                    error: "password",
                    errorText: "Erreur de connection. Login et/ou mot de passe errones"
                })
            }
            //if everything is good, connect the guy (don't know how to do it yet)
            if (!error)
                res.end();
            else {
                res.status(400);
                res.end(JSON.stringify(res_array));
            }
        })
    }
    else {
        res.status(400);
        res.end(JSON.stringify(res_array));
    }
});


module.exports = router;

