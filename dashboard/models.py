from mongoengine import *


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











