from django.test import TestCase
from dashboard.models import Devices

import pymongo
import mongoengine
from mongoengine.connection import (get_db,get_connection)


class DevicesTestCase(TestCase):
    """ Test querying on Devices document. """

    def setUp(self):
        # Setup run before every test method.
        pass

    def test_queryDocument(self):
        device1 = Devices.objects.order_by('-id').first()
        self.assertEqual(device1.device_id, "00-80-00-00-00-01-1e-d7")
        self.assertTrue(len(device1.device_id) <= 30)


class ConnectionTest(TestCase):
    """ Test connection to MongoDB. """

    def test_connect(self):
        """ Ensure that the connect() method works properly. """
        mongoengine.connect('iot-dashboard')

        conn = get_connection()
        self.assertTrue(isinstance(conn, pymongo.mongo_client.MongoClient))

        db = get_db()
        self.assertEqual(db.name, 'iot-dashboard')



