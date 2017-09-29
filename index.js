// modules
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const pug = require('pug'); // templating engine
const sql = require('mssql');
const request = require('request');
const parseString = require('xml2js').parseString;

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

/*  request('https://55b71886a6adf896951c9f7e77d80c252ed476a1:x@api.bamboohr.com/api/gateway.php/osimaritime/v1/employees/directory', function(err, response, body) {
     parseString(body, function(err, result) {
        console.log(JSON.stringify(result));
        console.log(result.directory.employees[0].employee[0].field[0]._);
    });
});  */

// session configurations -- for logins
app.use(session({
    secret: 'osi-application', // can change - this is a key used specifically for this application so session from other applications doesn't interfere with each other
    resave: true,
    saveUninitialized: true
}));

// database configurations
const dbConfig = {
    user: 'sa',
    password: 'bcitsql',
    server: 'ROGER85-LAPTOP',
    database: 'osi-hr-management'
};
const connection = new sql.ConnectionPool(dbConfig);


// static routes - by accessing the paths, it will pull files from subdirectories in the assets directory
app.use('/images', express.static('assets/images'));
app.use('/css', express.static('assets/css'));
app.use('/scripts', express.static('assets/js'));

// create date period
var currentDate = new Date();
var currentYear = currentDate.getFullYear();
var currentMonth = currentDate.getMonth() + 1;
var currentDay = currentDate.getDate();
var start_date;
var end_date;
if (parseInt(currentMonth) < 10 && parseInt(currentMonth) > 3) {
    start_date = currentYear + '-04-01';
    end_date = currentYear + '-09-30';
}  else {
    start_date = currentYear + '-10-01';
    end_date = currentYear + 1 + '-03-31';
}

// routes
app.get('/', function(req, resp) {
    resp.render('index');
});

// login/logout
app.post('/login', function(req, resp) { // for development purposes only
    req.session.user = {};
    connection.connect(function(err) {
        var request = new sql.Request(connection);
        request.input('username', req.body.username);
        request.input('password', req.body.password);
        request.mutiple = 'true';
        request.query('SELECT * FROM employee WHERE username = @username AND password = @password', function(err, result) {
            if (result.recordset.length > 0) {
                data = result.recordset[0];
                req.session.username = data.username;
                req.session.user.emp_id = data.emp_id;
                req.session.user.fname = data.fname;
                req.session.user.lname = data.lname;
                req.session.user.manager_id = data.manager_id;

                if (data.emp_id < 2000) {
                    req.session.user.auth = 'Employee';
                }

                resp.redirect('/view');
            } else {
                resp.render('index', {message: 'Incorrect credentials'});
            }

            connection.close();
        });
    });
});

app.get('/logout', function(req, resp) {
    req.session.destroy();

    resp.render('index', {message: 'You have logged out'});
});

// logged in view
app.get('/view', function(req, resp) {
    if (req.session.username) {
        connection.connect(function(err) {
            var request = new sql.Request(connection);

            request.input('emp_id', req.session.user.emp_id);
            request.input('start_date', start_date);
            request.input('end_date', end_date);
            request.query('SELECT * FROM goals WHERE emp_id = @emp_id AND start_date = @start_date AND end_date = @end_date', function(err, result) {
                console.log(result.recordset);
                resp.render('view', {user: req.session.user, goal: result.recordset});
            });
            connection.closed();
        });
    } else {
        resp.render('index', {message: 'You are not logged in'});
    }
});

// get goal dates
app.get('/populate-period-select', function(req, resp) {
    connection.connect(function(err) {
        var request = new sql.Request(connection);

        request.input('emp_id', req.session.user.emp_id);
        request.query('SELECT DISTINCT start_date, end_date FROM goals WHERE emp_id = @emp_id', function(err, result) {
            resp.send(result.recordset);

            connection.close();
        });
    });
});

// server initialization
server.listen(port, function(err) {
    if (err) {
        console.log(err);
    }

    console.log('Server is running at ' + port);
});