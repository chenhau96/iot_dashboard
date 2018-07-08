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

    # For temporary use
    path('max_vs_min_view/', views.max_vs_min_view, name='max_vs_min_view'),
    path('avg_temp/', views.avg_temp, name='avg_temp'),
    path('snowView/', views.snowView, name='snowView'),
    path('precipitationView/', views.precipitationView, name='precipitationView'),
    path('mapView/', views.mapView, name='mapView'),
    path('device_table/', views.device_table, name='device_table'),

]
