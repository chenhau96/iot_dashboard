$(document).ready(function () {

    $('#sidebarCollapse').on('click', function () {
        $('#sidebar').toggleClass('active');
    });

    $("#dashboard-list li").on("click", function() {
      $("#dashboard-list li").removeClass("active");
      $(this).addClass("active");
    });
});