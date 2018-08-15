from django.shortcuts import render
from django.urls import reverse
from django.http import Http404, HttpResponseRedirect
from datetime import timedelta
import datetime

from dashboard.models import Devices, Device, ChartConfig
from dashboard.selectionItems import *

from rest_framework_mongoengine import viewsets
from dashboard.serializers import DevicesSerializer, DeviceConfigSerializer


def index(request):
    """
    Main dashboard

    device = Device._get_collection().aggregate([

    ])
    """
    devices = Device.objects.order_by('device_id')
    charts_in_main = {}

    for device in devices:
        arr = []
        for i, obj in enumerate(device.chart_config):
            data_key = ''.join(obj.keys())  # Get dictionary key
            if obj[data_key]['show_in_main']:
                # If 'show_in_main' is True
                arr.append(obj)
                print('Object value: ', obj)

        charts_in_main.update({device.device_id: arr})

    print('All show_in_main config: ', charts_in_main)

    return render(request, 'dashboard/index.html')


def device(request, dev_id):
    """
    Display each device dashboard page.
    All charts for individual device will be shown.

    :param request: request object
    :param dev_id: device id
    :return:
    """
    current_device = Device.objects(device_id=dev_id)
    if not current_device:
        # if device_id not found, raise Http404
        raise Http404("Device ID \"" + dev_id + "\" does not exist")
    else:
        # if device_id is found, render the page
        return render(request, 'dashboard/device_dashboard.html',
                      {'device_id': dev_id, })


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
    device = Device.objects(device_id=dev_id)[0]

    # Set default chart configuration
    dev_config = get_chart_config(device, which_data)

    if not device:
        # if device_id not found, raise Http404
        raise Http404("Device ID \"" + dev_id + "\" does not exist")
    elif not is_which_data_valid(dev_id, which_data):
        raise Http404("URL \"" + request.path + "\" does not exist")
    else:
        # if device_id is found, render the page
        return render(request, 'dashboard/chart_detail.html',
                      {
                          'dev_config': dev_config,
                          'device_id': dev_id,
                          'whichData': which_data,
                          'colorList': colorList,
                          'chartTypeList': chartTypeList,
                          'timelineList': timelineList,
                      })


def get_chart_config(device, which_data):
    # Set default chart configuration
    dev_config = device.default_config

    # Retrieve the chart configuration for the particular data
    # If exists, replace default chart configuration
    for item in device.chart_config:
        field = ''.join(item.keys())  # Get dictionary key
        if which_data == field:
            dev_config = item[field]
            break

    return dev_config


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

        # Create a default chart configuration object
        chart_config = ChartConfig(show_in_main=False)
        newDevice.default_config = chart_config

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


def save_chart_config(request, dev_id, which_data):
    """
    To save or update the preferences configured by user
    :param request:
    :param dev_id:
    :param which_data:
    :return:
    """
    if request.method == 'POST':
        # Get the device object
        device = Device.objects(device_id=dev_id).first()

        # Get POST data
        threshold = request.POST['threshold']
        color = request.POST['color']
        chart_type = request.POST['chart_type']
        timeline = request.POST['timeline']
        #show_in_main = request.POST['show_in_main']
        #print('Value of show_in_main', show_in_main)

        # Create a ChartConfig object
        chart_config = ChartConfig(
            threshold=threshold,
            color=color,
            chart_type=chart_type,
            timeline=timeline,
            show_in_main=False,
        )

        # Check if the chart config for which_data is exists
        isExist = False

        for i, item in enumerate(device.chart_config):
            field = ''.join(item.keys())  # Get dictionary key
            if which_data == field:
                # If exists, update the values
                isExist = True
                device.chart_config[i][field] = chart_config
                break

        if not isExist:
            # If chart configuration of which_data does not exists,
            # Add the configuration of which_data (Eg: Temperature)
            device.chart_config.append({which_data: chart_config})

        # Save the document
        device.save()

        return HttpResponseRedirect(
            reverse('dashboard:chart_detail',
                    kwargs={'dev_id': dev_id, 'which_data': which_data}))


def update_show_in_main(request, dev_id, which_data):
    """
    Update the value of checkbox of 'Show in Main Dashboard'
    Via Ajax post request without reloading the page.
    :param request:
    :param dev_id:
    :param which_data:
    :return:
    """
    if request.method == 'POST':
        # Get the device object
        device = Device.objects(device_id=dev_id).first()

        newValue = request.POST['show_in_main']
        print('New value: ', newValue)
        for i, item in enumerate(device.chart_config):
            field = ''.join(item.keys())  # Get dictionary key
            if which_data == field and newValue == 'true':
                # If exists, update the values
                device.chart_config[i][field]['show_in_main'] = True
                break
            else:
                device.chart_config[i][field]['show_in_main'] = False

        device.save()

    return HttpResponseRedirect(
        reverse('dashboard:chart_detail',
                kwargs={'dev_id': dev_id, 'which_data': which_data}))


class DeviceConfigViewSet(viewsets.ModelViewSet):
    """
    API endpoint for device configuration setting

    API URL: http://localhost:8000/api/device-config
    """
    serializer_class = DeviceConfigSerializer

    def get_queryset(self):
        queryset = Device.objects.order_by('device_id')

        return queryset


class DevicesViewSet(viewsets.ModelViewSet):
    """
    API endpoint for devices data which supports filtering
    to retrieve subset of the data

    API URL: http://localhost:8000/api/devices

    Example of API url with combined query param for filtering:
    http://localhost:8000/api/devices/?device_id=00-80-00-00-00-01-1e-d8&data=temperature
    """
    serializer_class = DevicesSerializer

    def get_queryset(self):
        # Get all device objects order by timestamp
        queryset = Devices.objects.order_by('timestamp')
        queryset_copy = Devices.objects.order_by('timestamp')

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
            elif timestamp == 'last3Days':
                last3day = today - timedelta(days=3)
                queryset = queryset.filter(timestamp__gte=last3day)
            elif timestamp == 'last7Days':
                last7day = today - timedelta(days=7)
                queryset = queryset.filter(timestamp__gte=last7day)
            elif timestamp == 'thisMonth':
                this_month = today - timedelta(days=30)
                queryset = queryset.filter(timestamp__gte=this_month)
            elif timestamp == 'thisYear':
                this_year = today - timedelta(days=365)
                queryset = queryset.filter(timestamp__gte=this_year)

        if data is not None:
            """
            Filter queryset to retrieve a specific datafield/columns
            if 'data' request param present in API url parameter
            
            E.g. http://localhost:8000/api/devices/?data=temperature
            """

            # Check if 'data' param is a valid datafield in the queryset
            if data in queryset_copy[0].data:
                # Return queryset if 'data' param is valid
                return queryset\
                    .only('device_id', 'timestamp', 'data__'+data)

            # Set queryset to none if 'data' param is invalid
            queryset = None

        return queryset


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



