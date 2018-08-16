
var updateInterval = 30000; // 30s

// API URL for device configuration
var deviceConfigAPI = 'http://localhost:8000/api/device-config/';

// Maximum heartbeat value
// If beyond the heartbeat value, the device is said to be offline
var heartbeat = 24.0;


// After everything (HTML elements) is loaded
document.addEventListener("DOMContentLoaded", function(event) {
  // Get all device IDs
  var dev_id_arr = getAllDevicesId();

  // Set the class name for status
  for (var i = 0; i < dev_id_arr.length; i++)
    setStatusClassName(dev_id_arr[i]);

  // Fetch latest data from multiple devices to get the latest
  // data timestamp in order to calculate the difference
  // between current time and latest data timestamp
  fetchFromMultipleDevices(dev_id_arr);

  // Update the table based on updateInterval value
  setInterval(function() {
    fetchFromMultipleDevices(dev_id_arr);
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
  var status = statusElement.html();

  // Set the class
  if (status == "Online")
    statusElement.addClass("text-success text-center");
  else
    statusElement.addClass("text-danger text-center");
}

// Fetch latest data from multiple devices
function fetchFromMultipleDevices(dev_id_arr) {
  for (var i = 0; i < dev_id_arr.length; i++) {
    var api = 'http://localhost:8000/api/devices/?device_id=' +
      dev_id_arr[i] + '&data=latest';
    console.log(api);

    // Fetch data from API
    fetchLatestDataFromAPI(api, dev_id_arr[i]);
  }
}

// Fetch latest data from single device
function fetchLatestDataFromAPI(api, device_id) {
  fetch(api)
    .then(function(response) { return response.json(); })
    .then(function(apiData) {
      console.log(apiData);
      if (apiData.length != 0) {
        // Get latest time and current time
        var latest = new Date(apiData[0].timestamp);
        var localLatestTime = latest.getTime() - (latest.getTimezoneOffset() * 60000);

        var currentTime = new Date();

        // 36e5 denotes 60*60*1000ms
        // Get hours difference
        difference = Math.abs(currentTime - localLatestTime) / 36e5;
        console.log(difference);
        var status = "offline";

        // Check status and update status
        if (difference <= heartbeat) {
          // If difference more than 24 hours, update to offline
          status = "online";
        }

        updateStatus(device_id, status);
      }

    })
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
function updateStatus(device_id, status) {

  var update_link = 'http://localhost:8000/dashboard/update_status/'
    + device_id;

  console.log(update_link);

  $.ajax({
    type:'post',
    url: update_link,
    data: {'status': status},
    success: function(msg) {
      // update the time in the footer
      fetchDeviceConfig(deviceConfigAPI);
      setStatusClassName(device_id);
      $('.card-footer').text("Updated at " + new Date())
    }
  });
}

// Fetch device config data from database
function fetchDeviceConfig(api) {
  fetch(api)
    .then(function(response) { return response.json(); })
    .then(function(apiData) {
      if (apiData) {
        for (var i in apiData) {
          // Get the device_id and status
          var device_id = apiData[i].device_id;
          var status = apiData[i].status;

          setStatus(device_id, status);
        }
      }
    })
}

// Set the latest device status fetched from device config data
function setStatus(dev_id, status) {
  // Get the status element in table
  var statusElement = $('#' + dev_id + '_status');

  var firstLetter = status.charAt(0).toUpperCase();
  var statusText = firstLetter + status.substr(1);
  statusElement.text(statusText);
}