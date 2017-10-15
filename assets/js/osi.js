var actionCount = 1;
$(document).ready(function() {
    // populate period select
    //console.log(new Date(Date.now()).toLocaleDateString());
    $.ajax({
        url: '/populate-period-select',
        method: 'GET',
        success: function(resp) {
            for (var i = 0; i < resp.length; i++) {
                if (i === (resp.length - 1)) {
                    $('#period-select').append($('<option>', {
                        id: resp[i].start_date.substr(0, 10) + '_' + resp[i].end_date.substr(0, 10),
                        value: resp[i].start_date.substr(0, 10) + '_' + resp[i].end_date.substr(0, 10),
                        text: formatDate(resp[i].start_date, 'short-period') + ' - ' + formatDate(resp[i].end_date, 'short-period')
                    }).attr('selected', 'selected'));
                } else {
                    $('#period-select').append($('<option>', {
                        id: resp[i].start_date.substr(0, 10) + '_' + resp[i].end_date.substr(0, 10),
                        value: resp[i].start_date.substr(0, 10) + '_' + resp[i].end_date.substr(0, 10),
                        text: formatDate(resp[i].start_date, 'short-period') + ' - ' + formatDate(resp[i].end_date, 'short-period')
                    }));
                }
            }
        }
    });

    $('#add-action-button').click(function() {
        if (actionCount < 4) {
            addAction('action', actionCount, 'Action');
            actionCount++;
        }
    });

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
                                    text: formatDate(resp[i].start_date, 'long') + ' - ' + formatDate(resp[i].end_date, 'long')
                                }))
                            });
                        }
                    }
                });
            });
        }
    });

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

                console.log(resp);

                $(resp.goal).each(function(i) {
                    createCheckins(resp, '/submit-checkin/manager', i);
                    createGoalReview(resp, '/submit-goal-review/manager', i);
                });
                
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
});