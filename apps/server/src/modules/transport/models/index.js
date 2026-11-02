const Bus = require('./bus.model');
const Route = require('./route.model');
const Driver = require('./driver.model');
const StudentTransportAllocation = require('./studentTransportAllocation.model');
const TransportSetting = require('./transportSetting.model');
const Trip = require('./trip.model');
const GpsLocation = require('./gpsLocation.model');
const StudentTripAttendance = require('./studentTripAttendance.model');
const VehicleMaintenance = require('./vehicleMaintenance.model');
const FuelRecord = require('./fuelRecord.model');
const TransportExpense = require('./transportExpense.model');
const TransportFeeStructure = require('./transportFeeStructure.model');
const StudentTransportFee = require('./studentTransportFee.model');
const EmergencyAlert = require('./emergencyAlert.model');
const TransportIncident = require('./transportIncident.model');
const Geofence = require('./geofence.model');
const GeofenceEvent = require('./geofenceEvent.model');
const OverspeedEvent = require('./overspeedEvent.model');
const TransportComplaint = require('./transportComplaint.model');
const TransportAnnouncement = require('./transportAnnouncement.model');
const TransportNotification = require('./transportNotification.model');
const NotificationPreference = require('./notificationPreference.model');

module.exports = {
  Bus,
  Route,
  Driver,
  StudentTransportAllocation,
  TransportSetting,
  Trip,
  GpsLocation,
  StudentTripAttendance,
  VehicleMaintenance,
  FuelRecord,
  TransportExpense,
  TransportFeeStructure,
  StudentTransportFee,
  EmergencyAlert,
  TransportIncident,
  Geofence,
  GeofenceEvent,
  OverspeedEvent,
  TransportComplaint,
  TransportAnnouncement,
  TransportNotification,
  NotificationPreference
};
