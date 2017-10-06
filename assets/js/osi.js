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
                        id: formatDate(resp[i].start_date, 'code') + '-' + formatDate(resp[i].end_date, 'code'),
                        value: formatDate(resp[i].start_date, 'code') + '-' + formatDate(resp[i].end_date, 'code'),
                        text: formatDate(resp[i].start_date, 'short-period') + ' - ' + formatDate(resp[i].end_date, 'short-period')
                    }).attr('selected', 'selected'));
                } else {
                    $('#period-select').append($('<option>', {
                        id: formatDate(resp[i].start_date, 'code') + '-' + formatDate(resp[i].end_date, 'code'),
                        value: formatDate(resp[i].start_date, 'code') + '-' + formatDate(resp[i].end_date, 'code'),
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
                url: '/employee/submit-checkin',
                method: 'POST',
                data: {
                    a_id: $(this).find('input[name=a_id]').val(),
                    comment: $(this).find('input[name=employee_comment]').val()
                },
                success: function(resp) {
                    var index = i + 1;
                    if (resp === 'success') {
                        $('#checkin-button-' + index).addClass('no-click btn btn-success').html('Success!');
                    } else if (resp === 'fail') {
                        $('#checkin-button-' + index).addClass('no-click btn btn-danger').html('Fail!');
                    }
                }
            });
        });
    });

    $('.employee-goal-review').each(function(i) {
        $(this).submit(function(e) {
            e.preventDefault();
            $.ajax({
                url: '/employee/submit-goal-review',
                method: 'POST',
                data: {
                    a_id: $(this).find('input[name=a_id]').val(),
                    g_id: $(this).find('input[name=g_id]').val(),
                    comment: $(this).find('input[name=comment]').val()
                },
                success: function(resp) {
                    var index = i + 1;
                    if (resp === 'success') {
                        $('#goal-review-button-' + index).addClass('no-click btn btn-success').html('Success!');
                    } else if (resp === 'fail') {
                        $('#goal-review-button-' + index).addClass('no-click btn btn-danger').html('Fail!');
                    }
                }
            })
        });
    });
});