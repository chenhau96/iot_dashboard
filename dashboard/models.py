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
    data = DynamicField()
    meta = {'collection': 'devices_data'}


class Users(Document):
    email = StringField(required=True)
    password = StringField(required=True, max_length=32)


class ChartConfig(EmbeddedDocument):
    threshold = DecimalField(default=0.0)
    color = StringField(default="steelblue")
    chart_type = StringField(default="lineChart")
    timeline = StringField(default="today")


class Device(Document):
    owner = ReferenceField(Users)
    device_id = StringField(max_length=30, required=True)
    device_name = StringField(max_length=30)
    gps_loc = GeoPointField()
    status = StringField(default="offline")
    chart_config = ListField(EmbeddedDocumentField(ChartConfig))













