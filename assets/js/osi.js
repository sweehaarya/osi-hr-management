var actionCount = goals.length; // number of actions currently in the DOM
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

    $('#add-action-button').click(function() {
        if (actionCount < 4) {
            addAction('action', actionCount, 'Action', $(this).attr('data-from'));
            actionCount++;
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
                    console.log(resp);
                    if (resp.status === 'success') {
                        $('#checkin-button-' + resp.num).addClass('no-click btn btn-success').html('Submitted');
                    } else if (resp.status === 'fail') {
                        $('#checkin-button-' + resp.num).addClass('no-click btn btn-danger').html('Failed');
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
                        $('#goal-review-button-' + resp.num).addClass('no-click btn btn-success').html('Submitted');
                    } else if (resp.status === 'fail') {
                        $('#goal-review-button-' + resp.num).addClass('no-click btn btn-danger').html('Failed');
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
        $.ajax({
            url: '/get-employee-goal',
            method: 'POST',
            data: {
                emp_id: $('#manager-employee-select option:selected').attr('id'),
                date: $('#manager-employee-date-select option:selected').attr('id')
            },
            success: function(resp) {
                $('#ev').css('display', 'block');
                $('#ev-overview-link').removeClass('disabled').addClass('active');
                if (resp.goal.length > 0) {
                    $('#ev-checkin-link, #ev-goal-review-link').removeClass('disabled');
                }
                $('#ev-emp-name').text(resp.user.fname + ' ' + resp.user.lname);
                $('#ev-emp-badge').text(resp.user.level);
                $('#ev-emp-id').text(resp.user.emp_id);
                $('#ev-hired-date').text(resp.user.hired_date);
                $('#ev-dept').text(resp.user.dept);
                $('#ev-division').text(resp.user.division);
                $('#ev-title').text(resp.user.title);
                $('#ev-manager').text(resp.user.manager_id);
                $('#ev-checkin-goal, #ev-gr-goal').text(resp.goal[0].goal);

                $(resp.goal).each(function(i) {
                    createCheckins(resp, '/submit-checkin/manager', i);
                    createGoalReview(resp, '/submit-goal-review/manager', i);
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
                                    $('#manager-checkin-button-' + res.num).addClass('no-click btn-success').removeClass('btn-primary').html('Submitted');
                                } else if (res.status === 'fail') {
                                    $('#manager-checkin-button-' + res.num).addClass('no-click btn-danger').removeClass('btn-primary').html('Fail');
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
                                console.log(res);
                                if (res.status === 'success') {
                                    $('#manager-gr-button-' + res.num).addClass('no-click btn-success').removeClass('btn-primary').html('Submitted');
                                } else if (res.status === 'fail') {
                                    $('#manager-gr-button-' + res.num).addClass('no-click btn-danger').removeClass('btn-primary').html('Fail');
                                }  
                            }
                        });
                    });
                });
            }
        });
    });
    // goal preparation edit button
    $('.edit-goal-prep').each(function(i) {
        $(this).attr('data-edit', 'false');

        $(this).click(function() {
            if ($(this).attr('data-edit') === 'false') {
                $(this).attr('data-edit', 'true')
                $('#answer-' + $(this).attr('id')).removeAttr('readonly');
                $(this).parent().append(
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
                )
            } else {
                return false;
            }
        });
    });
    // cancel goal prep edit and revert all edited textarea to default
    $('#goal-prep-cancel').click(function() {
        $('.answer-box').each(function(i) {
            $(this).val(goalPrep[i].answer);
        });
    });

    $('#gs-edit-goal-button').click(function() {
        if($(this).attr('data-edit') === 'false') {
            $('#gs-input-goal').removeAttr('readonly')
            $(this).parent().append([
                $('<button>').addClass('btn btn-primary mr-1').html('<i class="fa fa-share-square-o fa-lg" aria-hidden="true">').attr({
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

    $('.edit-action-button').each(function(i) {
        $(this).click(function() {
            if($(this).attr('data-edit') === 'false') {
                $(this).parent().prepend([
                    $('<button>').addClass('btn btn-primary mr-1').html('<i class="fa fa-share-square-o fa-lg" aria-hidden="true">').attr('type', 'submit'),
                    $('<button>').addClass('btn btn-danger').attr('type', 'button').html('<i class="fa fa-times fa-lg" aria-hidden="true">').click(function() {
                        $('#edit-action-' + (i + 1) + ' :input[name=action]').attr('readonly', '').val(goals[i].action);
                        $('#edit-action-' + (i + 1) + ' :input[name=due_date]').attr('readonly', '').val(formatDate(goals[i].due_date, 'yyyy-mm-dd'));
                        $('#edit-action-' + (i + 1) + ' :input[name=hourly_cost]').attr('readonly', '').val(goals[i].hourly_cost);
                        $('#edit-action-' + (i + 1) + ' :input[name=training_cost]').attr('readonly', '').val(goals[i].training_cost);
                        $('#edit-action-' + (i + 1) + ' :input[name=expenses]').attr('readonly', '').val(goals[i].expenses);
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
    })
});