// Module imports
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const pug = require('pug'); // templating engine
const sql = require('mssql');
const cookieSession = require('cookie-session');
var bamboohr = new (require('node-bamboohr'))({apikey: process.env.API_KEY, subdomain:'osimaritime'});


// server configurations
var app = express();
var http = require('http');
const server = http.createServer(app); // integrating express with server
const port = process.env.PORT

// template configurations
app.set('views', [__dirname + '/templates', __dirname + '/templates/temp']);
app.set('view engine', 'pug');
app.disable('view cache');

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(cookieSession({
    secret: process.env.APP_SECRET,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

// database configurations
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    server: process.env.DB_SERVER_URL,
    database: 'osi-hr-management'
};

const connection = new sql.ConnectionPool(dbConfig);
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
    // If user has already logged in, redirect to /view
    if(req.session.emp_id){
        resp.redirect('/view')
    } else {
        resp.render('index');
    }
});

app.get('/api', function(req, resp) {
    resp.render('index_api');
});

app.get('/view/report/:goal', function(req, resp) {
    if (req.params.goal === '1') {
        resp.render('table_report');
    } else {
        resp.render('table_report_no');
    }
});

// login/logout
app.post('/login', function(req, resp) { // for development purposes only
    connection.connect(function(err) {
        dbRequest.input('username', req.body.username);
        dbRequest.query('SELECT * FROM employee WHERE username = @username', function(err, result) {

            if (result.recordset.length > 0) {
                req.session = result.recordset[0]

                 if (req.session.emp_id < 2000) {
                    req.session.auth = 'Employee';
                } else if (req.session.emp_id > 2000 && req.session.emp_id < 3000) {
                    req.session.auth = 'Manager';
                } else if (req.session.emp_id > 3000) {
                    req.session.auth = 'HR';
                } 

                resp.redirect('/view');
            } else {
                resp.render('index', {message: 'Incorrect credentials'});
            }
        });
    });
});

// Login Bamboo API
app.post('/login-api', function(req, resp) {

    // Check if email is in the employee table
    connection.connect(function(err) {
        if(err){console.log(err)}

        dbRequest.input('username', req.body.username);
        dbRequest.query('SELECT * FROM employee WHERE username = @username', function(err, result){
            if(err){console.log(err)}

            if (result.recordset.length > 0 && result.recordset[0].is_approved === true) {

                console.log(result.recordset[0]);

                // Store type of employee in cookie session
                if (result.recordset[0].emp_type === 1) {
                    req.session.auth = 'Employee';
                } else if (result.recordset[0].emp_type === 2) {
                    req.session.auth = 'Manager';
                } else if (result.recordset[0].emp_type === 3) {
                    req.session.auth = 'HR';
                }

                //Get list of employees from BambooHR API
                bamboohr.employees(function(err, employees) {
                    if(err){console.log(err)}

                    // Iterate trough each employee and find employee from matching email field
                    for (let employee of employees) {
                        if(employee.fields.workEmail === req.body.username) {
                            req.session.emp_id = employee.id;

                            // Iterate trough employee fields and store them in cookie session
                            for (let field in employee.fields) {
                                if (field === 'workEmail') {
                                    req.session.username = employee.fields[field];
                                } else {
                                    req.session[field] = employee.fields[field];
                                }
                            }

                            // Second call to BambooHr to get custom employee fields and store them in cookie session
                            bamboohr.employee(req.session.emp_id).get('supervisor', 'supervisorEId', 'hireDate','customJobCode', 'customLevel','employeeNumber', function(err, result){
                                for (let field in result.fields) {
                                    req.session[field] = result.fields[field];
                                }

                                resp.redirect('/view');
                            });

                            break;
                        }
                    }
                });

            } else {
                // If email does not match in database
                resp.render('index', {message: 'Incorrect credentials'});
            }


        });
    });
});

app.get('/logout', function(req, resp) {
    req.session = null;
    resp.render('index', {message: 'You have logged out'});
    connection.close();
});

