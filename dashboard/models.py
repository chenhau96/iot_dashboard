from mongoengine import *

"""
The following models are the collections in the MongoDB
"""


class Devices(Document):
    """
    Devices Document/Collection

    It contains attirbutes:
    - device_id: The id of the device
    - created_on: The datetime of the data generated, where datetime is converted to Epoch time
    - data: The data generated
    """
    device_id = StringField(max_length=30, required=True)
    created_on = DecimalField()     # In Epoch time
    data = DynamicField()








