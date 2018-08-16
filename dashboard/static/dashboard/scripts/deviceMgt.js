
function getDeviceId(device_id) {
  // Set modal-body text
  $('.modal-body').text("Delete device with ID \"" + device_id + "\"?");

  // Set anchor link href attribute
  $('#delete').attr('href',
    "http://localhost:8000/dashboard/devices/management/delete/" + device_id);
}