// logged in view
app.get('/view', function(req, resp) {
    if (req.session.emp_id) {

        console.log(`USER emp_id: ${req.session.emp_id}`);

        connection.connect(function(err) {
            dbRequest.input('emp_id', req.session.emp_id);
            if (req.query.period) {
                var dp = req.query.period.split('_');
                dbRequest.input('start_date', dp[0]);
                dbRequest.input('end_date', dp[1]);
            } else {
                dbRequest.input('start_date', start_date);
                dbRequest.input('end_date', end_date);
            }
            // Get goal preparation
            dbRequest.query('SELECT * FROM goal_prep JOIN goal_prep_details ON goal_prep.gp_id = goal_prep_details.gpd_gp_id WHERE gp_emp_id = @emp_id', function(err, result) {
                if (result !== undefined && result.recordset.length > 0) {
                    var gp = result.recordset;
                } else {
                    var gp = [];
                }
                // Get Goals and actions
                dbRequest.query('SELECT * FROM goals JOIN actions ON goals.g_id = actions.a_g_id WHERE goals.emp_id = @emp_id AND actions.start_date = @start_date AND actions.end_date = @end_date', function(err, result) {
                    if (result !== undefined && result.recordset.length > 0) {
                        var g = result.recordset;
                        dbRequest.input('g_a_id', result.recordset[0].g_id);
                    } else {
                        var g = [];
                    }
                    // Get check-in
                    dbRequest.query('SELECT * FROM actions JOIN checkins ON actions.a_id = checkins.c_a_id WHERE actions.a_g_id = @g_a_id', function(er, res) {
                        if (res !== undefined && res.recordset.length > 0) {
                            var c = res.recordset;
                        } else {
                            var c = [];
                        }
                        // Get goal review
                        dbRequest.query('SELECT * FROM goal_review JOIN actions ON goal_review.gr_a_id = actions.a_id WHERE actions.a_g_id = @g_a_id', function(e, r) {
                            if (r !== undefined && r.recordset.length > 0) {
                                var gr = r.recordset;
                            } else {
                                var gr = [];
                            }

                            resp.render('view', {user: req.session, goal: g, checkin: c, goal_review: gr, goal_prep: gp});
                        });
                    });
                });
            });
        });
    } else {
        resp.render('index', {message: 'You are not logged in'});
    }
});

// get goal dates
app.get('/populate-period-select', function(req, resp) {
    connection.connect(function(err) {
        dbRequest.input('emp_id', req.session.emp_id);
        dbRequest.query('SELECT DISTINCT g_id, emp_id, actions.start_date, actions.end_date FROM goals JOIN actions ON goals.g_id = actions.a_g_id  WHERE goals.emp_id = @emp_id', function(err, result) {
            if (result !== undefined && result.recordset.length > 0) {
                resp.send(result.recordset);
            } else {
                resp.send('fail');
            }
        });
    });
}); 

// get employee names to populate dropdown (manager)
app.get('/populate-manager-employee-select', function(req, resp) {
    connection.connect(function(err) {
        dbRequest.input('emp_id', req.session.emp_id);
        dbRequest.query('SELECT * FROM employee WHERE manager_id = @emp_id', function(err, result) {
            if (result !== undefined && result.recordset.length > 0) {
                resp.send(result.recordset);
            } else {
                resp.send('fail');
            }
        });
    });
});

// get employee goal dates (manager)
app.get('/populate-manager-employee-date-select/:emp_id', function(req, resp) {
    connection.connect(function(err) {
        dbRequest.input('emp_id', req.params.emp_id);
        dbRequest.query('SELECT DISTINCT g_id, actions.start_date, actions.end_date FROM goals JOIN actions on goals.g_id = actions.a_g_id WHERE emp_id = @emp_id', function(err, result) {
            if (result !== undefined && result.recordset.length > 0) {
                resp.send(result.recordset);
            } else {
                resp.send('fail');
            }
        });
    });
});

