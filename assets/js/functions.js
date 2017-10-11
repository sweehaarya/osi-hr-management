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

// add action in goal setting
function addAction(id, count, header) {
    var num = count + 1;
    $('#action-wrapper').append(
        $('<div>').addClass('accordion').attr('id', 'accordion-' + id + '-' + num).attr('role', 'tablist').attr('aria-multiselectable', 'true').append(
            $('<div>').addClass('card bg-transparent mb-3').append(
                $('<a>').addClass('action-header-link').attr('href', '#collapse-set-' + id + '-' + num).attr('data-toggle', 'collapse').attr('data-parent', '#set-' + id + '-' + num).attr('aria-expanded', 'true').attr('aria-controls', 'collapse-set-' + id + '-' + num).append(
                    $('<div>').addClass('action-header card-header bg-white').attr('id', 'set-' + id + '-' + num).attr('role', 'tab').append(
                        $('<h6>').addClass('action-header-text d-inline-block mb-0 font-weight-bold').html(header + ' ' + num)
                    )
                )
            ).append(
                $('<div>').attr('id', 'collapse-set-' + id + '-' + num).addClass('action-body collapse bg-transparent').attr('role', 'tabpanel').attr('aria-labelledby', 'set-' + id + '-' + num).append(
                    $('<div>').addClass('goal-actions card-block').append(
                        $('<div>').addClass('form-group').append(
                            $('<label>').addClass('d-inline-block font-weight-bold text-dark-blue').html(header)
                        ).append(
                            $('<input>').addClass('goal-action form-control').attr('type', 'text').attr('name', 'goal_action').attr('required', 'required')
                        )
                    ).append(
                        $('<div>').addClass('form-inline mt-4').append(
                            $('<label>').addClass('font-weight-bold text-dark-blue mr-5').html('Due Date:')
                        ).append(
                            $('<input>').addClass('date-select form-control').attr('type', 'date').attr('name', 'date_select').attr('required', 'required')
                        )
                    ).append(
                        $('<div>').addClass('card-deck mt-3').append(
                            $('<div>').addClass('card bg-transparent').append(
                                $('<div>').addClass('card-block text-center').append(
                                    $('<label>').addClass('d-block font-weight-bold text-dark-blue').html ('Hourly Cost')
                                ).append(
                                    $('<input>').addClass('form-control').attr('type', 'text').attr('name', 'hourly_cost').attr('required', 'required')
                                )
                            )
                        ).append(
                            $('<div>').addClass('card bg-transparent').append(
                                $('<div>').addClass('card-block text-center').append(
                                    $('<label>').addClass('d-block font-weight-bold text-dark-blue').html ('Training Cost')
                                ).append(
                                    $('<input>').addClass('form-control').attr('type', 'text').attr('name', 'training_cost').attr('required', 'required')
                                )
                            )
                        ).append(
                            $('<div>').addClass('card bg-transparent').append(
                                $('<div>').addClass('card-block text-center').append(
                                    $('<label>').addClass('d-block font-weight-bold text-dark-blue').html ('Expenses')
                                ).append(
                                    $('<input>').addClass('form-control').attr('type', 'text').attr('name', 'expenses')
                                )
                            )
                        )
                    ).append(
                        $('<div>').addClass('text-right').append(
                            $('<button>').attr('type', 'button').html('Delete').addClass('mt-2 btn btn-danger').on('click', function() {
                                $(this).parent().parent().parent().parent().parent().remove();
                                actionCount--;
                                $('.accordion').each(function(i) {
                                    $(this).attr('id', 'accordion-' + id + '-' + (i + 1));
                                });
                                $('.action-header-link').each(function(i) {
                                    $(this).attr('href', '#collapse-set-' + id + '-' + (i + 2)).attr('data-parent', '#set-' + id + '-' + (i + 2)).attr('aria-controls', 'collapse-set-' + id + '-' + (i + 2));
                                });
                                $('.action-header').each(function(i) {
                                    $(this).attr('id', 'set-' + id + '-' + (i + 2));
                                });
                                $('.action-header-text').each(function(i) {
                                    $(this).html(header + ' ' + (i + 2));
                                });
                                $('.action-body').each(function(i) {
                                    $(this).attr('id', 'collapse-set-' + id + '-' + (i + 2)).attr('aria-labelledby', 'set-' + id + '-' + (i + 2));
                                });
                            })
                        )
                    )
                )
            )
        )
    )
}

// create current date variables
var currentDate = new Date();
var currentYear = currentDate.getFullYear();
var currentMonth = currentDate.getMonth() + 1;
var currentDay = currentDate.getDate();
if (parseInt(currentMonth) < 10 && parseInt(currentMonth) > 3) {
    var start_date = currentYear + '-04-01';
    var end_date = currentYear + '-09-30';
    var date_code = '04' + currentYear.toString().substr(2, 2) + '-09' + currentYear.toString().substr(2 ,2);
}  else {
    var start_date = currentYear + '-10-01';
    var end_date = currentYear + 1 + '-03-31';
    var date_code = '10' + currentYear.toString().substr(2, 2) + '-03' + (currentYear + 1).toString().substr(2, 2);
}

