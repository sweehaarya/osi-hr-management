// modules
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const pug = require('pug'); // templating engine
const sql = require('mssql');
const request = require('request');
const parseString = require('xml2js').parseString;
// Module imports
const cookieSession = require('cookie-session')
const Xray = require('x-ray');
const Horseman = require('node-horseman');

// server configurations
var app = express();
var http = require('http');
const server = http.createServer(app); // integrating express with server
var portNum = 9000; // change to whichever you desire
const port = process.env.PORT || portNum || 3000;

// template configurations
app.set('views', [__dirname + '/templates', __dirname + '/templates/temp']);
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

app.use(cookieSession({
    secret: "osimaritimepdp",
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

// Variables for folders path
var srcFolder = path.resolve(__dirname, "src");

// database configurations
const dbConfig = {
    user: process.env.MSDB_USER,
    password: process.env.MSDB_PASSWORD,
    server: 'testdb0929.cyp2ax7htkn5.ca-central-1.rds.amazonaws.com',
    database: 'osi-hr-management'
};

const localConfig = {
    user: 'sa',
    password: 'bcitsql',
    server: 'ROGER85-LAPTOP',
    database: 'osi-hr-management'
}
const connection = new sql.ConnectionPool(localConfig);
const dbRequest = new sql.Request(connection);

// static routes - by accessing the paths, it will pull files from subdirectories in the assets directory
app.use('/images', express.static('assets/images'));
app.use('/css', express.static('assets/css'));
app.use('/js', express.static('assets/js'));

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
    connection.connect(function(err) {
        dbRequest.query('SELECT * FROM employee', function(err, result) {
            console.log(result);
        });
    })
    resp.render('index');
});

app.get('/view/report/:goal', function(req, resp) {
    if (req.params.goal === '1') {
        resp.render('table_report');
    } else {
        resp.render('table_report_no');
    }
});

// get checkin history
app.get('/get/checkin/:who/:date', function(req, resp) {
    connection.connect(function(err) {
        dbRequest.input('emp_id', req.session.user.emp_id);
        dbRequest.input('start_date', convertStartDate(req.params.date));
        dbRequest.input('end_date', convertEndDate(req.params.date));
        dbRequest.query('SELECT * FROM checkins JOIN actions ON checkins.a_id = actions.a_id JOIN goals ON goals.g_id = actions.g_id WHERE goals.emp_id = @emp_id AND goals.start_date = @start_date AND goals.end_date = @end_date', function(err, result) {
            req.session.user.checkin = result.recordset;
        });
    });
});

// logged in view
app.get('/view', function(req, resp) {
    if (req.session.username) {
        connection.connect(function(err) {
            dbRequest.input('emp_id', req.session.user.emp_id);
            if (req.query.period) {
                dbRequest.input('start_date', convertStartDate(req.query.period));
                dbRequest.input('end_date', convertEndDate(req.query.period));
                dbRequest.query('SELECT * FROM goals JOIN actions ON goals.g_id = actions.g_id WHERE emp_id = @emp_id AND start_date = @start_date AND end_date = @end_date', function(err, result) {
                    if (result != undefined && result.recordset.length > 0) {
                        resp.render('view', {user: req.session.user, goal: result.recordset});
                    } else {
                        resp.render('view', {user: req.session.user, goal: []});
                    }
                }); 
            } else {
                dbRequest.input('start_date', start_date);
                dbRequest.input('end_date', end_date);
                dbRequest.query('SELECT * FROM goals JOIN actions ON goals.g_id = actions.g_id WHERE emp_id = @emp_id AND start_date = @start_date AND end_date = @end_date', function(err, result) {
                    if (result != undefined && result.recordset.length > 0) {
                        resp.render('view', {user: req.session.user, goal: result.recordset});
                    } else {
                        resp.render('view', {user: req.session.user, goal: []});
                    }
                });
            }
        });
    } else {
        resp.render('index', {message: 'You are not logged in'});
    }
});

// login/logout
app.post('/login', function(req, resp) { // for development purposes only
    req.session.user = {};
    connection.connect(function(err) {
        dbRequest.input('username', req.body.username);
        request.mutiple = 'true';
        dbRequest.query('SELECT * FROM employee WHERE username = @username', function(err, result) {
            if (result.recordset.length > 0) {
                data = result.recordset[0];
                req.session.username = data.username;
                req.session.user.emp_id = data.emp_id;
                req.session.user.fname = data.fname;
                req.session.user.lname = data.lname;
                req.session.user.manager_id = data.manager_id;

                if (data.emp_id < 2000) {
                    req.session.user.auth = 'HR';
                }

                resp.redirect('/view');
            } else {
                resp.render('index', {message: 'Incorrect credentials'});
            }
        });
    });
});

app.get('/logout', function(req, resp) {
    req.session = null;
    connection.close();

    resp.render('index', {message: 'You have logged out'});
});

// get goal dates
app.get('/populate-period-select', function(req, resp) {
    connection.connect(function(err) {
        dbRequest.input('emp_id', req.session.user.emp_id);
        dbRequest.query('SELECT DISTINCT start_date, end_date FROM goals WHERE emp_id = @emp_id', function(err, result) {
            resp.send(result.recordset);
        });
    });
});

// save goal changes
app.post('/save-goal-changes', function(req, resp) {
    connection.connect(function(err) {
        dbRequest.input('goal', req.body.goal);
        dbRequest.input('emp_id', req.session.user.emp_id);
        dbRequest.query('INSERT INTO goals (goal, emp_id) OUTPUT Inserted.g_id VALUES (@goal, @emp_id)', function(err, result) {
            if (err) {
                console.log(err);
            }
            var g_id = result.recordset[0].g_id;
            
            if (typeof req.body.goal_action === 'object') {
                const tx = new sql.Transaction(connection);
                tx.begin(function(err) {
                    const table = new sql.Table('actions');
                    table.create = true;
                    table.columns.add('action', sql.VarChar(sql.Max), {nullable: false});
                    table.columns.add('created_on', sql.Date(), {nullable: false});
                    table.columns.add('g_id', sql.Int, {nullable: false});
                    table.columns.add('due_date', sql.Date(), {nullable: false});
                    table.columns.add('hourly_cost', sql.VarChar(sql.Max), {nullable: false});
                    table.columns.add('training_cost', sql.VarChar(sql.Max), {nullable: false});
                    table.columns.add('expenses', sql.VarChar(sql.Max), {nullable: false});

                    var index = 0;
                    for (var i = 0; i < req.body.goal_action.length; i++) {
                        var dateParts = req.body.date_select[index].split('-');
                        table.rows.add(req.body.goal_action[index], new Date(), parseInt(g_id), new Date(dateParts[0], dateParts[1] - 1, dateParts[2]), req.body.hourly_cost[index], req.body.training_cost[index], req.body.expenses[index]);
                        index++;
                    }

                    const r = new sql.Request(tx);
                    r.bulk(table, function(err, result) {
                        if (err) { console.log(err); }
                        tx.commit(function(err) {
                            if (err) { console.log(err); }

                            resp.redirect('/view');
                        });
                    });
                });
            } else {
                connection.connect(function(err) {
                    var dateParts = req.body.date_select.split('-');

                    dbRequest.input('action', req.body.goal_action);
                    dbRequest.input('created_on', new Date());
                    dbRequest.input('g_id', parseInt(g_id));
                    dbRequest.input('due_date', new Date(dateParts[0], dateParts[1] -1, dateParts[2]));
                    dbRequest.input('hourly_cost', req.body.hourly_cost);
                    dbRequest.input('training_cost', req.body.training_cost);
                    dbRequest.input('expenses', req.body.expenses);
                    dbRequest.query('INSERT INTO actions (action, created_on, g_id, due_date, hourly_cost, training_cost, expenses) VALUES (@action, @created_on, @g_id, @due_date, @hourly_cost, @training_cost, @expenses)', function(err, result) {
                        resp.redirect('/view');
                    });
                });
            } 
        });
    });
});

// submit checkins
app.post('/:who/submit-checkin', function(req, resp) {
    connection.connect(function(err) {
        dbRequest.input('a_id', req.body.a_id);
        dbRequest.input('comment', req.body.comment);
        dbRequest.input('emp_id', req.session.user.emp_id);
        if (req.params.who === 'employee') {
            dbRequest.query('SELECT MIN(c_id) AS c_id, a_id, employee_comment FROM checkins WHERE employee_comment IS NULL GROUP BY employee_comment, a_id', function(err, result) {
                if (result.recordset.length > 0) {
                    dbRequest.input('c_id', result.recordset[0].c_id);
                    dbRequest.query('UPDATE checkins SET employee_comment = @comment WHERE c_id = @c_id', function(err, result) {
                        if (err) {
                            console.log(err);
                            resp.send('fail');
                        } else {
                            resp.send('success');
                        }
                    });
                } else {
                    dbRequest.query('INSERT INTO checkins (a_id, employee_comment, emp_id) VALUES (@a_id, @comment, @emp_id)', function(err, result) {
                        if (err) {
                            console.log(err);
                            resp.send('fail');
                        } else {
                            resp.send('success');
                        }
                    }); 
                }
            });
        } else if (req.params.who === 'manager') {
            dbRequest.query('SELECT MIN(c_id) AS c_id, a_id, manager_comment FROM checkins WHERE manager_comment IS NULL GROUP BY manager_comment, a_id', function(err, result) {
                if (result.recordset.length > 0) {
                    dbRequest.input('c_id', result.recordset[0].c_id);
                    dbRequest.query('UPDATE checkins SET manager_comment = @comment WHERE c_id = @c_id', function(err, result) {
                        if (err) {
                            console.log(err);
                            resp.send('fail');
                        } else {
                            resp.send('success');
                            console.log('update', result);
                        }
                    });
                } else {
                    dbRequest.query('INSERT INTO checkins (a_id, manager_comment) VALUES (@a_id, @comment)', function(err, result) {
                        if (err) {
                            console.log(err);
                            resp.send('fail');
                        } else {
                            resp.send('success');
                        }
                    });
                }
            });
        }
    });
});

// submit goal review
app.post('/:who/submit-goal-review', function(req, resp) {
     connection.connect(function(err) {
        dbRequest.input('a_id', parseInt(req.body.a_id));
        dbRequest.input('g_id', parseInt(req.body.g_id));
        dbRequest.input('comment', req.body.comment);
        if (req.params.who === 'employee') {
            dbRequest.query('SELECT gr_id, g_id, employee_comment FROM goal_review WHERE gr_id = (SELECT MIN(gr_id) FROM goal_review AS gr WHERE gr.g_id = goal_review.g_id AND employee_comment IS NULL) AND g_id = (SELECT MAX(g_id) FROM goal_review)', function(err, result) {
                if (result.recordset.length > 0) {
                    dbRequest.input('gr_id', result.recordset[0].gr_id);
                    dbRequest.query('UPDATE goal_review SET employee_comment = @comment WHERE gr_id = @gr_id', function(err, result) {
                        if (err) {
                            console.log(err);
                            resp.send('fail');
                        } else {
                            resp.send('success');
                        }
                    });
                } else {
                    dbRequest.query('INSERT INTO goal_review (a_id, g_id, employee_comment) VALUES (@a_id, @g_id, @comment)', function(err, result) {
                        if (err) {
                            console.log(err);
                            resp.send('fail');
                        } else {
                            resp.send('success');
                        }
                    });
                }
            });
        } else if (req.params.who === 'manager') {
            dbRequest.query('SELECT gr_id, g_id, manager_comment FROM goal_review WHERE gr_id = (SELECT MIN(gr_id) FROM goal_review AS gr WHERE gr.g_id = goal_review.g_id AND manager_comment IS NULL) AND g_id = (SELECT MAX(g_id) FROM goal_review)', function(err, result) {
                if (result.recordset.length > 0) {
                    dbRequest.input('gr_id', result.recordset[0].gr_id);
                    dbRequest.query('UPDATE goal_review SET manager_comment = @comment WHERE gr_id = @gr_id', function(err, result) {
                        if (err) {
                            console.log(err);
                            resp.send('fail');
                        } else {
                            resp.send('success');
                        }
                    });
                } else {
                    dbRequest.input('effectiveness', req.body.goal_effectiveness);
                    dbRequest.input('progress', req.body.goal_progress);
                    dbRequest.query('INSERT INTO goal_review (a_id, g_id, manager_comment, effectiveness, progress) VALUES (@a_id, @g_id, @comment, @effectiveness, @progress)', function(err, result) {
                        if (err) {
                            console.log(err);
                            resp.send('fail');
                        } else {
                            resp.send('success');
                        }
                    });
                }
            });
        }
    }); 
});

// functions
function convertStartDate(date) {
    var d = date.split('-')
    var sd = '20' + d[0].substr(2, 2) + '-' + d[0].substr(0, 2) + '-01';

    return sd;
}

function convertEndDate(date) {
    var d = date.split('-');
    if (d[1].substr(0,2) === '09') {
        var ed = '20' + d[1].substr(2, 2) + '-' + d[1].substr(0, 2) + '-30';
    } else {
        var ed = '20' + d[1].substr(2, 2) + '-' + d[1].substr(0, 2) + '-31';
    }

    return ed;
}

// Login Bamboo API
app.post('/login-api', function(req, resp){

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

app.get('/home', function(req, resp) {

    if(req.session.userApi) {
        console.log(`Cookie Api Key: ${req.session.userApi}`);
        resp.sendFile(srcFolder + '/home.html');
    } else {
        resp.sendFile(srcFolder + '/test-login');
    }
});

// server initialization
server.listen(port, function(err) {
    if (err) {
        console.log(err);
    }

    console.log('Server is running at ' + port);
});