from mongoengine import *
from rest_framework_mongoengine import serializers, viewsets
from rest_framework.decorators import action
from rest_framework_mongoengine.generics import *
from rest_framework import filters

class Devices(Document):
    """
    Devices Collection
    It contains attributes:
    - device_id: The id of the device
    - created_on: The datetime of the data generated, where datetime is converted to Epoch time
    - data: The data generated (E.g. temperature, moisture, light, etc)
    """
    device_id = StringField(max_length=30, required=True)
    timestamp = DateTimeField()
    created_on = DynamicField()     # In Epoch time
    data = DynamicField()


class DevicesSerializer(serializers.DocumentSerializer):
    class Meta:
        model = Devices
        fields = '__all__'


class DevicesViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows devices to be viewed or edited.
    """
    lookup_field = 'device_id'
    serializer_class = DevicesSerializer
    my_filter_fields = ('device_id', 'timestamp')  # specify the fields on which to filter

    def get_kwargs_for_filtering(self):
        filtering_kwargs = {}
        for field in self.my_filter_fields:  # iterate over the filter fields
            # get the value of a field from request query parameter
            field_value = self.request.query_params.get(field)
            if field_value:
                filtering_kwargs[field] = field_value
        return filtering_kwargs

    def get_queryset(self):
        queryset = Devices.objects.all()

        # get the fields with values for filtering
        filtering_kwargs = self.get_kwargs_for_filtering()
        if filtering_kwargs:
            # filter the queryset based on 'filtering_kwargs'
            # E.g. http://localhost:8000/api/devices/?device_id=00-80-00-00-00-01-1e-d8
            queryset = Devices.objects.filter(**filtering_kwargs)
        return queryset

    @action(detail=False)
    def get_distinct(self):
        return Devices.objects.all().fields(device_id=1, _id=0, data=1)




