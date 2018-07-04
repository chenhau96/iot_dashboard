from mongoengine import *
from rest_framework_mongoengine import serializers, viewsets


class Devices(Document):
    """
    Devices Collection
    It contains attirbutes:
    - device_id: The id of the device
    - created_on: The datetime of the data generated, where datetime is converted to Epoch time
    - data: The data generated
    """
    device_id = StringField(max_length=30, required=True)
    created_on = DynamicField()     # In Epoch time
    data = DynamicField()


class DevicesSerializer(serializers.DocumentSerializer):
    class Meta:
        model = Devices
        fields = '__all__'


class DevicesViewSet(viewsets.ModelViewSet):
    lookup_field = 'device_id'
    serializer_class = DevicesSerializer

    def get_queryset(self):
        return Devices.objects.all()


