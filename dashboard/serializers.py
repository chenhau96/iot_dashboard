from rest_framework_mongoengine import serializers
from dashboard.models import Devices


class DevicesSerializer(serializers.DocumentSerializer):
    class Meta:
        model = Devices
        fields = '__all__'
