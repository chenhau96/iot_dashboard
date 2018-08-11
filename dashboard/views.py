from django.shortcuts import render
from django.urls import reverse
from django.http import Http404, HttpResponseRedirect
from datetime import timedelta
import datetime

from dashboard.models import Devices, Device
from dashboard.selectionItems import *

from rest_framework_mongoengine import viewsets
from dashboard.serializers import DevicesSerializer


def index(request):
    """
    Main dashboard
    """
    # TODO: index page
    # pass
    return render(request, 'dashboard/index.html')


def device(request, dev_id):
    """
    Display each device dashboard page.
    All charts for individual device will be shown.

    :param request: request object
    :param dev_id: device id
    :return:
    """

    devices = Devices.objects(device_id=dev_id)

    if not is_device_id_valid(dev_id):
        # if device_id not found, raise Http404
        raise Http404("Device ID \"" + dev_id + "\" does not exist")
    else:
        # if device_id is found, render the page
        return render(request, 'dashboard/device_dashboard.html',
                      {
                          'devices': devices,
                          'device_id': dev_id,
                          'data_count': len(devices[0].data),
                      })


def chart_detail(request, dev_id, which_data):
    """
    Display individual chart of a device_id with
    chart configuration/settings for personalization

    Param:
    :param request: request object
    :param dev_id: device id
    :param which_data: data field of a device
    :return:
    """

    if not is_device_id_valid(dev_id):
        # if device_id not found, raise Http404
        raise Http404("Device ID \"" + dev_id + "\" does not exist")
    elif not is_which_data_valid(dev_id, which_data):
        raise Http404("URL \"" + request.path + "\" does not exist")
    else:
        # if device_id is found, render the page
        return render(request, 'dashboard/chart_detail.html',
                      {
                          'device_id': dev_id,
                          'whichData': which_data,
                          'colorList': colorList,
                          'chartTypeList': chartTypeList,
                          'timelineList': timelineList,
                      })


def is_device_id_valid(dev_id):
    """
    Check whether device id is valid (exists in database)

    :param dev_id: device id
    :return: valid
    """
    valid = False

    devices_documents = Devices.objects(device_id=dev_id)

    if len(devices_documents) > 0:
        valid = True

    return valid


def is_which_data_valid(dev_id, which_data):
    """
    Check whether data field is valid

    :param dev_id: device id
    :param which_data: data field of a device
    :return:
    """
    valid = False

    devices_documents = Devices.objects(device_id=dev_id)
    if which_data in devices_documents[0].data:
        valid = True

    return valid


def devices_management(request):
    """
    Display list of devices in a table
    :param request:
    :return:
    """
    # Get all devices order by device ID
    devices = Device.objects.order_by('device_id')

    return render(request, 'dashboard/device_management.html', {
        'devices': devices,
    })


def add_device(request):
    """
    Add new device function
    It handles both GET and POST request
    :param request:
    :return:
    """
    if request.method == 'GET':
        # GET request
        # display the form
        return render(request, 'dashboard/add_device.html')

    elif request.method == 'POST':
        # POST request
        # process the form data

        hasError = False
        error_message = ""

        # Get the POST data and create a new device object
        newDevice = Device(device_id=request.POST['device_id'])
        newDevice.device_name = request.POST['device_name']
        latitude = request.POST['latitude']
        longitude = request.POST['longitude']

        if latitude and longitude:
            # Set gps_loc if latitude and longitude field is not empty
            newDevice.gps_loc = [float(latitude), float(longitude)]

        # Validation
        if newDevice.device_id == "":
            # If device ID field is empty
            hasError = True
            error_message = "Device ID cannot be empty."
        else:
            # Check if new device id and name exist in database
            isExist = Device.objects(device_id=newDevice.device_id)

            if isExist:
                hasError = True
                error_message = "This Device ID or Name has been used."

        if hasError:
            # If error occurs, return error message
            return render(request, 'dashboard/add_device.html', {
                'error_message': error_message
            })
        else:
            # Save the newly created device object
            newDevice.save()

        # Redirect to device management page
        return HttpResponseRedirect(reverse('dashboard:devices_management'))


