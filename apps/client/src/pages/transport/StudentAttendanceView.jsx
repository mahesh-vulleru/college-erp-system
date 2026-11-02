import React, { useState, useEffect, useCallback } from 'react';
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Bus,
  MapPin,
  AlertTriangle,
  Edit2
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import api from '../../api/apiClient';

export const StudentAttendanceView = () => {
  const { addToast } = useToast();

  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Audit Correction Modal
  const [correctingRecord, setCorrectingRecord] = useState(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const [newBoardingStatus, setNewBoardingStatus] = useState('boarded');
  const [newDropStatus, setNewDropStatus] = useState('pending');
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);

  // Fetch available trips to populate dropdown
  const fetchTrips = useCallback(async () => {
    try {
      const res = await api.getTrips();
      if (res && res.data) {
        setTrips(res.data);
        if (res.data.length > 0 && !selectedTripId) {
          setSelectedTripId(res.data[0]._id);
        }
      }
    } catch (err) {
      addToast('Failed to load trips for attendance', 'error');
    }
  }, [selectedTripId, addToast]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  // Fetch attendance records for selected trip
  const fetchAttendance = useCallback(async () => {
    if (!selectedTripId) return;
    try {
      setLoading(true);
      const res = await api.getTripAttendance(selectedTripId);
      if (res && res.data) {
        setAttendanceData(res);
      }
    } catch (err) {
      addToast(err.message || 'Failed to fetch trip attendance', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedTripId, addToast]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleMarkBoarded = async (attendanceId, studentName) => {
    try {
      const res = await api.markStudentBoarding(attendanceId);
      if (res.success) {
        addToast(`${studentName} marked as BOARDED`, 'success');
        fetchAttendance();
      }
    } catch (err) {
      addToast(err.message || 'Failed to mark student boarding', 'error');
    }
  };

  const handleMarkDropped = async (attendanceId, studentName) => {
    try {
      const res = await api.markStudentDrop(attendanceId);
      if (res.success) {
        addToast(`${studentName} confirmed as DROPPED`, 'success');
        fetchAttendance();
      }
    } catch (err) {
      addToast(err.message || 'Failed to mark student drop-off', 'error');
    }
  };

  const handleConfirmCorrection = async () => {
    if (!correctionReason.trim()) {
      addToast('Please provide a mandatory reason for correction', 'error');
      return;
    }

    try {
      setIsSubmittingCorrection(true);
      const res = await api.correctAttendance(correctingRecord._id, {
        reason: correctionReason,
        newBoardingStatus,
        newDropStatus
      });
      if (res.success) {
        addToast('Attendance updated with audit log', 'success');
        setCorrectingRecord(null);
        setCorrectionReason('');
        fetchAttendance();
      }
    } catch (err) {
      addToast(err.message || 'Failed to correct attendance', 'error');
    } finally {
      setIsSubmittingCorrection(false);
    }
  };

  const records = attendanceData?.data || [];
  const stats = attendanceData?.stats || {
    totalAllocated: 0,
    boardedCount: 0,
    droppedCount: 0,
    pendingCount: 0
  };

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.studentName.toLowerCase().includes(search.toLowerCase()) ||
      r.rollNumber.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (statusFilter === 'boarded') return r.boardingStatus === 'boarded';
    if (statusFilter === 'dropped') return r.dropStatus === 'dropped';
    if (statusFilter === 'pending') return r.boardingStatus === 'pending';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy-950 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-500" />
            Student Commuter Boarding & Drop Attendance
          </h2>
          <p className="text-xs text-navy-500">
            Trip-based passenger verification, real-time boarding, and drop confirmations.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAttendance} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Attendance
        </Button>
      </div>

      {/* Trip Selector Card */}
      <Card className="p-4 bg-white border border-navy-200">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div className="sm:col-span-2">
            <label className="block text-navy-800 font-semibold text-xs mb-1">
              Select Active Transit Trip
            </label>
            <Select
              value={selectedTripId}
              onChange={(e) => setSelectedTripId(e.target.value)}
              options={trips.map((t) => ({
                value: t._id,
                label: `${t.tripId} — ${t.bus?.busName} (${t.route?.routeName}) [${t.scheduledDeparture}-${t.scheduledArrival}]`
              }))}
            />
          </div>
          <div>
            <Input
              placeholder="Search student or roll number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-navy-400" />}
            />
          </div>
        </div>
      </Card>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3 text-center bg-white border border-navy-200">
          <span className="text-[11px] font-medium text-navy-500 block">Expected Commuters</span>
          <span className="text-xl font-bold text-navy-950">{stats.totalAllocated}</span>
        </Card>
        <Card className="p-3 text-center bg-emerald-50 border border-emerald-200">
          <span className="text-[11px] font-medium text-emerald-700 block">Boarded</span>
          <span className="text-xl font-bold text-emerald-800">{stats.boardedCount}</span>
        </Card>
        <Card className="p-3 text-center bg-blue-50 border border-blue-200">
          <span className="text-[11px] font-medium text-blue-700 block">Dropped</span>
          <span className="text-xl font-bold text-blue-800">{stats.droppedCount}</span>
        </Card>
        <Card className="p-3 text-center bg-amber-50 border border-amber-200">
          <span className="text-[11px] font-medium text-amber-700 block">Pending Boarding</span>
          <span className="text-xl font-bold text-amber-800">{stats.pendingCount}</span>
        </Card>
      </div>

      {/* Attendance Roster Table */}
      <Card className="overflow-hidden border border-navy-200">
        <Table
          columns={[
            {
              header: 'Student & Roll Number',
              accessor: 'studentName',
              render: (_, row) => (
                <div>
                  <span className="font-bold text-navy-950 text-xs block">{row.studentName}</span>
                  <span className="text-navy-500 font-mono text-[11px]">{row.rollNumber}</span>
                </div>
              )
            },
            {
              header: 'Boarding / Drop Stop',
              accessor: 'boardingStop',
              render: (_, row) => (
                <div className="text-xs">
                  <span className="text-navy-900 font-medium block">
                    Pickup: {row.boardingStop}
                  </span>
                  <span className="text-navy-500 text-[11px]">Drop: {row.dropStop}</span>
                </div>
              )
            },
            {
              header: 'Boarding Status',
              accessor: 'boardingStatus',
              render: (_, row) => (
                <div>
                  <Badge variant={row.boardingStatus === 'boarded' ? 'success' : 'warning'} size="xs">
                    {row.boardingStatus?.toUpperCase()}
                  </Badge>
                  {row.boardingTimestamp && (
                    <span className="block text-[10px] text-navy-400 mt-0.5">
                      {new Date(row.boardingTimestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  )}
                </div>
              )
            },
            {
              header: 'Drop Status',
              accessor: 'dropStatus',
              render: (_, row) => (
                <div>
                  <Badge variant={row.dropStatus === 'dropped' ? 'info' : 'neutral'} size="xs">
                    {row.dropStatus?.toUpperCase()}
                  </Badge>
                  {row.dropTimestamp && (
                    <span className="block text-[10px] text-navy-400 mt-0.5">
                      {new Date(row.dropTimestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  )}
                </div>
              )
            },
            {
              header: 'Actions',
              accessor: '_id',
              render: (_, row) => (
                <div className="flex items-center gap-1.5">
                  {row.boardingStatus !== 'boarded' && (
                    <Button
                      size="xs"
                      onClick={() => handleMarkBoarded(row._id, row.studentName)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <UserCheck className="w-3.5 h-3.5 mr-1" />
                      Board
                    </Button>
                  )}

                  {row.boardingStatus === 'boarded' && row.dropStatus !== 'dropped' && (
                    <Button
                      size="xs"
                      onClick={() => handleMarkDropped(row._id, row.studentName)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Drop
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      setCorrectingRecord(row);
                      setNewBoardingStatus(row.boardingStatus);
                      setNewDropStatus(row.dropStatus);
                    }}
                    title="Audit Correction"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-navy-500" />
                  </Button>
                </div>
              )
            }
          ]}
          data={filteredRecords}
          isLoading={loading}
          emptyText="No student attendance records found for this trip."
        />
      </Card>

      {/* AUDIT CORRECTION MODAL */}
      <Modal
        isOpen={!!correctingRecord}
        onClose={() => setCorrectingRecord(null)}
        title="Authorized Attendance Correction"
      >
        <div className="space-y-4 text-xs">
          <p className="text-navy-600">
            Correcting attendance record for{' '}
            <strong>
              {correctingRecord?.studentName} ({correctingRecord?.rollNumber})
            </strong>
            . This modification will be logged in the permanent audit trail.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-navy-700 font-semibold mb-1">Boarding Status</label>
              <Select
                value={newBoardingStatus}
                onChange={(e) => setNewBoardingStatus(e.target.value)}
                options={[
                  { value: 'pending', label: 'Pending' },
                  { value: 'boarded', label: 'Boarded' },
                  { value: 'not_boarded', label: 'Not Boarded' },
                  { value: 'absent', label: 'Absent' }
                ]}
              />
            </div>
            <div>
              <label className="block text-navy-700 font-semibold mb-1">Drop Status</label>
              <Select
                value={newDropStatus}
                onChange={(e) => setNewDropStatus(e.target.value)}
                options={[
                  { value: 'pending', label: 'Pending' },
                  { value: 'dropped', label: 'Dropped' },
                  { value: 'not_dropped', label: 'Not Dropped' }
                ]}
              />
            </div>
          </div>
          <div>
            <label className="block text-navy-700 font-semibold mb-1">
              Mandatory Correction Reason <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g. Card scanner failure, student joined at alternative stop"
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setCorrectingRecord(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isSubmittingCorrection}
              onClick={handleConfirmCorrection}
              className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold"
            >
              {isSubmittingCorrection ? 'Saving...' : 'Apply Correction'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StudentAttendanceView;

