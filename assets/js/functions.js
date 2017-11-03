$(document).ready(function() {
    // initialize tooltip
    $('[data-toggle="tab"], [data-toggle="tooltip"]').tooltip({
        trigger: 'hover'
    });

    // initialize popover
    $('[data-toggle="popover"]').popover({
        trigger: 'hover focus',
        placement: 'left',
        html: true,
        template: '<div class="popover" role="tooltip"><div class="popover-arrow"></div><h3 class="popover-title"></h3><div class="popover-content card-group d-flex justify-content-between"></div></div>'
    });
});

function formatDate(date, format) {
    var monthShort = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    var monthLong = [
        'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
    ]
    var day = date.substr(8, 2);
    var m = date.substr(5, 2);
    var monthIndex;
    var y = date.substr(0, 4);
    var ys = date.substr(2, 2);

    if (parseInt(m) < 10) {
        monthIndex = date.substr(6, 1);
    } else {
        monthIndex = m;
    }

    var month = parseInt(monthIndex) - 1;
    var monthDigit = parseInt(m);
    var year = parseInt(y);
    var yearShort = parseInt(ys);
    var result;

    if (format === 'M yyyy') {
        result = monthShort[month] + ' ' + year;
    } else if (format === 'MMM yyyy') {
        result = monthLong[month] + ' ' + year;
    } else if (format === 'dd-M-yy') {
        result = day + '-' + monthShort[month] + '-' + yearShort;
    } else if (format === 'MMMM dd, yyyy') {
        result = monthLong[month] + ' ' + day + ', ' + year;
    } else if (format === 'yyyy-mm-dd') {
        result = year + '-' + monthDigit + '-' + day;
    } else if (format === 'mm-yyyy') {
        result = monthDigit + '-' + year;
    } else if (format === 'mmyy') {
        result = m + yearShort.toString();
    }

    return result;
}