// create action accordions
function createAction(action, form_url, a_id) {
    $('#ev-checkin-actions').addClass('accordion').attr('role', 'tablist').attr('aria-multiselectable', 'true').append(
        $('<div>').addClass('card bg-transparent mb-1').append(
            $('<a>').attr('data-toggle', 'collapse').attr('data-parent', '#ev-checkin-actions').attr('href', '#collapse-ev-checkin-actions-' + a_id).append(
                $('<div>').addClass('card-header bg-white').attr('role', 'tab').attr('id', 'ev-ca-' + a_id).append(
                    $('<h6>').addClass('d-inline-block mb-0 font-weight-bold').html(action)
                )
            )
        ).append(
            $('<div>').addClass('collapse bg-transparent').attr('role', 'tabpanel').attr('aria-labelledby', 'ev-ca-' + a_id).attr('id', 'collapse-ev-checkin-actions-' + a_id).append(
                $('<div>').addClass('card-block').text(action).append(
                    $('<div>').addClass('card bg-transparent').append(
                        $('<div>').addClass('card-block').append(
                            $('<form>').attr('method', 'POST').attr('action', form_url).append(
                                $('<div>').addClass('form-group').append(
                                    $('<label>').addClass('d-block font-weight-bold').text('Manager Comment')
                                ).append(
                                    $('<div>').addClass('d-inline-block w-85 text-dark-blue').append(
                                        $('<input>').attr('type', 'hidden').attr('name', 'c_a_id').attr('value', a_id)
                                    ).append(
                                        $('<input>').addClass('form-control').attr('type', 'text').attr('name', 'comment').attr('placeholder', "What have you observed about the employee's efforts toward this action?")
                                    )
                                ).append(
                                    $('<div>').addClass('d-inline-block w-15').append(
                                        $('<div>').addClass('d-flex justify-content-around').append(
                                            $('<button>').addClass('no-bg').attr('type', 'reset').append(
                                                $('<i>').addClass('fa fa-times fa-lg').attr('aria-hidden', 'true')
                                            )
                                        ).append(
                                            $('<button>').addClass('btn btn-primary').attr('type', 'submit').html('Submit')
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
            )
        )
    )
}

// create goal review accordions
function createGoalReview(gr, form_url, a_id) {
    $('#ev-gr-actions').addClass('accordion').attr('role', 'tablist').attr('aria-multiselectable', 'true').append(
        $('<div>').addClass('card bg-transparent mb-1').append(
            $('<a>').attr('data-toggle', 'collapse').attr('data-parent', '#ev-gr-actions').attr('href', '#collapse-ev-gr-actions-' + a_id).append(
                $('<div>').addClass('card-header bg-white').attr('role', 'tab').attr('id', 'ev-gra-' + a_id).append(
                    $('<h6>').addClass('d-inline-block mb-0 font-weight-bold').html(gr)
                )
            ) 
        ).append(
            $('<div>').addClass('collapse bg-transparent').attr('role', 'tabpanel').attr('aria-labelledby', 'ev-gra-' + a_id).attr('id', 'collapse-ev-gr-actions-' + a_id).append(
                $('<div>').addClass('card-block').append(
                    $('<div>').addClass('card bg-transparent mb-3').append(
                        $('<div>').addClass('card-block').text(gr)
                    )
                ).append(
                    $('<div>').addClass('card bg-transparent').append(
                        $('<div>').addClass('card-block').append(
                            $('<form>').attr('method', 'POST').attr('action', form_url).append(
                                $('<div>').addClass('form-group').append(
                                    $('<label>').addClass('d-block font-weight-bold').text('Manager Comment')
                                ).append(
                                    $('<input>').attr('type', 'hidden').attr('name', 'gr_a_id').attr('value', a_id)
                                ).append(
                                    $('<input>').addClass('form-control').attr('type', 'text').attr('name', 'comment').attr('placeholder', "What have you observed about the employee's efforts toward this action?")
                                )
                            ).append(
                                $('<div>').addClass('form-group mb-3').append(
                                    $('<label>').addClass('d-block font-weight-bold mr-5').text('What percent of this action was completed on time?')
                                ).append(
                                    $('<select>').addClass('form-control').attr('name', 'goal_progress').append([
                                        $('<option>').attr('value', '0').text('0%'),
                                        $('<option>').attr('value', '10').text('10%'),
                                        $('<option>').attr('value', '20').text('20%'),
                                        $('<option>').attr('value', '30').text('30%'), 
                                        $('<option>').attr('value', '40').text('40%'), 
                                        $('<option>').attr('value', '50').text('50%'), 
                                        $('<option>').attr('value', '60').text('60%'), 
                                        $('<option>').attr('value', '70').text('70%'), 
                                        $('<option>').attr('value', '80').text('80%'), 
                                        $('<option>').attr('value', '90').text('90%'), 
                                        $('<option>').attr('value', '100').text('100%'), 
                                    ])
                                )
                            ).append(
                                $('<div>').addClass('form-group mb-3').append([
                                    $('<label>').addClass('d-block font-weight-bold mr-5').text('Was this action effective towards the employees competence and knowledge?'),
                                    $('<select>').addClass('form-control').attr('name', 'goal_effectiveness').append([
                                        $('<option>').text('Not effective'),
                                        $('<option>').text('Somewhat effective'),
                                        $('<option>').text('Effective'),
                                        $('<option>').text('Very effective'),
                                        $('<option>').text('Extremely effective'),
                                    ])
                                ])
                            ).append(
                                $('<div>').addClass('text-right w-100').append(
                                    $('<button>').addClass('btn btn-primary').attr('type', 'submit').html('Submit')
                                )
                            )
                        )
                    )
                )
            )
        )
    )
}