from django.shortcuts import render
from django.urls import reverse
from django.http import Http404
from datetime import timedelta
import datetime
import json

from dashboard.models import Devices

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
    Display each device dashboard page
    All charts for individual device will be on this page.
    """
    # TODO: individual device dashboard page

    # Get device_id from url parameter and perform query
    # to find the device_id
    devices = Devices.objects(device_id=dev_id)

    if len(devices) == 0:
        # if device_id not found, raise Http404
        raise Http404("Device ID \"" + dev_id + "\" does not exist")
    else:
        # if device_id is found, render the page
        return render(request, 'dashboard/device.html',
                      {
                          'devices': devices,
                          'device_id': dev_id,
                          'data_count': len(devices[0].data),
                      })

def detail(request, dev_id, whichData):
    """
    Display individual chart of a device_id with
    chart configuration/settings for personalization
    """
    # TODO: link to a single chart page when click on the chart name
    # return render(request, 'dashboard/.html')
    pass


def devices(request):
    # TODO: navigate to devices page
    pass


# For temporary use
def max_vs_min_view(request):
    return render(request, 'dashboard/max-vs-min-view.html')

def avg_temp(request):
    return render(request, 'dashboard/avg-temp.html')

def snowView(request):
    return render(request, 'dashboard/snowView.html')

def precipitationView(request):
    return render(request, 'dashboard/precipitationView.html')

def mapView(request):
    return render(request, 'dashboard/mapView.html')

def device_table(request):
    return render(request, 'dashboard/tables.html')


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

        # Get device_id, timestamp, data in API parameter
        device_id = self.request.query_params.get('device_id', None)
        timestamp = self.request.query_params.get('timestamp', None)
        data = self.request.query_params.get('data', None)

        if device_id is not None:
            """
            Filter queryset to retrieve a specific device_id
            if 'device_id' param present in API url parameter
            
            E.g. http://localhost:8000/api/devices/?device_id=00-80-00-00-00-01-1e-d8
            """
            queryset = queryset.filter(device_id=device_id)

        if timestamp is not None:
            """
            Filter queryset to retrieve a range of timestamp
            if 'timestamp' param present in API url parameter
            
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
            if 'data' param present in API url parameter
            
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





