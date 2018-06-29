from mongoengine import *


class Devices(Document):
    device_id = StringField(max_length=30, required=True)
    created_on = DateTimeField()
    datetime_created = DateTimeField()
    data = DynamicField()





