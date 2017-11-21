// Module imports
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const sql = require('mssql');
const cookieSession = require('cookie-session');
const bamboohr = new (require('node-bamboohr'))({apikey: process.env.API_KEY, subdomain:'osimaritime'});

// server configurations
var app = express();
var http = require('http');
const server = http.createServer(app); // integrating express with server
const port = process.env.PORT;

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

// Share db instances across files
app.locals.variab = "TEST VARIABLE";

// static routes - by accessing the paths, it will pull files from subdirectories in the assets directory
app.use('/fonts', express.static('assets'));
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

// Route Modules
const authenticationRoutes = require('./routes/authenticationRoute');
app.use(authenticationRoutes);

// Local Routes
app.get('/', function(req, resp) {
    // If user has already logged in, redirect to /view
    if(req.session.emp_id){
        resp.redirect('/view')
    } else {
        resp.render('index');
    }
});

// for presentation purposes
app.get('/view/report/:goal', function(req, resp) {
    if (req.params.goal === '1') {
        resp.render('table_report');
    } else {
        resp.render('table_report_no');
    }
});

// for development purposes only
app.get('/dev', function(req, resp) {
    resp.render('dev');
});

// logged in view
app.get('/view', function(req, resp) {
    if (req.session.emp_id) {

        let dbRequest = new sql.Request(sql.globalConnection);

        dbRequest.input('emp_id', req.session.emp_id);
        if (req.query.period) {
            let dp = req.query.period.split('_');
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
            dbRequest.query('SELECT MAX(g_id) AS g_id, goal, created_on, g_emp_id, g_gp_id FROM goals WHERE g_emp_id = @emp_id GROUP BY g_id, goal, created_on, g_emp_id, g_gp_id', function(err, result) {
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

                        dbRequest.query('SELECT * FROM goals JOIN actions ON goals.g_id = actions.a_g_id WHERE start_date = @start_date AND end_date = @end_date AND g_emp_id = @emp_id', function(err, result) {
                            if (result !== undefined && result.recordset.length > 0) {
                                var action = result.recordset;
                            } else {
                                var action = [];
                            }

                            resp.render('view', {user: req.session, goal: g, checkin: c, goal_review: gr, goal_prep: gp, action: action});
                        });
                    });
                });
            });
        });
    }
    else {
        resp.render('index', {message: 'You are not logged in'});
    }
});

// get goal dates
app.get('/populate-period-select', function(req, resp) {

    let dbRequest = new sql.Request(sql.globalConnection);

    dbRequest.input('emp_id', req.session.emp_id);
    dbRequest.query('SELECT DISTINCT g_id, g_emp_id, actions.start_date, actions.end_date FROM goals JOIN actions ON goals.g_id = actions.a_g_id  WHERE goals.g_emp_id = @emp_id', function(err, result) {
        if (result !== undefined && result.recordset.length > 0) {
            resp.send(result.recordset);
        } else {
            resp.send('fail');
        }
    });
});

// get employee names to populate dropdown (manager)
app.get('/populate-manager-employee-select', function(req, resp) {

    let dbRequest = new sql.Request(sql.globalConnection);

    dbRequest.input('emp_id', req.session.emp_id);
    if(req.session.auth === 'HR') {
        dbRequest.query('SELECT * FROM employee', function(err, result) {
            if (result !== undefined && result.recordset.length > 0) {
                resp.send(result.recordset);
            } else {
                resp.send('fail');
            }
        });
    } else {
        dbRequest.query('SELECT * FROM employee WHERE manager_id = @emp_id', function (err, result) {
            if (result !== undefined && result.recordset.length > 0) {
                resp.send(result.recordset);
            } else {
                resp.send('fail');
            }
        });
    }
});

