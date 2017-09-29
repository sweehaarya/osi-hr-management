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

function addAction(accordion_id, id, num, header) {
    $('#action-wrapper')
    .append(
        $('<div>').addClass('accordion').attr('id', accordion_id + '-' + num).attr('role', 'tablist').attr('aria-multiselectable', 'true')
        .append(
            $('<div>').addClass('card bg-transparent mb-3')
            .append(
                $('<a>').attr('href', '#collapse-' + id + '-' + num).attr('data-toggle', 'collapse').attr('data-parent', '#' + accordion_id + '-' + num).attr('aria-expanded', 'true').attr('aria-controls', 'collapse-' + id + '-' + num)
                .append(
                    $('<div>').addClass('card-header bg-white').attr('id', id + '-' + num).attr('role', 'tab')
                    .append(
                        $('<h6>').addClass('d-inline-block mb-0 font-weight-bold').html(header + ' ' + num)
                    )
                )
            )
            .append(
                $('<div>').attr('id', 'collapse-' + id + '-' + num).addClass('collapse bg-transparent').attr('role', 'tabpanel').attr('aria-labelledby', id + '-' + num)
                .append(
                    $('<div>').addClass('goal-actions card-block')
                    .append(
                        $('<div>').addClass('form-group')
                        .append(
                            $('<label>').addClass('d-inline-block font-weight-bold text-dark-blue').html(header)
                        )
                        .append(
                            $('<input>').attr('id', 'input-action-' + num).addClass('form-control').attr('type', 'text').attr('name', 'goal-action-' + num)
                        )
                    )
                    .append(
                        $('<div>').addClass('form-inline mt-4')
                        .append(
                            $('<label>').addClass('font-weight-bold text-dark-blue mr-5').html('Due Date:')
                        )
                        .append(
                            $('<input>').addClass('form-control').attr('type', 'date').attr('id', 'date-select-' + num).attr('value', '2000-01-01')
                        )
                    )
                    .append(
                        $('<div>').addClass('card-deck mt-3')
                        .append(
                            $('<div>').addClass('card bg-transparent')
                            .append(
                                $('<div>').addClass('card-block text-center')
                                .append(
                                    $('<label>').addClass('d-block font-weight-bold text-dark-blue').html ('Hourly Cost')
                                )
                                .append(
                                    $('<input>').attr('id', 'hourly-cost-' + num).addClass('form-control').attr('type', 'text').attr('name', 'hourly-cost-' + num)
                                )
                            )
                        )
                        .append(
                            $('<div>').addClass('card bg-transparent')
                            .append(
                                $('<div>').addClass('card-block text-center')
                                .append(
                                    $('<label>').addClass('d-block font-weight-bold text-dark-blue').html ('Training Cost')
                                )
                                .append(
                                    $('<input>').attr('id', 'training-cost-' + num).addClass('form-control').attr('type', 'text').attr('name', 'training-cost-' + num)
                                )
                            )
                        )
                        .append(
                            $('<div>').addClass('card bg-transparent')
                            .append(
                                $('<div>').addClass('card-block text-center')
                                .append(
                                    $('<label>').addClass('d-block font-weight-bold text-dark-blue').html ('Expenses')
                                )
                                .append(
                                    $('<input>').attr('id', 'expenses-cost-' + num).addClass('form-control').attr('type', 'text').attr('name', 'expenses-cost-' + num)
                                )
                            )
                        )
                    )
                    .append(
                        $('<div>').addClass('text-right')
                        .append(
                            $('<button>').attr('type', 'button').attr('id', 'remove-action-' + num).html('Delete').addClass('mt-2 btn btn-danger').on('click', function() {
                                $(this).parent().parent().parent().parent().parent().remove();
                                actionNum--;
                            })
                        )
                    )
                )
            )
        )
    )
}

function test() {
    console.log('works');
}