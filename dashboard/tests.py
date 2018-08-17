from django.urls import reverse
from django.test import TestCase
from dashboard.models import Devices, Device

import pymongo
import mongoengine
from mongoengine.connection import (get_db,get_connection)


def create_device(device_id, device_name, gps_loc):
    new_device = Device(
        device_id=device_id,
        device_name=device_name,
        gps_loc=gps_loc,
    )

    return new_device


def update_device(old_dev_id, new_dev_id, new_device_name, new_gps_loc):
    # Create an old device for query
    device_id = "dev-001"
    device_name = "device-001"
    gps_loc = [10.5, 30.8]

    old_device = create_device(device_id, device_name, gps_loc)
    old_device.save()

    # Update device
    Device.objects(device_id=old_dev_id).update_one(
        set__device_id=new_dev_id,
        set__device_name=new_device_name,
        set__gps_loc=new_gps_loc,
    )
    old_device.reload()

    return old_device


def delete_device(device_id):
    device = Device.objects(device_id=device_id).first()
    device.delete()


class DeviceManagementTest(TestCase):
    def test_create_device(self):
        device_id = "dev-001"
        device_name = "device-001"
        gps_loc = [10.5, 30.8]

        new_device = create_device(device_id, device_name, gps_loc)

        expected = Device(
            device_id=device_id,
            device_name=device_name,
            gps_loc=gps_loc
        )

        self.assertEqual(expected.device_id, new_device.device_id)
        self.assertEqual(expected.device_name, new_device.device_name)
        self.assertEqual(expected.gps_loc, new_device.gps_loc)

    def test_update_device(self):
        new_device_id = "dev-002"
        new_device_name = "device-002"
        new_gps_loc = [5.5, 8.5]

        expected = Device(
            device_id=new_device_id,
            device_name=new_device_name,
            gps_loc=new_gps_loc
        )

        updated_device = update_device(
            "dev-001",
            new_device_id,
            new_device_name,
            new_gps_loc
        )

        self.assertEqual(updated_device.device_id, expected.device_id)
        self.assertEqual(updated_device.device_name, expected.device_name)
        self.assertEqual(updated_device.gps_loc, expected.gps_loc)

        # delete the record
        updated_device.delete()

    def test_delete_device(self):
        device_id = "dev-001"
        device_name = "device-001"
        gps_loc = [10.5, 30.8]

        new_device = create_device(device_id, device_name, gps_loc)
        new_device.save()

        delete_device(device_id)

        # Query the deleted device
        device = Device.objects(device_id=device_id).first()

        # Assert device object is none
        self.assertIsNone(device)


class IndexPageTest(TestCase):
    """
    Test Index Page
    """
    def test_index_page(self):
        url = reverse('dashboard:index')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)


class IndividualDeviceViewTests(TestCase):
    def test_deviceID_notExists(self):
        """
        A device id that is not exist in the database should
        return a 404 status code.
        """
        dev_id = "abcd1234"
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


class DevicesTestCase(TestCase):
    """ Test querying on Devices document. """
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





