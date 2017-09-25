// modules
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const pug = require('pug'); // templating engine

// server configurations
var app = express();
var http = require('http');
const server = http.createServer(app); // integrating express with server
var portNum = 9000; // change to whichever you desire
const port = process.env.PORT || portNum;

// template configurations
app.set('views', __dirname + '/templates');
app.set('view engine', 'pug');
app.disable('view cache');

app.use(bodyParser.urlencoded({
    extended: true
}));

// session configurations -- for logins
app.use(session({
    secret: 'osi-application', // can change - this is a key used specifically for this application so other application's session doesn't interfere with each other
    resave: true,
    saveUninitialized: true
}));

// static routes
app.use(['/scripts', '/css', '/images'], express.static('assets')); // by accessing the paths in the array, it will pull files from the assets directory

// routes
app.get('/', function(req, resp) {
    resp.render('view', {level: 'Manager'});
});

// server initialization
server.listen(port, function(err) {
    if (err) {
        console.log(err);
    }

    console.log('Server is running at ' + port);
});