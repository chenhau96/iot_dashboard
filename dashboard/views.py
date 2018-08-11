from django.shortcuts import render
from django.urls import reverse
from django.http import Http404
from datetime import timedelta
import datetime
import json

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
    # TODO: navigate to devices page
    # Get distinct device_id devices
    devices = Devices.objects.order_by('device_id').distinct('device_id')
    print(len(devices))
    return render(request, 'dashboard/device_management.html', {
        'devices': devices,
    })


def device_form(request):
    """
    Device Add/Update Form Page
    :param request:
    :return:
    """
    return render(request, 'dashboard/device_form.html')


def add_update_device(request):
    newDevice = Device(device_id=request.POST['device_id'])
    newDevice.device_name = request.POST['device_name']
    newDevice.gps_loc = request.POST['gps']
    newDevice.save()

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





