from django import template
from dashboard.models import Device

register = template.Library()


@register.simple_tag
def device_objects(request):
    devices = Device.objects.all()

    return devices