// get employee goals (manager)
app.post('/get-employee-goal', function(req, resp) {
    connection.connect(function(err) {
        var dp = req.body.date.split('_');
        dbRequest.input('emp_id', req.body.emp_id);
        dbRequest.input('start_date', dp[0]);
        dbRequest.input('end_date', dp[1]);
        dbRequest.query('SELECT * FROM goals JOIN actions ON goals.g_id = actions.a_g_id WHERE goals.emp_id = @emp_id AND actions.start_date = @start_date AND actions.end_date = @end_date', function(err, result) {
            if (result !== undefined && result.recordset.length > 0) {
                var g = result.recordset;
            } else {
                var g = [];
            }

            dbRequest.query('SELECT * FROM goals JOIN actions ON goals.g_id = actions.a_g_id JOIN checkins ON actions.a_id = checkins.c_a_id WHERE goals.emp_id = @emp_id AND actions.start_date = @start_date AND actions.end_date = @end_date', function(er, res) {
                if (res !== undefined && res.recordset.length > 0) {
                    var ck = res.recordset;
                } else {
                    var ck = [];
                }

                dbRequest.query('SELECT * FROM goals JOIN actions ON goals.g_id = actions.a_g_id JOIN goal_review ON actions.a_id = goal_review.gr_a_id WHERE goals.emp_id = @emp_id AND actions.start_date = @start_date AND actions.end_date = @end_date', function(e, r) {
                    if (r !== undefined && r.recordset.length > 0) {
                        var gr = r.recordset;
                    } else {
                        var gr = [];
                    }

                    dbRequest.query('SELECT * FROM employee WHERE emp_id = @emp_id', function(error, re) {
                        if (re !== undefined && re.recordset.length > 0) {
                            var em = re.recordset[0];
                        } else {
                            var em = {}
                        }
                        resp.send({user: em, goal: g, checkin: ck, goal_review: gr});
                    })
                })
            });
        });
    });
});

// save goal preparations
app.post('/goal-prep/submit', function(req, resp) {
    connection.connect(function(err) {
        dbRequest.input('emp_id', req.session.emp_id);
        dbRequest.query('INSERT INTO goal_prep (gp_emp_id) Output Inserted.gp_id VALUES (@emp_id)', function(err, result) {
            console.log(result);
            if (result.rowsAffected.length > 0) {
                var gp_id = result.recordset[0].gp_id;
                if (typeof req.body.answer === 'object') {
                    var tx = new sql.Transaction(connection);
                    tx.begin(function(err) {
                        const table = new sql.Table('goal_prep_details');
                        table.create = true;
                        table.columns.add('question', sql.VarChar(sql.Max), {nullable: false});
                        table.columns.add('answer', sql.VarChar(sql.Max), {nullable: false});
                        table.columns.add('gpd_gp_id', sql.Int, {nullable: false});
                        
                        for (var i = 0; i < req.body.answer.length; i++) {
                            table.rows.add(req.body.question[i], req.body.answer[i], gp_id);
                        }

                        var r = new sql.Request(tx);
                        r.bulk(table, function(err) {
                            if (err) { console.log(err); }
                            tx.commit(function(err) {
                                if (err) { console.log(err); }

                                resp.redirect('/view');
                            });
                        });
                    });
                }
            }
        });
    });
});

// save goal changes
app.post('/save-goal-changes', function(req, resp) {
    connection.connect(function(err) {
        dbRequest.input('goal', req.body.goal);
        dbRequest.input('emp_id', req.session.emp_id);
        dbRequest.query('INSERT INTO goals (goal, emp_id) OUTPUT Inserted.g_id VALUES (@goal, @emp_id)', function(err, result) {
            if (err) {
                console.log(err);
            }
            var g_id = result.recordset[0].g_id;
            
            if (typeof req.body.goal_action === 'object') {
                var tx = new sql.Transaction(connection);
                tx.begin(function(err) {
                    const table = new sql.Table('actions');
                    table.create = true;
                    table.columns.add('action', sql.VarChar(sql.Max), {nullable: false});
                    table.columns.add('a_g_id', sql.Int, {nullable: false});
                    table.columns.add('due_date', sql.Date(), {nullable: false});
                    table.columns.add('hourly_cost', sql.VarChar(sql.Max), {nullable: false});
                    table.columns.add('training_cost', sql.VarChar(sql.Max), {nullable: false});
                    table.columns.add('expenses', sql.VarChar(sql.Max), {nullable: false});

                    var index = 0;
                    for (var i = 0; i < req.body.goal_action.length; i++) {
                        var dateParts = req.body.date_select[index].split('-');
                        table.rows.add(req.body.goal_action[index], parseInt(g_id), new Date(dateParts[0], dateParts[1] - 1, dateParts[2]), req.body.hourly_cost[index], req.body.training_cost[index], req.body.expenses[index]);
                        index++;
                    }
                    
                    var r = new sql.Request(tx);
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
                    dbRequest.input('a_g_id', parseInt(g_id));
                    dbRequest.input('due_date', new Date(dateParts[0], dateParts[1] -1, dateParts[2]));
                    dbRequest.input('hourly_cost', req.body.hourly_cost);
                    dbRequest.input('training_cost', req.body.training_cost);
                    dbRequest.input('expenses', req.body.expenses);
                    dbRequest.query('INSERT INTO actions (action, created_on, a_g_id, due_date, hourly_cost, training_cost, expenses) VALUES (@action, @created_on, @a_g_id, @due_date, @hourly_cost, @training_cost, @expenses)', function(err, result) {
                        resp.redirect('/view');
                    });
                });
            } 
        });
    });
});