// get employee goal dates (manager)
app.get('/populate-manager-employee-date-select/:emp_id', function(req, resp) {

    let dbRequest = new sql.Request(sql.globalConnection);

    dbRequest.input('emp_id', req.params.emp_id);
    dbRequest.query('SELECT DISTINCT g_id, actions.start_date, actions.end_date FROM goals JOIN actions on goals.g_id = actions.a_g_id WHERE g_emp_id = @emp_id', function(err, result) {
        if (result !== undefined && result.recordset.length > 0) {
            resp.send(result.recordset);
        } else {
            resp.send('fail');
        }
    });
});

// get employee goals (manager)
app.post('/get-employee-goal', function(req, resp) {

    let dbRequest = new sql.Request(sql.globalConnection);

    if (req.body.emp_id !== 'no-employee') {
        bamboohr.employee(req.body.emp_id).get('supervisor', 'supervisorEId', 'hireDate','customJobCode', 'customLevel','employeeNumber', 'jobTitle', 'department', 'division', function(err, result) {
            var bambooId = result.id;
            var bambooFields = result.fields;
            if (req.body.date) {
                let dp = req.body.date.split('_');
                dbRequest.input('start_date', dp[0]);
                dbRequest.input('end_date', dp[1]);
            }
            dbRequest.input('emp_id', req.body.emp_id);
            dbRequest.query('SELECT MAX(g_id) AS g_id, goal, created_on, g_emp_id, g_gp_id FROM goals WHERE g_emp_id = @emp_id GROUP BY g_id, goal, created_on, g_emp_id, g_gp_id', function(err, result) {
                if (result !== undefined && result.recordset.length > 0) {
                    var g = result.recordset;
                    dbRequest.input('g_a_id', result.recordset[0].g_id);
                } else {
                    var g = [];
                }

                dbRequest.query('SELECT * FROM actions JOIN checkins ON actions.a_id = checkins.c_a_id WHERE actions.a_g_id = @g_a_id', function(er, res) {
                    if (res !== undefined && res.recordset.length > 0) {
                        var ck = res.recordset;
                    } else {
                        var ck = [];
                    }

                    dbRequest.query('SELECT * FROM goal_review JOIN actions ON goal_review.gr_a_id = actions.a_id WHERE actions.a_g_id = @g_a_id', function(e, r) {
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

                            dbRequest.query('SELECT * FROM goals JOIN actions ON goals.g_id = actions.a_g_id WHERE start_date = @start_date AND end_date = @end_date AND g_emp_id = @emp_id', function(err, result) {
                                if (result !== undefined && result.recordset.length > 0) {
                                    var action = result.recordset;
                                } else {
                                    var action = [];
                                }

                                dbRequest.query('SELECT * FROM goal_prep JOIN goal_prep_details ON goal_prep.gp_id = goal_prep_details.gpd_gp_id WHERE goal_prep.gp_emp_id = @emp_id', function(err, result) {
                                    if (result !== undefined && result.recordset.length > 0) {
                                        var gp = result.recordset;
                                    } else {
                                        var gp = [];
                                    }

                                    resp.send({user: em, goal: g, goal_prep: gp, checkin: ck, goal_review: gr, action: action, emp_num: bambooId, fields: bambooFields});
                                });
                            });
                        });
                    });
                });
            });
        });
    } else {
        resp.send('fail');
    }
});

