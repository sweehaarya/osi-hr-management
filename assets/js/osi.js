var actionNum = 2;
$(document).ready(function() {
    // populate period select
    //console.log(new Date(Date.now()).toLocaleDateString());
    $.ajax({
        url: '/populate-period-select',
        method: 'GET',
        success: function(resp) {
            for (var i = 0; i < resp.length; i++) {
                $('#period-select').append($('<option>', {
                    id: formatDate(resp[i].start_date, 'code') + formatDate(resp[i].end_date, 'code'),
                    text: formatDate(resp[i].start_date, 'short-period') + ' - ' + formatDate(resp[i].end_date, 'short-period')
                }));
            }
        }
    });

    $('#add-action-button').click(function() {
        if (actionNum < 5) {
            addAction('accordion-action', 'set-action', actionNum, 'Action');
            actionNum++;
        }
    });
});