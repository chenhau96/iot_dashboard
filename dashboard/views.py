from django.shortcuts import render
from django.urls import reverse
from dashboard.models import Devices


for device in Devices.objects.all():
    print(device.device_id)


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

