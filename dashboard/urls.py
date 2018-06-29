from django.urls import path

from . import views

app_name = 'dashboard'
urlpatterns = [
    # Dashboard Page
    path('', views.index, name='index'),
    # Single Chart Page
    # path('<string:chart_name>/', views.detail, name='detail')
    # Device Management Page
    # path('devices/', views.devices, name='devices'),
]