// submit checkins
app.post('/submit-checkin/:who', function(req, resp) {
    connection.connect(function(err) {
        dbRequest.input('a_id', req.body.a_id);
        dbRequest.input('comment', req.body.comment);
        if (req.params.who === 'employee') {
            dbRequest.query('SELECT * FROM checkins WHERE c_a_id = @a_id', function(err, result) {
                if (result !== undefined && result.recordset.length > 0) {
                    resp.send({status: 'fail'});
                } else if (result !== undefined && result.recordset.length === 0) {
                    dbRequest.query('INSERT INTO checkins (c_a_id, employee_checkin_comment) VALUES (@a_id, @comment)', function(er, res) {
                        if (er) {
                            resp.send({status: 'fail'});
                        } else {
                            resp.send({status: 'success', num: req.body.a_id});
                        }
                    });
                }
            });
        } else if (req.params.who === 'manager') {
            dbRequest.query('SELECT * FROM checkins WHERE c_a_id = @a_id AND manager_checkin_comment IS NULL', function(err, result) {
                if (result !== undefined && result.recordset.length === 0) {
                    resp.send({status: 'fail'});
                } else if (result != undefined && result.recordset.length > 0) {
                    dbRequest.input('c_id', result.recordset[0].c_id);
                    dbRequest.query('UPDATE checkins SET manager_checkin_comment = @comment WHERE c_id = @c_id', function(er, res) {
                        if (result !== undefined && result.rowsAffected.length > 0) {
                            resp.send({status: 'success', num: req.body.a_id});
                        } else {
                            resp.send({status: 'fail'});
                        }
                    })
                }
            });
        }
    });
});

// submit goal review
app.post('/submit-goal-review/:who', function(req, resp) {
     connection.connect(function(err) {
        dbRequest.input('a_id', req.body.a_id);
        dbRequest.input('comment', req.body.comment);
        dbRequest.input('date', new Date());
        if (req.params.who === 'employee') {
            dbRequest.query('SELECT * FROM goal_review WHERE gr_a_id = @a_id', function(err, result) {
                if (result !== undefined && result.recordset.length > 0) {
                    resp.send({status: 'fail'});
                } else if (result !== undefined && result.recordset.length === 0) {
                    dbRequest.query('INSERT INTO goal_review (gr_a_id, employee_gr_comment, submitted_on) VALUES (@a_id, @comment, @date)', function(e, r) {
                        if (err) {
                            console.log(err);
                            resp.send({status: 'fail'});
                        } else {
                            resp.send({status: 'success', num: req.body.a_id})
                        }
                    });
                }
            });
        } else if (req.params.who === 'manager') {
            dbRequest.input('goal_progress', parseInt(req.body.goal_progress));
            dbRequest.input('goal_effectiveness', req.body.goal_effectiveness);
            dbRequest.query('SELECT * FROM goal_review WHERE gr_a_id = @a_id AND manager_gr_comment IS NULL', function(err, result) {
                if (result !== undefined && result.recordset.length === 0) {
                    resp.send({status: 'fail'});
                } else if (result !== undefined && result.recordset.length > 0) {
                    dbRequest.input('gr_id', result.recordset[0].gr_id);
                    dbRequest.query('UPDATE goal_review SET manager_gr_comment = @comment, effectiveness = @goal_effectiveness, progress = @goal_progress, reviewed_on = @date WHERE gr_id = @gr_id', function(e, r) {
                        if (e) {
                            console.log(e);
                            resp.send({status: 'fail'});
                        } else {
                            resp.send({status: 'success', num: req.body.a_id})
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

// server initialization
server.listen(port, function(err) {
    if (err) {
        console.log(err);
    }

    console.log('Server is running at ' + port);
});
