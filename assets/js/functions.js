function formatDate(date, format) {
    var monthShort = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    var monthLong = [
        'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
    ]
    var d = date.substr(8, 2);
    var m = date.substr(5, 2);
    var monthIndex;
    var y = date.substr(0, 4);
    var ys = date.substr(2, 2);

    if (parseInt(m) < 10) {
        monthIndex = date.substr(6, 1);
    } else {
        monthIndex = m;
    }

    var day = parseInt(d);
    var month = parseInt(monthIndex) - 1;
    var monthDigit = parseInt(m);
    var year = parseInt(y);
    var yearShort = parseInt(ys);
    var result;

    if (format === 'short-period') {
        result = monthShort[month] + ' ' + year;
    } else if (format === 'long-period') {
        result = monthLong[month] + ' ' + year;
    } else if (format === 'short') {
        result = day + '-' + monthShort[month] + '-' + yearShort;
    } else if (format === 'long') {
        result = monthLong[month] + ' ' + day + ', ' + year;
    } else if (format === 'digit') {
        result = monthDigit + '-' + year;
    } else if (format === 'code') {
        result = m + yearShort.toString();
    }

    return result;
}