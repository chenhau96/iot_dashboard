from django.shortcuts import render
from django.urls import reverse
from django.http import Http404
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
    API endpoint that allows devices to be viewed or edited.
    """
    lookup_field = 'device_id'
    serializer_class = DevicesSerializer
    my_filter_fields = ('device_id', 'timestamp')  # specify the fields on which to filter

    def get_kwargs_for_filtering(self):
        filtering_kwargs = {}
        for field in self.my_filter_fields:  # iterate over the filter fields
            # get the value of a field from request query parameter
            field_value = self.request.query_params.get(field)
            if field_value:
                filtering_kwargs[field] = field_value
        return filtering_kwargs

    def get_queryset(self):
        queryset = Devices.objects.order_by('timestamp')

        # get the fields with values for filtering
        filtering_kwargs = self.get_kwargs_for_filtering()
        if filtering_kwargs:
            # filter the queryset based on 'filtering_kwargs'
            # E.g. http://localhost:8000/api/devices/?device_id=00-80-00-00-00-01-1e-d8
            queryset = Devices.objects.filter(**filtering_kwargs)
        return queryset
