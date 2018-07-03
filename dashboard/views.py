from django.shortcuts import render
from django.http import HttpResponse
import json
from django.urls import reverse
from dashboard.models import Devices


def index(request):
    # TODO: index page
    # pass
    return render(request, 'dashboard/index.html')

def detail(request, chart_name):
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

def api_get_devices(request):
    devices = Devices.objects.all()
    return HttpResponse(json.dumps(devices, default=lambda d: list(d)))
