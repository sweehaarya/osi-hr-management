// Module imports
const express = require("express");
const cookieSession = require('cookie-session')
const path = require("path");
const bodyParser = require("body-parser");
const request = require('request');
const Xray = require('x-ray');
const Horseman = require('node-horseman');


// Environment variables
const PORT = process.env.PORT || 3000;
const DB_URL = '';

// Instanciate the modules
var app = express();


// Middleware config
app.use("/scripts", express.static('dist/build'));

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(cookieSession({
    secret: "osimaritimepdp",
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

// Variables for folders path
var srcFolder = path.resolve(__dirname, "src");



/* 
    Routing
*/
app.get("/", function (req, resp){

    if(!req.session.userApi) {
        resp.sendFile(srcFolder + "/logindraft.html");
    } else {
        resp.redirect('/home');
    }
});

app.post('/login', function(req, resp){

    console.log(req.body);
    let username = req.body.username;
    let password = req.body.password;

    // Get Api Key and stores it in client cookies
    var horseman = new Horseman();
    horseman
        .authentication(username, password)
        .open('https://osimaritime.bamboohr.co.uk/login.php')
        .waitForSelector('#company-logo>img')
        .type('input#lname', username)
        .log("typed username")
        .type('input#password', password)
        .log("typed password")
        .click('.login-actions>button')
        .log("clicked button")
        .waitForNextPage({timeout: 20000})
        .click('#infoLinks>li:nth-child(4)>a')
        .waitForNextPage({timeout: 20000})
        .text('.ba-privateContent')
        .then((key) => {
            console.log(`Api Key: ${key.trim()}`);
            req.session.userApi = key.trim();
            resp.send({redirect: "/home"});

        })
        .finally(function() {
            return horseman.close()
        });
});

app.get('/logout', (req, resp) => {
    req.session = null;

    resp.redirect('/');
});

app.get('/home', function(req, resp) {

    if(req.session.userApi) {
        console.log(`Cookie Api Key: ${req.session.userApi}`);
        resp.sendFile(srcFolder + '/home.html');
    } else {
        resp.redirect('/');
    }
});


// Open server
app.listen(PORT, function(err){
    if (err) {
        console.log(err);
        return false;
    }
    console.log(`Server is running on port ${PORT}`);
});

