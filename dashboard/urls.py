from django.urls import path

from . import views

app_name = 'dashboard'
urlpatterns = [
    # Dashboard Main Page
    path('', views.index, name='index'),

    # Individual Device Dashboard
    # Param: String dev_id
    path('device/<slug:dev_id>/', views.device, name='device'),

    # Single Chart Page
    path('device/<slug:dev_id>/<slug:which_data>/',
         views.chart_detail, name='chart_detail'),

    # TODO:
    # Device Management Page
    path('devices/management', views.devices_management, name='devices_management'),

    # Device Add/Update Form Page
    path('devices/management/form', views.device_form, name='device_form'),


    # For temporary use
    path('max_vs_min_view/', views.max_vs_min_view, name='max_vs_min_view'),
    path('avg_temp/', views.avg_temp, name='avg_temp'),
    path('snowView/', views.snowView, name='snowView'),
    path('precipitationView/', views.precipitationView, name='precipitationView'),
    path('mapView/', views.mapView, name='mapView'),
    path('device_table/', views.device_table, name='device_table'),

]
