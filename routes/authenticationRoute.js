const router = require('express').Router();
const bamboohr = new (require('node-bamboohr'))({apikey: process.env.API_KEY, subdomain:'osimaritime'});
const activeDirectory = require('activedirectory2');

// Active Directory configurations
const activeDirectoryConfig = {
    url: 'ldap://mayne.osl.com',
    baseDN: 'dc=osl,dc=com',
    username: process.env.AD_USERNAME,
    password: process.env.AD_PASSWORD,
};
const ad = new activeDirectory(activeDirectoryConfig);

// Login Bamboo API
router.post('/login-api', function(req, resp) {

    let username = req.body.username;
    let password = req.body.password;

    // @osimaritime email taken from AD after authentication
    let userEmail;

    // skips DB connection if AD authentication fails
    let isAuthenticated = false;

    // Authenticate through AD only if running from OSI Server
    if(process.env.ENV_MACHINE === 'server') {

        // For testing purposes on OSI Server
        if(username === 'pdp') {
            username = 'pdp@osl.com';
            password = '4FhQWaJxdX';
        }

        // First, authenticate user credentials
        ad.authenticate(username, password, function(err, auth) {
            if(err) console.log(`Authentication Error: ${err}`);

            // If user credentials are correct, find the username and grab the work email
            if(auth === true) {
                ad.findUser(username, function (err, user) {
                    if (err) console.log(`ERROR: ${JSON.stringify(err)}`);

                    if (!user) console.log(`User: ${username} not found.`);
                    else {

                        isAuthenticated = true;
                        // since pdp@osl.com doesn't have BambooHR, set email to default employee
                        if (username === 'pdp@osl.com') {
                            userEmail = 'elizabeth.barnard@osimaritime.com'
                        }
                        else {
                            userEmail = user.mail;
                        }
                    }
                });
            }
            // login credentials are incorrect
            else {
                isAuthenticated = false;
                return resp.render('index', {message: 'Incorrect credentials'});
            }
        });
    }

    // if not running on the server, assign default email
    else {
        console.log('Skip AD Authentication');
        userEmail = username;
    }

    if (isAuthenticated) {
        req.app.locals.dbConnection.connect(function (err) {
            if (err) {
                console.log(err)
            }

            let dbRequest = req.app.locals.dbRequest;

            dbRequest.input('username', userEmail);
            // Check if email is in the employee table
            dbRequest.query('SELECT * FROM employee WHERE username = @username', function (err, result) {
                if (err) {
                    console.log(err)
                }

                if (result.recordset.length > 0 && result.recordset[0].is_approved === true) {
                    // Store type of employee in cookie session
                    if (result.recordset[0].emp_type === 1) {
                        req.session.auth = 'Employee';
                    } else if (result.recordset[0].emp_type === 2) {
                        req.session.auth = 'Manager';
                    } else if (result.recordset[0].emp_type === 3) {
                        req.session.auth = 'HR';
                    }

                    //Get list of employees from BambooHR API
                    bamboohr.employees(function (err, employees) {
                        if (err) {
                            console.log(err)
                        }


                        // Iterate trough each employee and find employee from matching email field
                        for (let employee of employees) {
                            if (employee.fields.workEmail === userEmail) {
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
                                bamboohr.employee(req.session.emp_id).get('supervisor', 'supervisorEId', 'hireDate', 'customJobCode', 'customLevel', 'employeeNumber', 'jobTitle', 'department', 'division', function (err, result) {
                                    if (err) {
                                        console.log(err);
                                    }
                                    for (let field in result.fields) {
                                        req.session[field] = result.fields[field];
                                    }
                                    console.log(result);
                                    console.log(req.session);

                                    req.app.locals.dbConnection.close();

                                    resp.redirect('/view');
                                });

                                // breaks the 'employee lookup' for loop , not sure if it's required since we have a return statement
                                break;
                            }
                        }
                    });
                }
                else {
                    console.log('OSIMARITIME EMAIL NOT FOUND IN DATABASE');
                    req.app.locals.dbConnection.close();
                    // If email does not match in database
                    return resp.render('index', {message: 'Incorrect credentials'});
                }
            });
        });
    }
    else {
        console.log('Not Authenticated to AD');
        return resp.render('index', {message: 'Incorrect credentials'});
    }
});

router.get('/logout', function(req, resp) {
    req.app.locals.dbConnection.close();
    req.session = null; // destroy session
    resp.render('index', {message: 'Goodbye!'});
});

module.exports = router;