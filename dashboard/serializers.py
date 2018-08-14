from rest_framework_mongoengine import serializers
from dashboard.models import Devices, Device


class DevicesSerializer(serializers.DocumentSerializer):
    class Meta:
        model = Devices
        fields = '__all__'


class DeviceConfigSerializer(serializers.DocumentSerializer):
    class Meta:
        model = Device
        fields = '__all__'