// add action in goal setting
function addAction(id, count, header, from) {
    if(from === '2') {
        var saveButton = $('<button>').addClass('btn btn-primary mr-1').html('<i class="fa fa-level-down fa-rotate-90 fa-lg mr-2" aria-hidden="true"></i>Submit').attr('type', 'submit').click(function(e) {
            e.preventDefault();
            $.ajax({
                url: '/edit-add-action',
                method: 'POST',
                data: $(this).parents('form:first').serialize(),
                success: function(resp) {
                    console.log(resp);
                }
            });
        });
        var actionForm = '<form>';
        var formAttr = {'method': 'POST', 'action': '/edit-add-action', 'id': 'gs-add-action-' + (count + 1)}
        var g_id = goals[0].g_id;
    } else {
        var actionForm = '<div>';
        var formAttr = {};
        var g_id;
    }
    var num = count + 1;
    $('#action-wrapper').append(
        $(actionForm).attr(formAttr).append(
            $('<div>').addClass('accordion').attr('id', 'accordion-' + id + '-' + num).attr('role', 'tablist').attr('aria-multiselectable', 'true').append([
                $('<input>').attr({'type': 'hidden', 'name': 'goal_id', 'value': g_id}),
                $('<div>').addClass('card bg-transparent mb-3').append(
                    $('<a>').addClass('action-header-link').attr('href', '#collapse-set-' + id + '-' + num).attr('data-toggle', 'collapse').attr('data-parent', '#set-' + id + '-' + num).attr('aria-expanded', 'true').attr('aria-controls', 'collapse-set-' + id + '-' + num).append(
                        $('<div>').addClass('action-header card-header bg-white').attr('id', 'set-' + id + '-' + num).attr('role', 'tab').append(
                            $('<div>').addClass('action-header-text d-inline-block mb-0 h6 font-weight-bold').html('<i class="fa fa-dot-circle-o fa-lg mr-1" aria-hidden="true"></i>' + header + ' ' + num)
                        )
                    ),
                    $('<div>').attr('id', 'collapse-set-' + id + '-' + num).addClass('action-body collapse bg-transparent show').attr('role', 'tabpanel').attr('aria-labelledby', 'set-' + id + '-' + num).append(
                        $('<div>').addClass('goal-actions card-block').append(
                            $('<div>').addClass('form-group').append(
                                $('<label>').addClass('d-inline-block font-weight-bold text-dark-blue').html('<i class="fa fa-dot-circle-o fa-lg mr-1" aria-hidden="true"></i>' + header)
                            ).append(
                                $('<input>').addClass('goal-action form-control').attr('type', 'text').attr('name', 'goal_action').attr('required', 'required')
                            )
                        ).append(
                            $('<div>').addClass('form-inline mt-4').append(
                                $('<label>').addClass('font-weight-bold text-dark-blue mr-5').html('<i class="fa fa-calendar-times-o fa-lg mr-1" aria-hidden="true"></i> Due Date:')
                            ).append(
                                $('<input>').addClass('date-select form-control').attr('type', 'date').attr('name', 'date_select').attr('required', 'required')
                            )
                        ).append(
                            $('<div>').addClass('card-deck mt-3').append(
                                $('<div>').addClass('card bg-transparent').append(
                                    $('<div>').addClass('card-block text-center').append(
                                        $('<label>').addClass('d-block font-weight-bold text-dark-blue').html ('<i class="fa fa-clock-o fa-lg mr-1" aria-hidden="true"></i> Hourly Cost')
                                    ).append(
                                        $('<input>').addClass('form-control').attr('type', 'text').attr('name', 'hourly_cost')
                                    )
                                )
                            ).append(
                                $('<div>').addClass('card bg-transparent').append(
                                    $('<div>').addClass('card-block text-center').append(
                                        $('<label>').addClass('d-block font-weight-bold text-dark-blue').html ('<i class="fa fa-dollar fa-lg mr-1" aria-hidden="true"></i> Training Cost')
                                    ).append(
                                        $('<input>').addClass('form-control').attr('type', 'text').attr('name', 'training_cost')
                                    )
                                )
                            ).append(
                                $('<div>').addClass('card bg-transparent').append(
                                    $('<div>').addClass('card-block text-center').append(
                                        $('<label>').addClass('d-block font-weight-bold text-dark-blue').html ('<i class="fa fa-money fa-lg mr-1" aria-hidden="true"></i> Expenses')
                                    ).append(
                                        $('<input>').addClass('form-control').attr('type', 'text').attr('name', 'expenses')
                                    )
                                )
                            )
                        ).append(
                            $('<div>').addClass('text-right mt-2').append([
                                saveButton,
                                $('<button>').attr('type', 'button').html('<i class="fa fa-trash fa-lg mr-1" aria-hidden="true"></i>Remove').addClass('btn btn-danger').on('click', function() {
                                    $(this).parent().parent().parent().parent().parent().remove();
                                    actionCount--;
                                    $('.accordion').each(function(i) {
                                        $(this).attr('id', 'accordion-' + id + '-' + (i));
                                    });
                                    $('.action-header-link').each(function(i) {
                                        $(this).attr('href', '#collapse-set-' + id + '-' + (i + 1)).attr('data-parent', '#set-' + id + '-' + (i + 1)).attr('aria-controls', 'collapse-set-' + id + '-' + (i + 1));
                                    });
                                    $('.action-header').each(function(i) {
                                        $(this).attr('id', 'set-' + id + '-' + (i + 1));
                                    });
                                    $('.action-header-text').each(function(i) {
                                        $(this).html(header + ' ' + (i + 1));
                                    });
                                    $('.action-body').each(function(i) {
                                        $(this).attr('id', 'collapse-set-' + id + '-' + (i + 1)).attr('aria-labelledby', 'set-' + id + '-' + (i + 1));
                                    });
                                })
                            ])
                        )
                    )
                )
            ])
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
function createCheckins(go, form_url, i) {
    if (i === 0) { // check if it's first one created
        var collapsed = 'collapsed';
        var show = 'show';
    } else {
        var collapsed;
        var show;
    }

    var checkinEmployeeComment;
    var checkinEmployeeCommentStatus;
    var checkinManagerComment;

    if (go.checkin.length > 0) {
        $(go.checkin).each(function(index) {
            if (go.action[i].a_id === go.checkin[index].c_a_id) {
                checkinEmployeeCommentStatus = true;
                checkinEmployeeComment = $('<div>').addClass('card-footer card-info-light d-flex justify-content-start align-items-center').append(
                    $('<div class="mr-3">').html('<i class="fa fa-commenting-o fa-2x" aria-hidden="true"></i>')
                ).append(
                    $('<div>').append(
                        $('<span>').addClass('d-block').html('<b>Employee Comment:</b> ' + go.checkin[index].employee_checkin_comment)
                    ). append(
                        $('<span>').html('<b>Submitted on:</b> ' + formatDate(go.checkin[index].checkin_date, 'MMMM dd, yyyy'))
                    )
                )
                return false;
            } else {
                checkinEmployeeCommentStatus = false;
                checkinEmployeeComment = $('<div>').addClass('card-footer card-danger-light d-flex align-items-center font-weight-bold').html('<i class="fa fa-exclamation-circle fa-lg mr-1" aria-hidden="true"></i> Employee has not check into this action')
            }
        });
    } else {
        checkinEmployeeCommentStatus = false;
        checkinEmployeeComment = $('<div>').addClass('card-footer card-danger-light d-flex align-items-center font-weight-bold').html('<i class="fa fa-exclamation-circle fa-lg mr-1" aria-hidden="true"></i> Employee has not check into this action')
    }

    if (go.checkin.length > 0) {
        $(go.checkin).each(function(index) {
            if (go.action[i].a_id === go.checkin[index].c_a_id && go.checkin[index].manager_checkin_comment) {
                checkinManagerComment = $('<div>').addClass('alert alert-success mb-3').append(
                    $('<div>').addClass('h6 font-weight-bold').html('<i class="fa fa-check fa-lg mr-1" aria-hidden="true"></i> You already submitted your checkin for this employee&#39;s action')
                )
                return false;
            } else {
                if (checkinEmployeeCommentStatus) {
                    var state = false;
                } else {
                    var state = true;
                }
                checkinManagerComment = $('<form>').addClass('manager-checkin-form').attr('method', 'POST').attr('action', form_url).append(
                    $('<div>').addClass('form-group').append(
                        $('<label>').addClass('d-block font-weight-bold').text('Manager Comment')
                    ).append(
                        $('<div>').addClass('d-inline-block w-85 align-top').append(
                            $('<input>').attr({'type': 'hidden', 'name': 'a_id', 'value': go.action[i].a_id})
                        ).append(
                            $('<input>').addClass('form-control').attr({'type': 'text', 'name': 'comment', 'placeholder': "What have you observed about the employee's efforts toward this action?", 'disabled': state, 'title': 'Make sure employee check-in first. Simultaneous check-in can cause an error.', 'data-toggle': 'tooltip'})
                        )
                    ).append(
                        $('<div>').addClass('d-inline-block w-15 align-top').append(
                            $('<div>').addClass('d-flex justify-content-around').append(
                                $('<button>').addClass('no-bg').attr('type', 'reset').append(
                                    $('<i>').addClass('fa fa-times fa-lg').attr('aria-hidden', 'true')
                                )
                            ).append(
                                $('<button>').addClass('btn btn-primary').attr('id', 'manager-checkin-button-' + go.action[i].a_id).attr('type', 'submit').html('<i class="fa fa-level-down fa-rotate-90 fa-lg mr-2" aria-hidden="true"></i>Submit')
                            )
                        )
                    )
                )
            }
        });
    }  else {
        if (checkinEmployeeCommentStatus) {
            var state = false;
        } else {
            var state = true;
        }
        checkinManagerComment = $('<form>').addClass('manager-checkin-form').attr('method', 'POST').attr('action', form_url).append(
            $('<div>').addClass('form-group').append(
                $('<label>').addClass('d-block font-weight-bold').text('Manager Comment')
            ).append(
                $('<div>').addClass('d-inline-block w-85 align-top').append(
                    $('<input>').attr({'type': 'hidden', 'name': 'a_id', 'value': go.action[i].a_id})
                ).append(
                    $('<input>').addClass('form-control').attr({'type': 'text', 'name': 'comment', 'placeholder': "What have you observed about the employee's efforts toward this action?", 'disabled': state})
                )
            ).append(
                $('<div>').addClass('d-inline-block w-15 align-top').append(
                    $('<div>').addClass('d-flex justify-content-around').append(
                        $('<button>').addClass('no-bg').attr('type', 'reset').append(
                            $('<i>').addClass('fa fa-times fa-lg').attr('aria-hidden', 'true')
                        )
                    ).append(
                        $('<button>').addClass('btn btn-primary').attr('id', 'manager-checkin-button-' + go.action[i].a_id).attr('type', 'submit').html('<i class="fa fa-level-down fa-rotate-90 fa-lg mr-2" aria-hidden="true"></i>Submit')
                    )
                )
            )
        )
    }

    $('#ev-checkin-actions').addClass('accordion').attr('role', 'tablist').attr('aria-multiselectable', 'true').append(
        $('<div>').addClass('card bg-transparent mb-1').append(
            $('<a>').addClass(collapsed).attr('data-toggle', 'collapse').attr('data-parent', '#ev-checkin-actions').attr('href', '#collapse-ev-checkin-actions-' + go.action[i].a_id).append(
                $('<div>').addClass('card-header bg-white').attr('role', 'tab').attr('id', 'ev-ca-' + go.action[i].a_id).append(
                    $('<h6>').addClass('d-inline-block mb-0').html('<i class="fa fa-dot-circle-o fa-lg mr-1" aria-hidden="true"></i>' + go.action[i].action)
                )
            )
        ).append(
            $('<div>').addClass('collapse bg-transparent ' + show).attr('role', 'tabpanel').attr('aria-labelledby', 'ev-ca-' + go.action[i].a_id).attr('id', 'collapse-ev-checkin-actions-' + go.action[i].a_id).append([
                $('<div>').addClass('card-block').append([
                    $('<div>').attr('id', 'manager-ck-comments'),
                    checkinManagerComment
                ]),
                checkinEmployeeComment
            ])
        )
    )
}

// create goal review accordions
function createGoalReview(go, form_url, i) {
    if (i === 0) { // check if it's first one created
        var collapsed = 'collapsed';
        var show = 'show';
    } else {
        var collapsed;
        var show;
    }

    var grEmployeeComment;
    var grEmployeeCommentStatus;
    var grManagerComment;

    if (go.goal_review.length > 0) {
        var gr_id = go.goal_review[0].gr_id;
        $(go.goal_review).each(function(index) {
            if (go.action[i].a_id === go.goal_review[index].gr_a_id) {
                grEmployeeCommentStatus = true;
                grEmployeeComment = $('<div>').addClass('card-footer card-info-light d-flex justify-content-start align-items-center').append(
                    $('<div class="mr-3">').html('<i class="fa fa-commenting-o fa-2x" aria-hidden="true"></i>')
                ).append(
                    $('<div>').append(
                        $('<span>').addClass('d-block').html('<b>Employee Comment:</b> ' + go.goal_review[index].employee_gr_comment)
                    ).append(
                        $('<span>').html('<b>Submitted on:</b> ' + formatDate(go.goal_review[index].submitted_on, 'MMMM dd, yyyy'))
                    )
                )
                return false;
            } else {
                grEmployeeCommentStatus = false;
                grEmployeeComment = $('<div>').addClass('card-footer card-danger-light d-flex align-items-center font-weight-bold').html('<i class="fa fa-exclamation-circle fa-lg mr-1" aria-hidden="true"></i>Employee has not submitted a review for this action')
            }
        });
    } else {
        grEmployeeCommentStatus = false;
        grEmployeeComment = $('<div>').addClass('card-footer card-danger-light d-flex align-items-center font-weight-bold').html('<i class="fa fa-exclamation-circle fa-lg mr-1" aria-hidden="true"></i>Employee has not submitted a review for this action')
    }

    if (go.goal_review.length > 0) {
        $(go.goal_review).each(function(index) {
            if (go.action[i].a_id === go.goal_review[index].gr_a_id && go.goal_review[index].manager_gr_comment) {
                grManagerComment = $('<div>').addClass('alert alert-success mb-3').append(
                    $('<div>').addClass('h6 font-weight-bold').html("<i class='fa fa-check fa-lg mr-1' aria-hidden='true'></i>You already submitted a review for this employee's action on " + formatDate(go.goal_review[index].reviewed_on, 'MMMM dd, yyyy'))
                );
                return false;
            } else {
                if (grEmployeeCommentStatus) {
                    var state = false;
                } else {
                    var state = true;
                }
                grManagerComment = $('<form>').addClass('manager-gr-form').attr('method', 'POST').attr('action', form_url).append(
                    $('<div>').addClass('form-group').append(
                        $('<label>').addClass('d-block font-weight-bold').text('Manager Comment')
                    ).append(
                        $('<input>').attr({'type': 'hidden', 'name': 'a_id', 'value': go.action[i].a_id})
                    ).append(
                        $('<input>').addClass('form-control').attr({'type': 'text', 'name': 'comment', 'placeholder': "What have you observed about the employee's efforts toward this action?", 'disabled': state})
                    )
                ).append(
                    $('<div>').addClass('form-group mb-3').append(
                        $('<label>').addClass('d-block font-weight-bold mr-5').text('What percent of this action was completed on time?')
                    ).append(
                        $('<select>').attr({'name': 'goal_progress', 'required': 'required', 'disabled': state}).addClass('form-control').append([
                            $('<option>'),
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
                        $('<select>').addClass('form-control').attr({'name': 'goal_effectiveness', 'required': 'required', 'disabled': state}).append([
                            $('<option>'),
                            $('<option>').text('Not effective'),
                            $('<option>').text('Somewhat effective'),
                            $('<option>').text('Effective'),
                            $('<option>').text('Very effective'),
                            $('<option>').text('Extremely effective'),
                        ])
                    ])
                ).append(
                    $('<div>').addClass('text-right w-100').append(
                        $('<button>').addClass('btn btn-primary').attr('type', 'submit').attr('id', 'manager-gr-button-' + go.action[i].a_id).html('<i class="fa fa-level-down fa-rotate-90 fa-lg mr-2" aria-hidden="true"></i>Submit')
                    )
                )
            }
        })
    } else {
        if (grEmployeeCommentStatus) {
            var state = false;
        } else {
            var state = true;
        }
        grManagerComment = $('<form>').addClass('manager-gr-form').attr('method', 'POST').attr('action', form_url).append(
            $('<div>').addClass('form-group').append(
                $('<label>').addClass('d-block font-weight-bold').text('Manager Comment')
            ).append(
                $('<input>').attr({'type': 'hidden', 'name': 'a_id', 'value': go.action[i].a_id})
            ).append(
                $('<input>').addClass('form-control').attr({'type': 'text', 'name': 'comment', 'placeholder': "What have you observed about the employee's efforts toward this action?", 'disabled': state})
            )
        ).append(
            $('<div>').addClass('form-group mb-3').append(
                $('<label>').addClass('d-block font-weight-bold mr-5').text('What percent of this action was completed on time?')
            ).append(
                $('<select>').attr({'name': 'goal_progress', 'required': 'required', 'disabled': state}).addClass('form-control').append([
                    $('<option>'),
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
                $('<select>').addClass('form-control').attr({'name': 'goal_effectiveness', 'required': 'required', 'disabled': state}).append([
                    $('<option>'),
                    $('<option>').text('Not effective'),
                    $('<option>').text('Somewhat effective'),
                    $('<option>').text('Effective'),
                    $('<option>').text('Very effective'),
                    $('<option>').text('Extremely effective'),
                ])
            ])
        ).append(
            $('<div>').addClass('text-right w-100').append(
                $('<button>').addClass('btn btn-primary').attr('type', 'submit').attr('id', 'manager-gr-button-' + go.action[i].a_id).html('<i class="fa fa-level-down fa-rotate-90 fa-lg" aria-hidden="true"></i>')
            )
        )
    }

    $('#ev-gr-actions').addClass('accordion').attr('role', 'tablist').attr('aria-multiselectable', 'true').append(
        $('<div>').addClass('card bg-transparent mb-1').append(
            $('<a>').addClass(collapsed).attr('data-toggle', 'collapse').attr('data-parent', '#ev-gr-actions').attr('href', '#collapse-ev-gr-actions-' + go.action[i].a_id).append(
                $('<div>').addClass('card-header bg-white').attr('role', 'tab').attr('id', 'ev-gra-' + go.action[i].a_id).append(
                    $('<h6>').addClass('d-inline-block mb-0').html('<i class="fa fa-dot-circle-o fa-lg mr-1" aria-hidden="true"></i>' + go.action[i].action)
                )
            ) 
        ).append(
            $('<div>').addClass('collapse bg-transparent ' + show).attr('role', 'tabpanel').attr('aria-labelledby', 'ev-gra-' + go.action[i].a_id).attr('id', 'collapse-ev-gr-actions-' + go.action[i].a_id).append([
                $('<div>').addClass('card-block').append([
                    $('<div>').attr('id', 'manager-gr-comments'),
                    grManagerComment
                ]),
                grEmployeeComment
            ])
        )
    )
}

function createGoalPrep(obj, i) {
    $('#plan').append(
        $('<div>').addClass('card bg-transparent mb-3').append(
            $('<div>').addClass('card-block').append(
                $('<h6>').text(obj[i].question)
            ).append(
                $('<div>').addClass('card card-light').append(
                    $('<div>').addClass('card-block').html(obj[i].answer)
                )
            )
        )
    )
}

function createEmployeeOverview(obj, i) {
    if (userData.auth === 'HR' && obj.action[i].status === 'Submitted') {
        var statusSelect = $('<div>').addClass('card-footer bg-transparent').append(
            $('<form>').addClass('submit-action.status').attr({'method': 'POST', 'action': '/submit-action-status'}).append([
                $('<input>').attr({'type': 'hidden', 'name': 'a_id', 'value': obj.action[i].a_id}),
                $('<div>').addClass('w-5 d-inline-block align-middle text-dark-blue font-weight-bold').html('<i class="fa fa-thumbs-o-up fa-lg mr-1" aria-hidden="true"></i>'),
                $('<div>').addClass('w-85 d-inline-block align-middle').append(
                    $('<select>').addClass('form-control').attr('name', 'action_status').append([
                        $('<option>').attr('value', 'approve').text('Approve'),
                        $('<option>').attr('value', 'decline').text('Decline')
                    ]).change(function() {
                        if ($('option:selected', this).attr('value') === 'approve') {
                            $(this).parent().parent().children().eq(1).html('<i class="fa fa-thumbs-o-up fa-lg mr-1" aria-hidden="true"></i>')
                        } else if ($('option:selected', this).attr('value') === 'decline') {
                            $(this).parent().parent().children().eq(1).html('<i class="fa fa-thumbs-o-down fa-lg mr-1" aria-hidden="true"></i>')
                        }
                    })
                ),
                $('<div>').addClass('w-10 d-inline-block text-right align-middle').append(
                    $('<button>').addClass('btn btn-primary').attr('type', 'button').html('<i class="fa fa-level-down fa-rotate-90 fa-lg mr-2" aria-hidden="true"></i>Submit').click(function() {
                        if (confirm('Do you want to ' + $(this).parent().parent().children().eq(1).children().val().toLowerCase() + ' this action?')) {
                            $(this).parent().parent().submit();
                        }
                    })
                )
            ])
        )
    } else if (userData.auth === 'HR' && obj.action[i].status === 'Approved') {
        var statusSelect = $('<div>').addClass('card-footer card-success-light').html('<i class="fa fa-check fa-lg mr-1" aria-hidden="true"></i>This action has been approved.')
    }else if (userData.auth === 'HR' && obj.action[i].status === 'Declined') {
        var statusSelect = $('<div>').addClass('.card-footer card-danger-light').html('<i class="fa fa-times fa-lg mr-1" aria-hidden="true"></i>This action has been approved.')
    } else {
        var statusSelect;
    }
    $('#ev-goal-overview').append(
        $('<div>').addClass('card bg-transparent mb-3').append(
            $('<div>').addClass('card-header').append(
                $('<h6>').addClass('mb-0').html('<i class="fa fa-dot-circle-o fa-lg mr-1" aria-hidden="true"></i> ' + obj.action[i].action)
            )
        ).append([
            $('<div>').addClass('card-block d-flex justify-content-between').append([
                $('<div>').addClass('card bg-transparent w-24').append(
                    $('<div>').addClass('card-block text-center').append([
                        $('<label>').addClass('d-block font-weight-bold text-dark-blue').html('<i class="fa fa-calendar-times-o fa-lg mr-1" aria-hidden="true"></i>Due Date'),
                        $('<span>').text(formatDate(obj.action[i].due_date, 'dd-M-yy'))
                    ])
                ),
                $('<div>').addClass('card bg-transparent w-24').append(
                    $('<div>').addClass('card-block text-center').append([
                        $('<label>').addClass('d-block font-weight-bold text-dark-blue').html('<i class="fa fa-clock-o fa-lg mr-1" aria-hidden="true"></i>Hourly Cost'),
                        $('<span>').text(obj.action[i].hourly_cost)
                    ])
                ),
                $('<div>').addClass('card bg-transparent w-24').append(
                    $('<div>').addClass('card-block text-center').append([
                        $('<label>').addClass('d-block font-weight-bold text-dark-blue').html('<i class="fa fa-dollar fa-lg mr-1" aria-hidden="true"></i>Training Cost'),
                        $('<span>').text(obj.action[i].training_cost)
                    ])
                ),
                $('<div>').addClass('card bg-transparent w-24').append(
                    $('<div>').addClass('card-block text-center').append([
                        $('<label>').addClass('d-block font-weight-bold text-dark-blue').html('<i class="fa fa-money fa-lg mr-1" aria-hidden="true"></i>Expenses'),
                        $('<span>').text(obj.action[i].expenses)
                    ])
                )
            ])
        ]).append(
            statusSelect
        )
    )
}

function displayStatus(statusCode) {
    if (statusCode === 1) {
        var statusMessage = '<i class="fa fa-exclamation-circle fa-lg mr-1" aria-hidden="true"></i>All fields are required';
        var statusClass = 'card-danger';
    } else if (statusCode === 2) {
        var statusMessage = '<i class="fa fa-warning fa-lg mr-1" aria-hidden="true"></i>Cannot add more than 4 actions';
        var statusClass = 'card-warning';
    } else if (statusCode === 3) {
        var statusMessage = '<i class="fa fa-check fa-lg mr-1" aria-hidden="true"></i>Check-in submitted';
        var statusClass = 'card-success';
    } else if (statusCode === 4) {
        var statusMessage = '<i class="fa fa-check fa-lg mr-1" aria-hidden="true"></i>Goal Review submitted';
        var statusClass = 'card-success';
    } else if (statusCode === 5) {
        var statusMessage = '<i class="fa fa-exclamation-circle fa-lg mr-1" aria-hidden="true"></i>An error occurred';
        var statusClass = 'card-danger';
    } else if (statusCode === 6) {
        var statusMessage = '<i class="fa fa-check fa-lg mr-1" aria-hidden="true"></i>Goal successfully deleted';
        var statusClass = 'card-success';
    }

    $('#status-message div').html(statusMessage);
    $('#status-message').addClass(statusClass).animate({
        'top': '0'
    });
}

function dismissStatus(timeout) {
    $('#dismiss-status-message').click(function() {
        clearTimeout(timeout);
        $('#status-message').animate({
            'top': '-50px'
        });
    });
}

function statusMessageTimeout() {
    setTimeout(function() {
        $('#status-message').animate({
            'top': '-50px'
        })
    }, 2000);
}

function expandAll(button, parentTable, dataTable) {
    $(button).click(function() {
        var hiddenRows = $(parentTable).find('tbody tr.hidden');
        for(var i = 0; i < hiddenRows.length; i++) {
            var tr = hiddenRows[i];
            var row = dataTable.row(tr);
            row.child.show();
            $(tr).addClass('shown').removeClass('hidden');
            $(tr).find('.details-control').html('<i class="pntr fa fa-minus-circle text-red text-border" aria-hidden="true">');
        }
    });
}

function collapseAll(button, parentTable, dataTable) {
    $(button).click(function() {
        var shownRows = $(parentTable).find('tbody tr.shown');
        for(var i = 0; i < shownRows.length; i++) {
            var tr = shownRows[i];
            var row = dataTable.row(tr);
            row.child.hide();
            $(tr).addClass('hidden').removeClass('shown');
            $(tr).find('.details-control').html('<i class="pntr fa fa-plus-circle text-green text-border" aria-hidden="true">');
        }
    })
}

function expandCollapse(button, parentTable, dataTable, type) {
    if (type === 'collapse') {
        var addClass = 'hidden';
        var removeClass = 'shown';
        var buttonHTML = '<i class="pntr fa fa-plus-circle text-green text-border" aria-hidden="true">';
    } else if (type === 'expand') {
        var addClass = 'shown';
        var removeClass = 'hidden';
        var buttonHTML = '<i class="pntr fa fa-minus-circle text-red text-border" aria-hidden="true">';
    }

    $(button).click(function() {
        var shownRows = $(parentTable).find('tbody tr.' + removeClass);
        for(var i = 0; i < shownRows.length; i++) {
            var tr = shownRows[i];
            var row = dataTable.row(tr);
            if (type === 'expand') {
                row.child.show();
            } else if (type === 'collapse') {
                row.child.hide();
            }
            $(tr).addClass(addClass).removeClass(removeClass);
            $(tr).find('.details-control').html(buttonHTML);
        }
    })
}