// get employee from bamboohr and populate table
app.get('/populate-employee-table', function(req, resp) {

    let dbRequest = new sql.Request(sql.globalConnection);

    dbRequest.input('start_date', start_date);
    dbRequest.input('emp_id', req.session.emp_id);
    dbRequest.query('SELECT emp_id, first_name, last_name, a_id, action, a_g_id, due_date, hourly_cost, training_cost, expenses, status ' +
        'FROM employee LEFT OUTER JOIN goals ON employee.emp_id = goals.g_emp_id LEFT OUTER JOIN actions ON goals.g_id = actions.a_g_id ' +
        'WHERE start_date = @start_date OR start_date IS NULL', function(err, result) {
        if(err) {console.log(err);}
        var obj = [];
        var prevIteration;
        var prevEmpId;

        for(i in result.recordset) {
            if (result.recordset[i].emp_id !== prevEmpId) {
                var user = {};
                user.emp_id = result.recordset[i].emp_id;
                user.first_name = result.recordset[i].first_name;
                user.last_name = result.recordset[i].last_name;
                user.actions = [
                    {
                        a_id: result.recordset[i].a_id,
                        action: result.recordset[i].action,
                        status: result.recordset[i].status,
                        due_date: result.recordset[i].due_date,
                        hourly_cost: result.recordset[i].hourly_cost,
                        training_cost: result.recordset[i].training_cost,
                        expenses: result.recordset[i].expenses
                    }
                ];
                obj.push(user);
                prevEmpId = result.recordset[i].emp_id;
                prevIteration = obj.length - 1;
            } else {
                var a = {
                    a_id: result.recordset[i].a_id,
                    action: result.recordset[i].action,
                    status: result.recordset[i].status,
                    due_date: result.recordset[i].due_date,
                    hourly_cost: result.recordset[i].hourly_cost,
                    training_cost: result.recordset[i].training_cost,
                    expenses: result.recordset[i].expenses
                };
                obj[prevIteration].actions.push(a);
            }
        }

        resp.send(obj);
    });
});

// get employee actions
app.get('/get-employee-actions', function(req, resp) {

    let dbRequest = new sql.Request(sql.globalConnection);

    dbRequest.input('start_date', start_date);
    dbRequest.query('SELECT g_id, g_emp_id, a_id, action, status ' +
        'FROM actions JOIN goals ON actions.a_g_id = goals.g_id JOIN employee ON employee.emp_id = goals.g_emp_id ' +
        'WHERE actions.start_date = @start_date', function(err, result) {
        resp.send(result.recordset);
    });
});


// get employee for report selection
app.get('/get-employee-names', function(req, resp) {

    let dbRequest = new sql.Request(sql.globalConnection);

    if (req.session.auth === 'HR') {
        dbRequest.query('SELECT * FROM employee ORDER BY first_name', function(err, result) {
            if (err) {console.log(err)}

            resp.send(result.recordset);
        });
    } else {
        resp.send('not authorized');
    }
});

app.get('/get-fields', function(req, resp) {

    let dbRequest = new sql.Request(sql.globalConnection);

    if (req.session.auth === 'HR') {
        dbRequest.query('SELECT table_name, column_name ' +
            'FROM INFORMATION_SCHEMA.COLUMNS ' +
            'WHERE table_name <> \'goal_prep\' AND column_name != \'password\' AND column_name NOT LIKE \'%_id%\'', function(err, result) {
            var prev;
            var obj = {};
            for (var i = 0; i < result.recordset.length; i++) {
                if (result.recordset[i].table_name !== prev) {
                    obj[result.recordset[i].table_name] = [
                        result.recordset[i].column_name
                    ]
                    prev = result.recordset[i].table_name;
                } else {
                    obj[result.recordset[i].table_name].push(result.recordset[i].column_name);
                }
            }
            resp.send(obj);
        });
    } else {
        resp.send('not authorized');
    }
});

app.post('/manager-edit-employee-action',function(req,resp){
    
   let dbRequest = new sql.Request(sql.globalConnection); 

    dbRequest.input('a_id',req.body.a_id);
    dbRequest.query('update actions SET ')
});


app.post('/get-report', function(req, resp) {
    console.log(req.body);
});

// save goal preparations
app.post('/submit-goal-prep', function(req, resp) {
    var check = false;
    for(answer in req.body.answer) {
        if (req.body.answer[answer] === '') {
            check = true;
        }
    }

    if (check === true) {
        resp.send('invalid');
    } else {
        let dbRequest = new sql.Request(sql.globalConnection);

        dbRequest.input('emp_id', req.session.emp_id);
        dbRequest.query('INSERT INTO goal_prep (gp_emp_id) Output Inserted.gp_id VALUES (@emp_id)', function(err, result) {
            if(err){
               console.log(err)
            }
            if (result !== undefined && result.rowsAffected.length > 0) {
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

                                resp.send('success');
                            });
                        });
                    });
                } else {
                    dbRequest.input('question', req.body.question);
                    dbRequest.input('answer', req.body.answer);
                    dbRequest.input('gpd_gp_id', gp_id);
                    dbRequest.query('INSERT INTO goal_prep_details (question, answer, gpd_gp_id) VALUES (@question, @answer, @gpd_gp_id)', function(err, result) {
                        if (result.rowsAffected.length > 0) {
                            resp.send('success');
                        }
                    });
                }
            }
        });
    }
});

