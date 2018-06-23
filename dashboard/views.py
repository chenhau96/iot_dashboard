from django.shortcuts import render, get_object_or_404
from django.urls import reverse

def index(request):
    return render(request, 'dashboard/index.html')

def detail(request, chart_name):
    return render(request, 'dashboard/detail.html')

def devices(request):
    return render(request, 'dashboard/devices.html')
