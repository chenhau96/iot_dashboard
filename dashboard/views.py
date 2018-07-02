from django.shortcuts import render
from django.http import HttpResponse
from django.urls import reverse
import json

from dashboard.models import Devices


def index(request):
    # TODO: index page
    pass
    # return render(request, 'dashboard/index.html')


def detail(request, chart_name):
    # TODO: link to a single chart page when click on the chart name
    # return render(request, 'dashboard/detail.html')
    pass


def devices(request):
    # TODO: navigate to devices page
    pass


def api_get_devices(request):
    devices = Devices.objects.all()
    return HttpResponse(json.dumps(devices, default=lambda d: list(d)))