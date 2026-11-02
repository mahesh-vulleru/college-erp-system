/**
 * Request Validation for Transport Subsystem
 */

function validateBusInput(data = {}) {
  const errors = [];
  const { busId, registrationNumber, busName, seatingCapacity } = data;

  if (!busId || typeof busId !== 'string' || !busId.trim()) {
    errors.push('Bus ID is required');
  }

  if (!registrationNumber || typeof registrationNumber !== 'string' || !registrationNumber.trim()) {
    errors.push('Vehicle registration number is required');
  }

  if (!busName || typeof busName !== 'string' || !busName.trim()) {
    errors.push('Bus name/identifier is required');
  }

  const capacityNum = Number(seatingCapacity);
  if (isNaN(capacityNum) || capacityNum <= 0 || !Number.isInteger(capacityNum)) {
    errors.push('Seating capacity must be a positive integer');
  }

  if (data.manufacturingYear) {
    const year = Number(data.manufacturingYear);
    if (isNaN(year) || year < 1990 || year > new Date().getFullYear() + 1) {
      errors.push('Manufacturing year must be a valid four-digit year');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateRouteInput(data = {}) {
  const errors = [];
  const { routeId, routeName, routeCode, startingPoint, destination } = data;

  if (!routeId || typeof routeId !== 'string' || !routeId.trim()) {
    errors.push('Route ID is required');
  }

  if (!routeName || typeof routeName !== 'string' || !routeName.trim()) {
    errors.push('Route name is required');
  }

  if (!routeCode || typeof routeCode !== 'string' || !routeCode.trim()) {
    errors.push('Route code is required');
  }

  if (!startingPoint || typeof startingPoint !== 'string' || !startingPoint.trim()) {
    errors.push('Starting point is required');
  }

  if (!destination || typeof destination !== 'string' || !destination.trim()) {
    errors.push('Destination is required');
  }

  if (data.stops && Array.isArray(data.stops)) {
    const sequences = new Set();
    const stopNames = new Set();
    data.stops.forEach((stop, idx) => {
      if (!stop.stopName || !stop.stopName.trim()) {
        errors.push(`Stop at index ${idx} requires a stopName`);
      }
      if (!stop.pickupTime || !stop.pickupTime.trim()) {
        errors.push(`Stop at index ${idx} requires a pickupTime`);
      }
      if (!stop.dropTime || !stop.dropTime.trim()) {
        errors.push(`Stop at index ${idx} requires a dropTime`);
      }
      if (sequences.has(stop.stopSequence)) {
        errors.push(`Duplicate stop sequence '${stop.stopSequence}' detected`);
      }
      sequences.add(stop.stopSequence);
      const normName = (stop.stopName || '').trim().toLowerCase();
      if (normName && stopNames.has(normName)) {
        errors.push(`Duplicate stop name '${stop.stopName}' within same route`);
      }
      stopNames.add(normName);
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateDriverInput(data = {}) {
  const errors = [];
  const { driverId, fullName, phoneNumber, drivingLicenceNumber, licenceExpiryDate } = data;

  if (!driverId || typeof driverId !== 'string' || !driverId.trim()) {
    errors.push('Driver ID is required');
  }

  if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
    errors.push('Full name is required');
  }

  if (!phoneNumber || typeof phoneNumber !== 'string' || !phoneNumber.trim()) {
    errors.push('Phone number is required');
  }

  if (!drivingLicenceNumber || typeof drivingLicenceNumber !== 'string' || !drivingLicenceNumber.trim()) {
    errors.push('Driving licence number is required');
  }

  if (!licenceExpiryDate) {
    errors.push('Licence expiry date is required');
  } else if (isNaN(new Date(licenceExpiryDate).getTime())) {
    errors.push('Licence expiry date must be a valid date');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateAllocationInput(data = {}) {
  const errors = [];
  const { student, bus, route, pickupStop, dropStop } = data;

  if (!student) {
    errors.push('Student reference is required');
  }

  if (!bus) {
    errors.push('Bus reference is required');
  }

  if (!route) {
    errors.push('Route reference is required');
  }

  if (!pickupStop || typeof pickupStop !== 'string' || !pickupStop.trim()) {
    errors.push('Pickup stop is required');
  }

  if (!dropStop || typeof dropStop !== 'string' || !dropStop.trim()) {
    errors.push('Drop stop is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateTripInput(data = {}) {
  const errors = [];
  const { tripId, bus, driver, route, tripType, tripDate, scheduledDeparture, scheduledArrival } = data;

  if (!tripId || typeof tripId !== 'string' || !tripId.trim()) {
    errors.push('Trip ID is required');
  }

  if (!bus) {
    errors.push('Bus assignment is required');
  }

  if (!driver) {
    errors.push('Driver assignment is required');
  }

  if (!route) {
    errors.push('Route assignment is required');
  }

  if (tripType && !['morning_pickup', 'evening_drop', 'special'].includes(tripType)) {
    errors.push('Invalid trip type. Must be morning_pickup, evening_drop, or special');
  }

  if (!tripDate) {
    errors.push('Trip date is required');
  } else if (isNaN(new Date(tripDate).getTime())) {
    errors.push('Trip date must be a valid date');
  }

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!scheduledDeparture || !timeRegex.test(scheduledDeparture.trim())) {
    errors.push('Scheduled departure must be in HH:MM format (24-hour)');
  }

  if (!scheduledArrival || !timeRegex.test(scheduledArrival.trim())) {
    errors.push('Scheduled arrival must be in HH:MM format (24-hour)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateGpsInput(data = {}) {
  const errors = [];
  const { bus, latitude, longitude } = data;

  if (!bus) {
    errors.push('Bus reference is required for GPS update');
  }

  const latNum = Number(latitude);
  if (latitude === undefined || isNaN(latNum) || latNum < -90 || latNum > 90) {
    errors.push('Latitude must be a valid number between -90 and 90');
  }

  const lngNum = Number(longitude);
  if (longitude === undefined || isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
    errors.push('Longitude must be a valid number between -180 and 180');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateAttendanceInput(data = {}) {
  const errors = [];
  const { trip, studentId, rollNumber, boardingStatus, dropStatus } = data;

  if (!trip) {
    errors.push('Trip reference is required');
  }

  if (!studentId && !rollNumber) {
    errors.push('Student identifier or roll number is required');
  }

  if (boardingStatus && !['pending', 'boarded', 'not_boarded', 'absent'].includes(boardingStatus)) {
    errors.push('Invalid boarding status');
  }

  if (dropStatus && !['pending', 'dropped', 'not_dropped'].includes(dropStatus)) {
    errors.push('Invalid drop status');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateAttendanceCorrection(data = {}) {
  const errors = [];
  const { reason, newBoardingStatus, newDropStatus } = data;

  if (!reason || typeof reason !== 'string' || !reason.trim()) {
    errors.push('Correction reason is mandatory for audit trail');
  }

  if (!newBoardingStatus && !newDropStatus) {
    errors.push('At least one status update (boarding or drop) must be provided');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateMaintenanceInput(data = {}) {
  const errors = [];
  const { maintenanceId, bus, serviceDate, serviceProvider, serviceDescription, labourCost, partsCost } = data;

  if (!maintenanceId || typeof maintenanceId !== 'string' || !maintenanceId.trim()) {
    errors.push('Maintenance ID is required');
  }

  if (!bus) {
    errors.push('Bus assignment is required');
  }

  if (!serviceDate || isNaN(new Date(serviceDate).getTime())) {
    errors.push('A valid service date is required');
  }

  if (!serviceProvider || typeof serviceProvider !== 'string' || !serviceProvider.trim()) {
    errors.push('Service provider / garage name is required');
  }

  if (!serviceDescription || typeof serviceDescription !== 'string' || !serviceDescription.trim()) {
    errors.push('Service description is required');
  }

  if (labourCost !== undefined && (isNaN(Number(labourCost)) || Number(labourCost) < 0)) {
    errors.push('Labour cost cannot be negative');
  }

  if (partsCost !== undefined && (isNaN(Number(partsCost)) || Number(partsCost) < 0)) {
    errors.push('Parts cost cannot be negative');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateFuelInput(data = {}) {
  const errors = [];
  const { fuelRecordId, bus, fuelStation, fuelDate, fuelQuantity, pricePerLitre, odometerReading, previousOdometerReading } = data;

  if (!fuelRecordId || typeof fuelRecordId !== 'string' || !fuelRecordId.trim()) {
    errors.push('Fuel record ID is required');
  }

  if (!bus) {
    errors.push('Bus assignment is required');
  }

  if (!fuelStation || typeof fuelStation !== 'string' || !fuelStation.trim()) {
    errors.push('Fuel station name is required');
  }

  if (!fuelDate || isNaN(new Date(fuelDate).getTime())) {
    errors.push('A valid fuel entry date is required');
  }

  const qty = Number(fuelQuantity);
  if (isNaN(qty) || qty <= 0) {
    errors.push('Fuel quantity must be a positive number');
  }

  const price = Number(pricePerLitre);
  if (isNaN(price) || price < 0) {
    errors.push('Price per litre cannot be negative');
  }

  const odo = Number(odometerReading);
  if (isNaN(odo) || odo < 0) {
    errors.push('Current odometer reading must be a valid non-negative number');
  }

  if (previousOdometerReading !== undefined) {
    const prevOdo = Number(previousOdometerReading);
    if (!isNaN(prevOdo) && odo < prevOdo) {
      errors.push(`Odometer reading (${odo} km) cannot decrease below previous reading (${prevOdo} km)`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateExpenseInput(data = {}) {
  const errors = [];
  const { expenseId, category, expenseDate, description, amount, vendor } = data;

  if (!expenseId || typeof expenseId !== 'string' || !expenseId.trim()) {
    errors.push('Expense ID is required');
  }

  if (!category || typeof category !== 'string' || !category.trim()) {
    errors.push('Expense category is required');
  }

  if (!expenseDate || isNaN(new Date(expenseDate).getTime())) {
    errors.push('A valid expense date is required');
  }

  if (!description || typeof description !== 'string' || !description.trim()) {
    errors.push('Expense description is required');
  }

  const amt = Number(amount);
  if (isNaN(amt) || amt <= 0) {
    errors.push('Expense amount must be greater than zero');
  }

  if (!vendor || typeof vendor !== 'string' || !vendor.trim()) {
    errors.push('Vendor / payee name is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateFeeStructureInput(data = {}) {
  const errors = [];
  const { academicYear, route, annualFee } = data;

  if (!academicYear || typeof academicYear !== 'string' || !academicYear.trim()) {
    errors.push('Academic year is required');
  }

  if (!route) {
    errors.push('Transit route reference is required');
  }

  const fee = Number(annualFee);
  if (isNaN(fee) || fee < 0) {
    errors.push('Annual transport fee cannot be negative');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validatePaymentInput(data = {}) {
  const errors = [];
  const { amount, paymentMethod } = data;

  const amt = Number(amount);
  if (isNaN(amt) || amt <= 0) {
    errors.push('Payment amount must be greater than zero');
  }

  if (paymentMethod && !['Cash', 'Online Payment', 'UPI', 'Card', 'Bank Transfer', 'DD'].includes(paymentMethod)) {
    errors.push('Invalid payment method selected');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateSosAlertInput(data = {}) {
  const errors = [];
  const { bus, emergencyType } = data;

  if (!bus) {
    errors.push('Bus reference is required for triggering SOS');
  }

  const validTypes = [
    'Medical Emergency',
    'Accident',
    'Vehicle Breakdown',
    'Student Safety Issue',
    'Fire Emergency',
    'Security Issue',
    'Other Emergency'
  ];

  if (!emergencyType || !validTypes.includes(emergencyType)) {
    errors.push(`Emergency type must be one of: ${validTypes.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateIncidentInput(data = {}) {
  const errors = [];
  const { category, description, severity } = data;

  const validCategories = [
    'Accident',
    'Vehicle Breakdown',
    'Student Safety',
    'Driver Related',
    'Route Issue',
    'Other'
  ];

  if (!category || !validCategories.includes(category)) {
    errors.push(`Category must be one of: ${validCategories.join(', ')}`);
  }

  if (!description || typeof description !== 'string' || !description.trim()) {
    errors.push('Incident description is required');
  }

  if (severity && !['Low', 'Medium', 'High', 'Critical'].includes(severity)) {
    errors.push('Severity must be Low, Medium, High, or Critical');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateGeofenceInput(data = {}) {
  const errors = [];
  const { name, center, radiusMeters } = data;

  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push('Geofence name is required');
  }

  if (!center || typeof center.latitude !== 'number' || typeof center.longitude !== 'number') {
    errors.push('Valid center latitude and longitude numbers are required');
  }

  if (radiusMeters !== undefined) {
    const r = Number(radiusMeters);
    if (isNaN(r) || r < 10) {
      errors.push('Radius must be at least 10 meters');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateComplaintInput(data = {}) {
  const errors = [];
  const { category, subject, description } = data;

  const validCategories = [
    'Bus Delay',
    'Driver Behaviour',
    'Route Problem',
    'Pickup Problem',
    'Drop-off Problem',
    'Student Safety',
    'Bus Condition',
    'Transport Fee Issue',
    'Other'
  ];

  if (!category || !validCategories.includes(category)) {
    errors.push(`Complaint category must be one of: ${validCategories.join(', ')}`);
  }

  if (!subject || typeof subject !== 'string' || !subject.trim()) {
    errors.push('Complaint subject is required');
  }

  if (!description || typeof description !== 'string' || !description.trim()) {
    errors.push('Complaint description is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateAnnouncementInput(data = {}) {
  const errors = [];
  const { title, content } = data;

  if (!title || typeof title !== 'string' || !title.trim()) {
    errors.push('Announcement title is required');
  }

  if (!content || typeof content !== 'string' || !content.trim()) {
    errors.push('Announcement content is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateBusInput,
  validateRouteInput,
  validateDriverInput,
  validateAllocationInput,
  validateTripInput,
  validateGpsInput,
  validateAttendanceInput,
  validateAttendanceCorrection,
  validateMaintenanceInput,
  validateFuelInput,
  validateExpenseInput,
  validateFeeStructureInput,
  validatePaymentInput,
  validateSosAlertInput,
  validateIncidentInput,
  validateGeofenceInput,
  validateComplaintInput,
  validateAnnouncementInput
};

