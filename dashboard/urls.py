from django.urls import path

from . import views

app_name = 'dashboard'
urlpatterns = [
    # Dashboard Main Page
    path('', views.index, name='index'),

    # Individual Device Dashboard
    # Param: String dev_id
    path('device/<slug:dev_id>', views.device, name='device'),

    # Single Chart Page
    path('device/<slug:dev_id>/<slug:which_data>',
         views.chart_detail, name='chart_detail'),

    # Device Management Page
    path('devices/management', views.devices_management,
         name='devices_management'),

    # Add Device
    path('devices/management/add', views.add_device, name='add_device'),

    # Update Device
    path('devices/management/edit/<slug:dev_id>', views.update_device,
         name='update_device'),

    # Delete Device
    path('devices/management/delete/<slug:dev_id>', views.delete_device,
         name='delete_device'),

    # Save Chart Configuration
    path('device/<slug:dev_id>/<slug:which_data>/save', views.save_chart_config,
         name='save_chart_config'),

    # Update show_in_main value
    path('device/<slug:dev_id>/<slug:which_data>/update_show', views.update_show_in_main,
         name='update_show_in_main'),

    # For temporary use
    path('max_vs_min_view/', views.max_vs_min_view, name='max_vs_min_view'),
    path('avg_temp/', views.avg_temp, name='avg_temp'),
    path('snowView/', views.snowView, name='snowView'),
    path('precipitationView/', views.precipitationView, name='precipitationView'),
    path('mapView/', views.mapView, name='mapView'),
    path('device_table/', views.device_table, name='device_table'),

]