def update_device(request, dev_id):
    """
    Update existing device function
    It handles both GET and POST request
    :param request:
    :param dev_id:
    :return:
    """
    # Query the device using device ID
    device = Device.objects(device_id=dev_id)[0]

    if device is None:
        # If the device ID not found, raise Http404
        raise Http404("Device ID \"" + dev_id + "\" does not exist")
    else:
        # If device ID exists, check if a GET/POST request
        if request.method == 'GET':
            # GET request
            # display the form
            return render(request, 'dashboard/update_device.html', {
                'device': device
            })
        elif request.method == 'POST':
            # POST request
            # process the form data

            hasError = False
            error_message = ""

            # Get the POST data
            device_id = request.POST['device_id']
            device_name = request.POST['device_name']
            latitude = request.POST['latitude']
            longitude = request.POST['longitude']
            gps_loc = None

            if latitude and longitude:
                # Set gps_loc if latitude and longitude field is not empty
                gps_loc = [float(latitude), float(longitude)]

            # Validation
            if device_id == "":
                # If device ID field is empty
                hasError = True
                error_message = "Device ID cannot be empty."
            elif device_id != dev_id:
                # Check if changed device id and name exist in database
                isExist = Device.objects(device_id=device_id)

                if isExist:
                    hasError = True
                    error_message = "This Device ID or Name has been used."

            if hasError:
                # If error occurs, return error message
                return render(request, 'dashboard/update_device.html', {
                    'device': device,
                    'error_message': error_message
                })
            else:
                # Update document
                if device_id == dev_id:
                    Device.objects(device_id=dev_id).update_one(
                        set__device_name=device_name,
                        set__gps_loc=gps_loc,
                    )
                else:
                    Device.objects(device_id=dev_id).update_one(
                        set__device_id=device_id,
                        set__device_name=device_name,
                        set__gps_loc=gps_loc,
                    )

                device.reload()

            # Redirect to device management page
            return HttpResponseRedirect(reverse('dashboard:devices_management'))


def delete_device(request, dev_id):
    """
    View function to delete device
    :param request:
    :param dev_id:
    :return:
    """
    device = Device.objects(device_id=dev_id)

    if device:
        device.delete()
    else:
        error = "device not found"

    return HttpResponseRedirect(reverse('dashboard:devices_management'))

# For temporary use
def max_vs_min_view(request):
    return render(request, 'dashboard/chart_detail.html')

def avg_temp(request):
    return render(request, 'dashboard/avg-temp.html')

def snowView(request):
    return render(request, 'dashboard/snowView.html')

def precipitationView(request):
    return render(request, 'dashboard/precipitationView.html')

def mapView(request):
    return render(request, 'dashboard/mapView.html')

def device_table(request):
    return render(request, 'dashboard/device_management.html')


class DevicesViewSet(viewsets.ModelViewSet):
    """
    API endpoint for devices data which supports filtering
    to retrieve subset of the data

    Example of API url with combined query param for filtering:
    http://localhost:8000/api/devices/?device_id=00-80-00-00-00-01-1e-d8&data=temperature
    """
    serializer_class = DevicesSerializer

    def get_queryset(self):
        # Get all device objects order by timestamp
        queryset = Devices.objects.order_by('timestamp')

        # Get device_id, timestamp, data in API request parameter
        device_id = self.request.query_params.get('device_id', None)
        timestamp = self.request.query_params.get('timestamp', None)
        data = self.request.query_params.get('data', None)

        if device_id is not None:
            """
            Filter queryset to retrieve a specific device_id
            if 'device_id' request param present in API url parameter
            
            E.g. http://localhost:8000/api/devices/?device_id=00-80-00-00-00-01-1e-d8
            """
            queryset = queryset.filter(device_id=device_id)

        if timestamp is not None:
            """
            Filter queryset to retrieve a range of timestamp
            if 'timestamp' request param present in API url parameter
            
            E.g. http://localhost:8000/api/devices/?timestamp=last7day
            """

            # Get today date
            today = datetime.date.today()

            # Check timestamp parameter value to do filter accordingly
            if timestamp == 'today':
                queryset = queryset.filter(timestamp__gte=today)
            elif timestamp == 'last3day':
                last3day = today - timedelta(days=3)
                queryset = queryset.filter(timestamp__gte=last3day)
            elif timestamp == 'last7day':
                last7day = today - timedelta(days=7)
                queryset = queryset.filter(timestamp__gte=last7day)
            elif timestamp == 'this-month':
                this_month = today - timedelta(days=30)
                queryset = queryset.filter(timestamp__gte=this_month)
            elif timestamp == 'this-year':
                this_year = today - timedelta(days=365)
                queryset = queryset.filter(timestamp__gte=this_year)

        if data is not None:
            """
            Filter queryset to retrieve a specific datafield/columns
            if 'data' request param present in API url parameter
            
            E.g. http://localhost:8000/api/devices/?data=temperature
            """

            # Check if 'data' param is a valid datafield in the queryset
            for datafield in queryset[0].data:
                if datafield == data:
                    # Return queryset if 'data' param is valid
                    return queryset\
                        .only('device_id', 'timestamp', 'data__'+data)

            # Set queryset to none if 'data' param is invalid
            queryset = None

        return queryset





