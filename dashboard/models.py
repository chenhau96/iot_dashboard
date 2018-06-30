from mongoengine import *


class Devices(Document):
    device_id = StringField(max_length=30, required=True)
    created_on = DateTimeField()
    created_on_gmt8 = DateTimeField()
    datetime_created = DateTimeField()
    data = DynamicField()





