
var updateInterval = 30000; // 30s
var formatTime = d3.timeFormat("%a, %B %d %Y, %X");

// API URL for device configuration
var deviceConfigAPI = 'http://localhost:8000/api/device-config/';

// After everything (HTML elements) is loaded
document.addEventListener("DOMContentLoaded", function(event) {
  // Get all device IDs
  var dev_id_arr = getAllDevicesId();

  // Set the class name for status
  for (var i = 0; i < dev_id_arr.length; i++)
    setStatusClassName(dev_id_arr[i]);

  // First update on device status
  updateMultipleDeviceStatus(dev_id_arr);

  // Update the table based on updateInterval value
  setInterval(function() {
    updateMultipleDeviceStatus(dev_id_arr);
  }, updateInterval);
});

// Get device ID function for the modal
// This is for Delete button
function getDeviceId(device_id) {
  // Set modal-body text
  $('.modal-body').text("Delete device with ID \"" + device_id + "\"?");

  // Set anchor link href attribute in the modal delete button
  $('#delete').attr('href',
    "http://localhost:8000/dashboard/devices/management/delete/" + device_id);
}

// Get all devices ID from the table
function getAllDevicesId() {
  var dev_id_arr = [];

  var devices = $('.device_id');
  for (var i = 0; i < devices.length; i++)
    dev_id_arr.push($(devices[i]).html());

  return dev_id_arr;
}

// Set the color of status in table by assigning class name
function setStatusClassName(dev_id) {
  // Get the status element in table
  var statusElement = $('#' + dev_id + '_status');
  statusElement.removeClass();

  var status = statusElement.html();

  // Set the class
  if (status == "Online")
    statusElement.addClass("text-success text-center");
  else
    statusElement.addClass("text-danger text-center");
}

// Set the latest device status fetched from device config data
function setStatus(dev_id, status) {
  // Get the status element in table
  var statusElement = $('#' + dev_id + '_status');

  var firstLetter = status.charAt(0).toUpperCase();
  var statusText = firstLetter + status.substr(1);
  statusElement.text(statusText);
}

// Fetch latest data from multiple devices
function updateMultipleDeviceStatus(dev_id_arr) {
  for (var i = 0; i < dev_id_arr.length; i++) {
    updateStatus(dev_id_arr[i]);
  }
}


/** Get csrf token in order to post data using Ajax **/
// using jQuery
function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
var csrftoken = getCookie('csrftoken');

function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

$.ajaxSetup({
    beforeSend: function(xhr, settings) {
        if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        }
    }
});

// Update device status by using AJAX to post status data
// and update to database
function updateStatus(device_id) {

  var update_link = 'http://localhost:8000/dashboard/update_status/'
    + device_id;

  console.log(update_link);

  $.ajax({
    type:'GET',
    url: update_link,
    success: function(status) {
      if (status == "Fail")
        console.log("Device ID " + device_id + " has no data");
      else {
        // Update status in device table
        // Update the time in the footer
        setStatus(device_id, status);
        setStatusClassName(device_id);
        $('.card-footer').text("Updated at " + formatTime(new Date()));
      }
    }
  });
}
