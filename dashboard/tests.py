from django.urls import reverse
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


class IndividualDeviceViewTests(TestCase):
    def test_deviceID_notExists(self):
        """
        A device id that is not exist in the database should
        return a 404 status code.
        """
        dev_id = "123456"
        url = reverse('dashboard:device', kwargs={'dev_id':dev_id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)

    def test_deviceID_exists(self):
        """
        A device id that is exist in the database should return
        a 200 status code and display the device dashboard page.
        """
        dev_id = "00-80-00-00-00-01-1e-d7"
        url = reverse('dashboard:device', kwargs={'dev_id':dev_id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)