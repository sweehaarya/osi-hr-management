var actionCount = actions.length; // number of actions currently in the DOM

$(document).ready(function() {
    // populate period select drop down
    $.ajax({
        url: '/populate-period-select',
        method: 'GET',
        success: function(resp) {
            if (resp.length > 0) {
                for (var i = 0; i < resp.length; i++) {
                    if (i === (resp.length - 1)) {
                        $('#period-select').append($('<option>', {
                            id: resp[i].start_date.substr(0, 10) + '_' + resp[i].end_date.substr(0, 10),
                            value: resp[i].start_date.substr(0, 10) + '_' + resp[i].end_date.substr(0, 10),
                            text: formatDate(resp[i].start_date, 'M yyyy') + ' - ' + formatDate(resp[i].end_date, 'M yyyy')
                        }).attr('selected', 'selected'));
                    } else {
                        $('#period-select').append($('<option>', {
                            id: resp[i].start_date.substr(0, 10) + '_' + resp[i].end_date.substr(0, 10),
                            value: resp[i].start_date.substr(0, 10) + '_' + resp[i].end_date.substr(0, 10),
                            text: formatDate(resp[i].start_date, 'M yyyy') + ' - ' + formatDate(resp[i].end_date, 'M yyyy')
                        }));
                    }
                }
            }
        }
    });

    var addActionStatus;
    $('#add-action-button').click(function() {
        if (actionCount < 4) {
            addAction('action', actionCount, 'Action', $(this).attr('data-from'));
            actionCount++;
        } else {
            displayStatus(2);
            clearTimeout(addActionStatus);
             addActionStatus = statusMessageTimeout();
        }
    });
    // employee checkin submission
    $('.employee-checkin').each(function(i) {
       $(this).submit(function(e) {
            e.preventDefault();
            $.ajax({
                url: '/submit-checkin/employee',
                method: 'POST',
                data: $(this).serialize(),
                success: function(resp) {
                    if (resp.status === 'success') {
                        displayStatus(3);
                        statusMessageTimeout();

                        $('<div class="alert alert-success" style="display: none;"><div><i class="fa fa-commenting-o fa-lg mr-1" aria-hidden="true"></i><b>Employee Comment:</b> ' + resp.comment + '</div><div><i class="fa fa-calendar-check-o fa-lg mr-1" aria-hidden="true"></i><b>Date Submitted:</b> ' + formatDate(resp.date, 'MMMM dd, yyyy') + '</div></div>').appendTo($('#employee-ck-comments')).slideDown('slow')
                    } else if (resp.status === 'fail') {
                        displayStatus(5);
                        statusMessageTimeout();
                    }
                }
            });
        });
    });
    // employee goal review submission
    $('.employee-goal-review').each(function(i) {
        $(this).submit(function(e) {
            e.preventDefault();
            $.ajax({
                url: '/submit-goal-review/employee',
                method: 'POST',
                data: $(this).serialize(),
                success: function(resp) {
                    if (resp.status === 'success') {
                        displayStatus(4);
                        statusMessageTimeout();

                        $('<div class="alert alert-success" style="display: none;"><div><i class="fa fa-commenting-o fa-lg mr-1" aria-hidden="true"></i><b>Employee Comment:</b> ' + resp.comment + '</div><div><i class="fa fa-calendar-check-o fa-lg mr-1" aria-hidden="true"></i><b>Date Submitted:</b> ' + formatDate(resp.date, 'MMMM dd, yyyy') + '</div></div>').appendTo($('#employee-gr-comments')).slideDown('slow')
                    } else if (resp.status === 'fail') {
                        displayStatus(5);
                        statusMessageTimeout();
                    }
                }
            })
        });
    });
    // populate the employee drop down box (manager)
    $.ajax({
        url: '/populate-manager-employee-select',
        method: 'GET',
        success: function(resp) {
            $('#manager-employee-select').append($('<option>', {
                id: 'no-employee'
            }));
            $(resp).each(function(i) {
                $('#manager-employee-select').append($('<option>', {
                    id: resp[i].emp_id,
                    name: (resp[i].first_name + '-' + resp[i].last_name).toLowerCase(),
                    text: resp[i].first_name + ' ' + resp[i].last_name
                }))
            });
            // populate the date drop down box when employee is selected (manager)
            $('#manager-employee-select').change(function() {
                $.ajax({
                    url: '/populate-manager-employee-date-select/' + $(this).children(':selected').attr('id'),
                    method: 'GET',
                    success: function(resp) {
                        if (resp === 'fail') {
                            $('#manager-employee-date-select').empty();
                        } else {
                            $('#manager-employee-date-select').empty();
                            $(resp).each(function(i) {
                                $('#manager-employee-date-select').append($('<option>', {
                                    id: (resp[i].start_date).substr(0, 10) + '_' + (resp[i].end_date).substr(0, 10),
                                    name: (resp[i].start_date).substr(0, 10) + '_' + (resp[i].end_date).substr(0, 10),
                                    text: formatDate(resp[i].start_date, 'MMMM dd, yyyy') + ' - ' + formatDate(resp[i].end_date, 'MMMM dd, yyyy')
                                }))
                            });
                        }
                    }
                });
            });
        }
    });
    // get employee data when clicking 'view'
    $('#get-employee-goal').submit(function(event) {
        event.preventDefault();
        $('#ev-link li.nav-item a').each(function(i) {
            $(this).addClass('disabled').removeClass('active');
        });
        $('#ev').hide();
        $('#fetch-employee').show();
        $('#fetch-employee-status').html('<i class="d-block fa fa-spinner fa-pulse fa-5x fa-fw mx-auto mb-2" aria-hidden="true"></i>Fetching employee data...')
        $.ajax({
            url: '/get-employee-goal',
            method: 'POST',
            data: {
                emp_id: $('#manager-employee-select option:selected').attr('id'),
                date: $('#manager-employee-date-select option:selected').attr('id')
            },
            success: function(resp) {
                console.log(resp);
                if (resp === 'fail') {
                    $('#fetch-employee-status').html('<i class="d-block fa fa-exclamation-circle fa-5x mx-auto mb-2" aria-hidden="true"></i>That employee does not exist')
                    $('#ev').hide();
                } else {
                    $('#fetch-employee').hide();
                    $('#ev-goal-overview').empty();
                    $('#plan').empty();
                    $('#ev-checkin-actions').empty();
                    $('#ev-gr-actions').empty();
                    $('#ev').css('display', 'block');

                    $('#ev-link li.nav-item a').each(function(i) {
                        $(this).removeClass('active');
                    });

                    $('#ev-overview-link').removeClass('disabled').addClass('active').removeAttr('data-original-title');
                    $('#ev-plan-link, #ev-goal-link, #ev-checkin-link, #ev-goal-review-link').attr('data-original-title', 'Employee has not set their goal preparation yet');
                    if (resp.goal_prep.length > 0) {
                        $('#ev-plan-link').removeClass('disabled').removeAttr('data-original-title');
                        $('#ev-goal-link, #ev-checkin-link, #ev-goal-review-link').attr('data-original-title', 'Employee has not set their goal yet');
                    }
                    
                    if (resp.goal.length > 0) {
                        $('#ev-goal-link, #ev-checkin-link, #ev-goal-review-link').removeClass('disabled').removeAttr('data-original-title');
                    }
                    $('#ev-emp-name').text(resp.user.first_name + ' ' + resp.user.last_name);
                    $('#ev-emp-badge').text(resp.fields.customJobCode + resp.fields.customLevel);
                    $('#ev-emp-id').text(resp.fields.employeeNumber);
                    $('#ev-hired-date').text(resp.fields.hiredDate);
                    $('#ev-dept').text(resp.fields.department);
                    $('#ev-division').text(resp.fields.division);
                    $('#ev-title').text(resp.fields.jobTitle);
                    $('#ev-manager').text(resp.fields.supervisor);
                    $('#ev-goal').text(resp.goal[0].goal);

                    $(resp.action).each(function(i) {
                        createEmployeeOverview(resp, i);
                        createCheckins(resp, '/submit-checkin/manager', i);
                        createGoalReview(resp, '/submit-goal-review/manager', i);
                    });

                    $(resp.goal_prep).each(function(i) {
                        createGoalPrep(resp.goal_prep, i);
                    });
                    // checkin submission (manager)
                    $('.manager-checkin-form').each(function(i) {
                        $(this).submit(function(e) {
                            e.preventDefault();
                            $.ajax({
                                url: '/submit-checkin/manager',
                                method: 'POST',
                                data: $(this).serialize(),
                                success: function(res) {
                                    if (res.status === 'success') {
                                        displayStatus(3);
                                        statusMessageTimeout();

                                        $('<div class="alert alert-success" style="display: none;"><div><i class="fa fa-commenting-o fa-lg mr-1" aria-hidden="true"></i><b>Manager Comment:</b> ' + res.comment + '</div><div><i class="fa fa-calendar-check-o fa-lg mr-1" aria-hidden="true"></i><b>Date Submitted:</b> ' + formatDate(res.date, 'MMMM dd, yyyy') + '</div></div>').appendTo($('#manager-ck-comments')).slideDown('slow');
                                    } else if (res.status === 'fail') {
                                        displayStatus(5);
                                        statusMessageTimeout();
                                    }  
                                }
                            });
                        });
                    });
                    // goal review submission (manager)
                    $('.manager-gr-form').each(function(i) {
                        $(this).submit(function(e) {
                            e.preventDefault();
                            $.ajax({
                                url: '/submit-goal-review/manager',
                                method: 'POST',
                                data: $(this).serialize(),
                                success: function(res) {
                                    if (res.status === 'success') {
                                        displayStatus(4);
                                        statusMessageTimeout();

                                        $('<div class="alert alert-success" style="display: none;"><div><i class="fa fa-commenting-o fa-lg mr-1" aria-hidden="true"></i><b>Manager Comment:</b> ' + res.comment + '</div><div><i class="fa fa-calendar-check-o fa-lg mr-1" aria-hidden="true"></i><b>Date Submitted:</b> ' + formatDate(res.date, 'MMMM dd, yyyy') + '</div></div>').appendTo($('#manager-gr-comments')).slideDown('slow');
                                    } else if (res.status === 'fail') {
                                        displayStatus(5);
                                        statusMessageTimeout();
                                    }  
                                }
                            });
                        });
                    });
                }
            }
        });
    });
    // goal preparation edit button
    $('.edit-goal-prep').each(function(i) {
        //$(this).attr('data-edit', 'false');

        $(this).click(function() {
            if ($(this).attr('data-edit') === 'false') {
                $(this).attr('data-edit', 'true')
                $('#answer-' + $(this).attr('id')).removeAttr('readonly');
                /* $(this).parent().append(
                    $('<div>').addClass('form-group text-right mt-1').append(
                        $('<button>').addClass('btn btn-success').attr('type', 'button').html('<i class="fa fa-save fa-lg" aria-hidden="true">').attr('data-id', $(this).attr('id')).click(function() {
                            $('#answer-' + $(this).attr('data-id')).attr('readonly', '').text($('#answer-' + $(this).attr('data-id')).val());
                            $('#' + $(this).attr('data-id')).attr('data-edit', 'false');
                            $(this).siblings().remove();
                            $(this).remove();
                        })
                    ).append(
                        $('<button>').addClass('btn btn-danger ml-1').attr('type', 'button').html('<i class="fa fa-times fa-lg" aria-hidden="true">').attr('data-id', $(this).attr('id')).click(function() {
                            $('#answer-' + $(this).attr('data-id')).attr('readonly', '').val(goalPrep[i].answer);
                            $('#' + $(this).attr('data-id')).attr('data-edit', 'false');
                            $(this).siblings().remove();
                            $(this).remove();
                        })
                    )
                ) */
            } else {
                $(this).attr('data-edit', 'false');
                $('#answer-' + $(this).attr('id')).attr('readonly', '');
            }
        });
    });
    // cancel goal prep edit and revert all edited textarea to default
    $('#goal-prep-cancel').click(function() {
        $('.answer-box').each(function(i) {
            $(this).val(goalPrep[i].answer);
        });
    });

    // edit goal button and submission
    $('#gs-edit-goal-button').click(function() {
        if($(this).attr('data-edit') === 'false') {
            $('#gs-input-goal').removeAttr('readonly')
            $(this).parent().append([
                $('<button>').addClass('btn btn-primary mr-1').html('<i class="fa fa-level-down fa-rotate-90 fa-lg mr-2" aria-hidden="true"></i>Submit').attr({
                    'type': 'submit',
                    'id': 'gs-save-goal-button'
                }).click(function(e) {
                    e.preventDefault();
                    if(confirm('Proceed to save new goal?')) {
                        $.ajax({
                            url: '/edit-goal',
                            method: 'POST',
                            data: $('#gs-edit-goal').serialize(),
                            success: function(resp) {
                                if(resp.status === 'success') {
                                    $('#gs-input-goal').attr('readonly', '').val(resp.goal);
                                    $('#gs-edit-goal-button').attr('data-edit', 'false');
                                    $('#gs-save-goal-button').remove();
                                    $('#gs-cancel-goal-button').remove();
                                }
                            }
                        })
                    }
                }),
                $('<button>').addClass('btn btn-danger').html('<i class="fa fa-times fa-lg" aria-hidden="true">').attr({
                    'type': 'button',
                    'id': 'gs-cancel-goal-button'
                }).click(function() {
                    $('#gs-input-goal').attr('readonly', '').val(goals[0].goal);
                    $(this).remove();
                    $('#gs-save-goal-button').remove();
                    $('#gs-edit-goal-button').attr('data-edit', 'false').show();
                })
            ])
            $(this).attr('data-edit', 'true');
            $(this).hide();
        }
    });

    // edit action button function
    $('.edit-action-button').each(function(i) {
         $(this).click(function() {
            if($(this).attr('data-edit') === 'false') {
                $(this).parent().prepend([
                    $('<button>').addClass('btn btn-primary mr-1').html('<i class="fa fa-level-down fa-rotate-90 fa-lg mr-2" aria-hidden="true"></i>Submit').attr('type', 'submit'),
                    $('<button>').addClass('btn btn-danger').attr('type', 'button').html('<i class="fa fa-times fa-lg" aria-hidden="true">').click(function() {
                        $('#edit-action-' + (i + 1) + ' :input[name=action]').attr('readonly', '').val(actions[i].action);
                        $('#edit-action-' + (i + 1) + ' :input[name=due_date]').attr('readonly', '').val(formatDate(actions[i].due_date, 'yyyy-mm-dd'));
                        $('#edit-action-' + (i + 1) + ' :input[name=hourly_cost]').attr('readonly', '').val(actions[i].hourly_cost);
                        $('#edit-action-' + (i + 1) + ' :input[name=training_cost]').attr('readonly', '').val(actions[i].training_cost);
                        $('#edit-action-' + (i + 1) + ' :input[name=expenses]').attr('readonly', '').val(actions[i].expenses);
                        $(this).siblings().eq(1).attr('data-edit', 'false').show();
                        $(this).siblings().eq(0).remove();
                        $(this).remove();
                    })
                ])

                $('#edit-action-' + (i + 1) + ' :input').not(':button, :hidden').each(function() {
                    $(this).removeAttr('readonly');
                });

                $(this).hide();
                $(this).attr('data-edit', 'true');
            }
        }); 
    });

    // delete action
    $('.delete-action').submit(function(e) {
        e.preventDefault();
        if (confirm('Are you sure you want to delete this action?')) {
            $.ajax({
                url: '/delete-action',
                method: 'POST',
                data: $(this).serialize(),
                success: function(resp) {
                    console.log(resp);
                }
            });
        }
    });

    // get number of submitted actions
    if (userData.auth === 'HR') {
        $.ajax({
            url: '/get-status-count',
            method: 'GET',
            success: function(resp) {
                console.log(resp);
            }
        });
    }

    // open/close notification
    $('#notification-button').click(function() {
        $('#notification').toggle(250);
    });

    // submit goal preparation
    $('#goal-prep-form').submit(function(e) {
        e.preventDefault();

        $.ajax({
            url: '/submit-goal-prep',
            method: 'POST',
            data: $('#goal-prep-form').serialize(),
            success: function(resp) {
                console.log(resp);
                if (resp === 'invalid') {
                    displayStatus(1);

                    var statusTimeout = statusMessageTimeout();

                    $('#goal-prep-button').click(function() {
                        clearTimeout(statusTimeout);

                        statusTimeout = statusMessageTimeout();
                    });

                    dismissStatus(statusTimeout);
                } else if (resp === 'success') {
                    location.reload();
                }
            }
        });
    });

    // update goal preparation
    $('#goal-prep-update').submit(function(e) {
        e.preventDefault();

        $.ajax({
            url: '/update-goal-prep',
            method: 'POST',
            data: $('#goal-prep-update').serialize(),
            success: function(resp) {
                if (resp === 'fail') {
                    displayStatus(1);

                    var statusTimeout = statusMessageTimeout();

                    $('#goal-prep-button').click(function() {
                        clearTimeout(statusTimeout);

                        statusTimeout = statusMessageTimeout();
                    });

                    dismissStatus(statusTimeout);
                }
            }
        });
    });

    $('#gs-delete-goal-button').click(function() {
        if (confirm('Are you sure you want to delete your goal? (All actions, check-ins, and goal review will be deleted as well)')) {
            $.ajax({
                url: '/delete-goal',
                method: 'POST',
                data: {
                    g_id: goals[0].g_id,
                    user: userData.emp_id
                },
                success: function(resp) {
                    displayStatus(6);

                    setTimeout(function() {
                        $('#status-message').animate({
                            'top': '-50px'
                        });

                        location.reload();
                    }, 2000);
                }
            });
        }
    });

    var table = $('#employee-table').DataTable({
        'order': [1, 'asc'],
        'columns': [
            {
                'className': 'details-control',
                'orderable': false,
                'data': null,
                'defaultContent': "<i class='pntr fa fa-minus-circle text-red text-border' aria-hidden='true'></i>",
                'width': '10%'
            },
            null,
            null,
            {'defaultContent': 'OSI Maritime'},
            {'defaultContent': 'Staff'}
        ],
        'scrollY': '50vh',
        'scrollCollapse': true,
        'paging': false
    });

    var tableLoaded = false;
    $('#admin-link').click(function() {
        if (!tableLoaded) { 
            $.ajax({
                url: '/populate-employee-table',
                method: 'GET',
                success: function(resp) {
                    console.log(resp);
                    for (i in resp) {
                        var actionTable = $('<div>').addClass('w-100 d-flex justify-content-between flex-wrap')
                        for (index in resp[i].actions) {
                            if (resp[i].actions[index].action !== null) {
                                if (resp[i].actions[index].status === 'Submitted') {
                                    var statusClass = 'btn-warning';
                                    var statusState = 'Pending';
                                } else if (resp[i].actions[index].status === 'Approved') {
                                    var statusClass = 'btn-success';
                                    var statusState = 'Approved';
                                } else if (resp[i].actions[index].status === 'Declined') {
                                    var statusClass = 'btn-danger';
                                    var statusState = 'Declined';
                                }

                                var actionCards = $('<div>').addClass('card-group').append([
                                    $('<div>').addClass('card').append(
                                        $('<div>').addClass('card-header text-center font-weight-bold').html('<i class="fa fa-calendar-times-o fa-lg mr-1" aria-hidden="true"></i>'),
                                        $('<div>').addClass('card-body text-center').html(formatDate(resp[i].actions[index].due_date, 'yyyy-mm-dd')),
                                    ),
                                    $('<div>').addClass('card').append([
                                        $('<div>').addClass('card-header text-center font-weight-bold').html('<i class="fa fa-clock-o fa-lg mr-1" aria-hidden="true"></i>'),
                                        $('<div>').addClass('card-body text-center').html(resp[i].actions[index].hourly_cost),
                                    ]),
                                    $('<div>').addClass('card').append([
                                        $('<div>').addClass('card-header text-center font-weight-bold').html('<i class="fa fa-dollar fa-lg mr-1" aria-hidden="true"></i>'),
                                        $('<div>').addClass('card-body text-center').html(resp[i].actions[index].training_cost),
                                    ]),
                                    $('<div>').addClass('card').append([
                                        $('<div>').addClass('card-header text-center font-weight-bold').html('<i class="fa fa-money fa-lg mr-1" aria-hidden="true"></i>'),
                                        $('<div>').addClass('card-body text-center').html(resp[i].actions[index].expenses),
                                    ])
                                ])

                                var action = $('<div>').addClass('action-container w-22 p-1 rounded mx-auto').append(
                                    $('<form>').addClass('form-inline justify-content-around').append([
                                        $('<button>').addClass('btn ' + statusClass + ' btn-sm').attr('id', 'action-status-button-' + resp[i].actions[index].a_id).attr('type', 'button').html('<i class="fa fa-ellipsis-h mr-1" aria-hidden="true"></i>' + statusState).popover({
                                            'title': resp[i].actions[index].action,
                                            'placement': 'top',
                                            'trigger': 'hover focus',
                                            'html': true,
                                            'template': "<div class=\"popover\" role=\"tooltip\"><div class=\"arrow\"></div><h3 class=\"popover-header\"></h3><div class=\"popover-body\"></div></div>",
                                            'content': actionCards
                                        }),
                                        $('<form>').attr({'method': 'POST', 'action': '/submit-action-status'}).append([
                                            $('<input>').attr({'type': 'hidden', 'name': 'a_id', 'value': resp[i].actions[index].a_id}),
                                            $('<select>').addClass('form-control form-control-sm').attr('name', 'status').append([
                                                $('<option>').text(''),
                                                $('<option>').attr('value', 'Submitted').text('Undecide'),
                                                $('<option>').attr('value', 'Approved').text('Approve'),
                                                $('<option>').attr('value', 'Declined').text('Decline')
                                            ])
                                        ]).change(function() {
                                            //$('#action-status-loading').addClass('d-flex justify-content-center align-items-center');
                                            $.ajax({
                                                url: '/submit-action-status',
                                                method: 'POST',
                                                data: $(this).serialize(),
                                                success: function(resp) {
                                                    console.log(resp);
                                                    if (resp.status === 'success') {
                                                        if (resp.value === 'Approved') {
                                                            $('#action-status-button-' + resp.a_id).removeClass('btn-warning btn-danger').addClass('btn-success').html('<i class="fa fa-check mr-1" aria-hidden="true"></i>Approved');
                                                        } else if (resp.value === 'Declined') {
                                                            $('#action-status-button-' + resp.a_id).removeClass('btn-success btn-warning').addClass('btn-danger').html('<i class="fa fa-times mr-1" aria-hidden="true"></i>Declined');
                                                        } else if (resp.value === 'Submitted') {
                                                            $('#action-status-button-' + resp.a_id).removeClass('btn-success btn-danger').addClass('btn-warning').html('<i class="fa fa-ellipsis-h mr-1" aria-hidden="true"></i>Pending');
                                                        }
                                                    }
                                                    //$('#action-status-loading').removeClass('d-flex justify-content-center align-items-center').css('display', 'none');
                                                }
                                            });
                                        })
                                            /* if ($(this).val() === 'Approve') {
                                                $(this).siblings().eq(0).removeClass('btn-warning btn-danger').addClass('btn-success').html('<i class="fa fa-check mr-1" aria-hidden="true"></i>Approved');
                                            } else if ($(this).val() === 'Decline') {
                                                $(this).siblings().eq(0).removeClass('btn-success btn-warning').addClass('btn-danger').html('<i class="fa fa-times mr-1" aria-hidden="true"></i>Declined')
                                            } else {
                                                $(this).siblings().eq(0).removeClass('btn-success btn-danger').addClass('btn-warning').html('<i class="fa fa-ellipsis-h mr-1" aria-hidden="true"></i>Pending')
                                            } */
                                    ])
                                )
                                actionTable.append(action);
                            }
                        } 
                        var r = table.row.add([null, resp[i].first_name, resp[i].last_name, null, null]).draw();
                        r.child(actionTable).show();
                    }

                    table.rows().nodes().to$().addClass('shown');

                    tableLoaded = true;
                    table.columns.adjust().draw();
                }
            })
        }
    });

    $('#employee-table tbody').on('click', 'td.details-control', function() {
        var tr = $(this).closest('tr');
        var row = table.row(tr);
        
        if (row.child.isShown()) {
            row.child.hide();
            tr.addClass('hidden').removeClass('shown');
            $(this).html('<i class="pntr fa fa-plus-circle text-green text-border" aria-hidden="true">')
        } else {
            row.child.show();
            tr.addClass('shown').removeClass('hidden');
            $(this).html('<i class="pntr fa fa-minus-circle text-red text-border" aria-hidden="true">')
        }  
    });

    expandCollapse('#expand-all-button', '#employee-table', table, 'expand');
    expandCollapse('#collapse-all-button', '#employee-table', table, 'collapse');

/*     $.ajax({
        url: '/populate-employee-table',
        method: 'GET',
        success: function(resp) {
            console.log(resp);
        }
    })   */
});