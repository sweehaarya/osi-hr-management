const router = require('express').Router();
const bamboohr = new (require('node-bamboohr'))({apikey: process.env.API_KEY, subdomain:'osimaritime'});
const activeDirectory = require('activedirectory2');
const sql = require('mssql');

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

    // will store @osimaritime email fetched from AD
    let userEmail;

    // start authentication
    adAuthentication();

    function adAuthentication() {
        // Authenticate through AD only if running from OSI Server
        if(process.env.ENV_MACHINE === 'server') {
            console.log('Starting AD authentication');

            // For testing purposes on OSI Server
            if(username === 'pdp') {
                console.log('Recognized pdp username, default AD account in use');
                username = 'pdp@osl.com';
                password = '4FhQWaJxdX';
            }

            username = username + '@osl.com';

            // First, authenticate user credentials
            ad.authenticate(username, password, function(err, auth) {
                if(err) console.log(`Authentication Error: ${err}`);

                // If user credentials are correct, find the username and grab the work email
                if(auth === true) {
                    console.log('User authenticated to AD');
                    ad.findUser(username, function (err, user) {
                        if (err) console.log(`ERROR: ${JSON.stringify(err)}`);

                        if (!user) console.log(`User: ${username} not found.`);
                        else {
                            // since pdp@osl.com doesn't have BambooHR, set email to default employee
                            if (username === 'pdp@osl.com') {
                                userEmail = 'elizabeth.barnard@osimaritime.com'
                            }
                            else {
                                userEmail = user.mail;
                                console.log(`User found, email: ${userEmail}`);
                            }

                            pdpLogin(userEmail);
                        }
                    });
                }
                // login credentials are incorrect
                else {
                    console.log('INCORRECT AD CREDENTIALS');
                    return resp.render('index', {message: 'Incorrect credentials'});
                }
            });
        }

        // if not running on the server, assign entered . Password is not required
        else {
            console.log('Skip AD Authentication');
            pdpLogin(username);
        }
    }

    function pdpLogin(userEmail) {

        console.log(`Starting pdpLogin`);
        let dbRequest = new sql.Request(sql.globalConnection);

        dbRequest.input('username', userEmail);
        // Check if email is in the employee table
        dbRequest.query('SELECT * FROM employee WHERE username = @username', function (err, result) {
            console.log(`Query DB with userEmail: ${userEmail}`);
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

                if (userEmail === 'mike.plett@osimaritime.com' || userEmail === 'elizabeth.barnard@osimaritime.com') {
                    fetchBamboo(userEmail);
                } else {
                    req.session.emp_id = result.recordset[0].emp_id;

                    resp.redirect('/view');
                }
            }
            else {
                console.log('OSIMARITIME EMAIL NOT FOUND IN DATABASE');
                // If email does not match in database
                return resp.render('index', {message: 'Incorrect credentials'});
            }
        });
    }

    function fetchBamboo(userEmail) {
        //Get list of employees from BambooHR API
        console.log(`API request to BambooHR`);
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

                        resp.redirect('/view');
                    });

                    // breaks the 'employee lookup' for loop , not sure if it's required since we have a return statement
                    break;
                }
            }

            console.log('NOT FOUND IN BAMBOOHR');
        });
    }
});

router.get('/logout', function(req, resp) {
    req.session = null; // destroy session
    resp.render('index', {message: 'Goodbye!'});
});

module.exports = router;