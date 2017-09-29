var https = require('https');
var request = require('request');

var apiKey = "55b71886a6adf896951c9f7e77d80c252ed476a1"

var auth = 'Basic '+ new Buffer(apiKey + ':x').toString('base64');


var options = {
    hostname: 'api.bamboohr.com',
    path: "/api/gateway.php/osimaritime/v1/employees/0?fields=firstName,lastName",
    method: "GET",
    headers: {
        Accept: 'application/json',
        Authorization: auth
    }
};

var req = https.request(options, function(res) {
    console.log(`STATUS: ${res.statusCode}`);
    console.log('HEADERS: %j', res.headers);

    res.on('response', function(data) {
        console.log('Data: ');
        console.log(data);
    });
});



req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();