// update goal preparations
app.post('/update-goal-prep', function(req, resp) {

    let dbRequest = new sql.Request(sql.globalConnection);

    dbRequest.input('gpd_gp_id', req.body.gpd_gp_id[0]);
    dbRequest.input('gpd_id1', req.body.gpd_id[0]);
    dbRequest.input('gpd_id2', req.body.gpd_id[1]);
    dbRequest.input('gpd_id3', req.body.gpd_id[2]);
    dbRequest.input('gpd_id4', req.body.gpd_id[3]);
    dbRequest.input('answer1', req.body.answer[0]);
    dbRequest.input('answer2', req.body.answer[1]);
    dbRequest.input('answer3', req.body.answer[2]);
    dbRequest.input('answer4', req.body.answer[3]);
    dbRequest.query('UPDATE goal_prep_details SET answer = CASE gpd_id WHEN @gpd_id1 THEN @answer1 WHEN @gpd_id2 THEN @answer2 WHEN @gpd_id3 THEN @answer3 WHEN @gpd_id4 THEN @answer4 END', function(err, result) {
        if (err) {
            console.log(err);
            resp.send('fail');
        } else if (result !== undefined && result.rowsAffected.length > 0) {
            resp.send('success');
        }
    });
});

// save goal changes
app.post('/save-goal-changes', function(req, resp) {

    let dbRequest = new sql.Request(sql.globalConnection);

    dbRequest.input('goal', req.body.goal);
    dbRequest.input('g_gp_id', req.body.g_gp_id);
    dbRequest.input('emp_id', req.session.emp_id);
    dbRequest.query('INSERT INTO goals (goal, g_emp_id, g_gp_id) OUTPUT Inserted.g_id VALUES (@goal, @emp_id, @g_gp_id)', function(err, result) {
        if (err) {
            console.log(err);
        }
        var g_id = result.recordset[0].g_id;

        if (req.body.action) {
            if (typeof req.body.action === 'object') {
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
                    for (var i = 0; i < req.body.action.length; i++) {
                        var dateParts = req.body.due_date[index].split('-');
                        table.rows.add(req.body.action[index], parseInt(g_id), new Date(dateParts[0], dateParts[1] - 1, dateParts[2]), req.body.hourly_cost[index], req.body.training_cost[index], req.body.expenses[index]);
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
                var dateParts = req.body.due_date.split('-');

                dbRequest.input('action', req.body.action);
                dbRequest.input('created_on', new Date());
                dbRequest.input('a_g_id', parseInt(g_id));
                dbRequest.input('due_date', new Date(dateParts[0], dateParts[1] -1, dateParts[2]));
                dbRequest.input('hourly_cost', req.body.hourly_cost);
                dbRequest.input('training_cost', req.body.training_cost);
                dbRequest.input('expenses', req.body.expenses);
                dbRequest.query('INSERT INTO actions (action, created_on, a_g_id, due_date, hourly_cost, training_cost, expenses) VALUES (@action, @created_on, @a_g_id, @due_date, @hourly_cost, @training_cost, @expenses)', function(err, result) {
                    resp.redirect('/view');
                });
            }
        } else {
            if(result !== undefined && result.rowsAffected.length > 0) {
                resp.redirect('/view');
            }
        }
    });
});

// edit goal
app.post('/edit-goal', function(req, resp) {

    let dbRequest = new sql.Request(sql.globalConnection);

    dbRequest.input('g_id', req.body.g_id);
    dbRequest.input('goal', req.body.gs_goal);
    dbRequest.query('UPDATE goals SET goal = @goal Output Inserted.goal WHERE g_id = @g_id', function(err, result) {
        if(result !== undefined && result.rowsAffected.length > 0) {
            resp.send({status: 'success', goal: result.recordset[0].goal})
        } else {
            resp.send({status: 'fail'});
        }
    });
});

// delete goal
app.post('/delete-goal', function(req, resp) {

    let dbRequest = new sql.Request(sql.globalConnection);

    if (req.body.user === req.session.emp_id) {
        dbRequest.input('g_id', req.body.g_id);
        dbRequest.query('DELETE FROM goals WHERE g_id = @g_id', function(err, result) {
            if (result !== undefined && result.rowsAffected.length > 0) {
                resp.send('success');
            } else {
                resp.send('fail');
            }
        });
    }
});

// edit current actions
app.post('/edit-action', function(req, resp) {

    let dbRequest = new sql.Request(sql.globalConnection);

    dbRequest.input('a_id',req.body.a_id);
    dbRequest.input('action',req.body.action);
    dbRequest.input('due_date',req.body.due_date);
    dbRequest.input('hourly_cost',req.body.hourly_cost);
    dbRequest.input('training_cost',req.body.training_cost);
    dbRequest.input('expenses',req.body.expenses);
    dbRequest.query('UPDATE actions SET action=@action, due_date=@due_date, hourly_cost=@hourly_cost, training_cost=@training_cost, expenses=@expenses ' +
        'OUTPUT inserted.* ' +
        'WHERE a_id=@a_id',function(err,result){
        if(err) {
            // the weird numbers are for color coded console.log
            console.log(`\x1b[41m DB ERROR EDITING THE ACTION:\x1b[0m ${err}`);
        }
        console.log(result);
        if(result !== undefined && result.rowsAffected.length > 0) {
            // resp.send({status: 'success',a_id: result.recordset[0].a_id});
            resp.redirect('/view');
        }
        else{
            console.log(err);
            resp.send({status:'fail'});
        }
    });
});

// add more actions
app.post('/edit-add-action', function(req, resp) {
    console.log(req.body);

    let dbRequest = new sql.Request(sql.globalConnection);

    dbRequest.input('action', req.body.action);
    dbRequest.input('due_date', req.body.due_date);
    dbRequest.input('hourly_cost', req.body.hourly_cost);
    dbRequest.input('training_cost', req.body.training_cost);
    dbRequest.input('expenses', req.body.expenses);
    dbRequest.input('g_id', req.body.g_id);

    //Add values to this query when available
    dbRequest.query('INSERT INTO actions (action, due_date, hourly_cost, training_cost, expenses, a_g_id) VALUES (@action, @due_date, @hourly_cost, @training_cost, @expenses, @g_id)', function(err, result) {
        if(result !== undefined && result.rowsAffected.length > 0) {
            resp.send({status: 'success', goal: result.recordset})
        } else {
            console.log(err);
            resp.send({status: 'fail'});
        }
    });
});

// delete action
app.post('/delete-action', function(req, resp) {
    let dbRequest = new sql.Request(sql.globalConnection);

    dbRequest.input('a_id', req.body.a_id);
    dbRequest.query('DELETE FROM actions Output Deleted.a_id WHERE a_id = @a_id', function(err, result) {
        if(result !== undefined && result.rowsAffected.length > 0) {
            resp.send({status: 'success', a_id: result.recordset[0].a_id});
        } else {
            resp.send({status: 'fail'});
        }
    });
});

// submit checkins
app.post('/submit-checkin/:who', function(req, resp) {

    let dbRequest = new sql.Request(sql.globalConnection);

    dbRequest.input('a_id', req.body.a_id);
    dbRequest.input('comment', req.body.comment);
    dbRequest.input('date', new Date());
    if (req.params.who === 'employee') {
        dbRequest.query('SELECT * FROM checkins WHERE c_a_id = @a_id', function(err, result) {
            if (result !== undefined && result.recordset.length > 0) {
                resp.send({status: 'fail'});
            } else if (result !== undefined && result.recordset.length === 0) {
                dbRequest.query('INSERT INTO checkins (c_a_id, employee_checkin_comment, checkin_date) Output Inserted.* VALUES (@a_id, @comment, @date)', function(er, res) {
                    if (er) {
                        resp.send({status: 'fail'});
                    } else if (res !== undefined && res.rowsAffected.length > 0) {
                        resp.send({status: 'success', comment: res.recordset[0].employee_checkin_comment, date: res.recordset[0].checkin_date});
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
                dbRequest.query('UPDATE checkins SET manager_checkin_comment = @comment, m_check_in_date = @date ' +
                    'Output Inserted.* ' +
                    'WHERE c_id = @c_id', function(err, res) {
                    if(err) {
                        console.log(`\x1b[36m DB ERROR SUBMITTING THE MNG CHECKIN:\x1b[0m ${err}`)
                    }

                    if (res.rowsAffected.length > 0) {
                        console.log(res);
                        resp.send({status: 'success', comment: res.recordset[0].manager_checkin_comment, date: res.recordset[0].m_checkin_date});
                    } else {
                        resp.send({status: 'fail'});
                    }
                })
            }
        });
    }
});

// submit goal review
app.post('/submit-goal-review/:who', function(req, resp) {

    let dbRequest = new sql.Request(sql.globalConnection);

    dbRequest.input('a_id', req.body.a_id);
    dbRequest.input('comment', req.body.comment);
    dbRequest.input('date', new Date());
    if (req.params.who === 'employee') {
        dbRequest.query('SELECT * FROM goal_review WHERE gr_a_id = @a_id', function(err, result) {
            if (result !== undefined && result.recordset.length > 0) {
                resp.send({status: 'fail'});
            } else if (result !== undefined && result.recordset.length === 0) {
                dbRequest.query('INSERT INTO goal_review (gr_a_id, employee_gr_comment, submitted_on) Output Inserted.* VALUES (@a_id, @comment, @date)', function(e, r) {
                    if (err) {
                        console.log(err);
                        resp.send({status: 'fail'});
                    } else if (r !== undefined && r.rowsAffected.length > 0) {
                        resp.send({status: 'success', comment: r.recordset[0].employee_gr_comment, date: r.recordset[0].submitted_on})
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
                dbRequest.query('UPDATE goal_review SET manager_gr_comment = @comment, effectiveness = @goal_effectiveness, progress = @goal_progress, reviewed_on = @date Output Inserted.* WHERE gr_id = @gr_id', function(e, r) {
                    if (e) {
                        console.log(e);
                        resp.send({status: 'fail'});
                    } else if (r !== undefined && r.rowsAffected.length > 0) {
                        resp.send({status: 'success', comment: r.recordset[0].manager_gr_comment, date: r.recordset[0].reviewed_on})
                    }
                });
            }
        });
    }
});

app.post('/submit-action-status', function(req, resp) {

    let dbRequest = new sql.Request(sql.globalConnection);

    dbRequest.input('a_id', req.body.a_id);
    dbRequest.input('status', req.body.status);
    dbRequest.query('UPDATE actions SET status = @status Output Inserted.* WHERE a_id = @a_id', function(err, result) {
        if (result !== undefined && result.rowsAffected.length > 0) {
            resp.send({status: 'success', value: result.recordset[0].status, a_id: result.recordset[0].a_id});
        } else {
            resp.send({status: 'fail'});
        }
    });
});

app.get('/get-status-count', function(req, resp) {
    console.log(req.body);
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
const connectionPool = new sql.ConnectionPool(dbConfig, function(err) {
    if(err) {
        console.log(err);
    }
    // Stores the connection pool in a global variable so routes can access it.
    sql.globalConnection = connectionPool;

    server.listen(port, function(err) {
        if (err) {
            console.log(err);
        }

        console.log(`App running on http://localhost:${port} \n ENVIRONMENT: ${process.env.ENV_MACHINE}`);
    });
});



