import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  CalendarCheck,
  Plus,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  List,
  Calendar as CalendarIcon,
  MapPin,
  User,
  Building,
  Check,
  X,
  Edit,
  Trash2,
  Eye,
  Bell
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import api from '../../api/apiClient';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const EVENT_CATEGORIES = [
  'Academic Event',
  'Examination Deadline',
  'Accreditation Submission',
  'Institutional Review',
  'Council Meeting',
  'Administrative Deadline',
  'Fee Due Date',
  'Holiday'
];

const PRIORITIES = ['urgent', 'high', 'medium', 'low'];
const STATUSES = ['scheduled', 'in_progress', 'completed', 'overdue', 'cancelled'];

export const DeadlineEventTrackerPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState({
    todayEvents: 0,
    upcomingDeadlines: 0,
    overdueTasks: 0,
    completedTasks: 0,
    eventsThisMonth: 0,
    totalEvents: 0
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDept, setSelectedDept] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Calendar State
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Departments
  const [departments, setDepartments] = useState([]);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventCategory: 'Academic Event',
    startDate: '',
    endDate: '',
    priority: 'medium',
    department: '',
    venue: 'Main Campus',
    isAllDay: false,
    reminderDaysBefore: 2
  });

  // Fetch departments
  useEffect(() => {
    api.getDepartments().then((res) => {
      if (res?.data) setDepartments(res.data);
    }).catch(() => {});
  }, []);

  // Fetch Events
  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: viewMode === 'calendar' ? 100 : pageSize
      };
      if (selectedCategory !== 'all') params.eventCategory = selectedCategory;
      if (selectedPriority !== 'all') params.priority = selectedPriority;
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (selectedDept !== 'all') params.department = selectedDept;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.getEvents(params);
      if (res?.data) {
        setEvents(res.data.events || []);
        if (res.data.summary) setSummary(res.data.summary);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages || 1);
          setTotalRecords(res.data.pagination.total || 0);
        }
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Error loading events',
        message: err.message || 'Failed to load institutional events.'
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, viewMode, selectedCategory, selectedPriority, selectedStatus, selectedDept, searchQuery, addToast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Handle Create / Edit Submit
  const handleSubmitEvent = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        department: formData.department ? formData.department : null,
        assignedOwner: user?._id || user?.id
      };

      if (selectedEvent && selectedEvent._id) {
        await api.updateEvent(selectedEvent._id, payload);
        addToast({ type: 'success', title: 'Event Updated', message: 'The event was successfully updated.' });
      } else {
        await api.createEvent(payload);
        addToast({ type: 'success', title: 'Event Created', message: 'The new event/deadline has been scheduled.' });
      }
      setIsCreateModalOpen(false);
      setSelectedEvent(null);
      fetchEvents();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Action Failed',
        message: err.message || 'Failed to save event.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Mark Completed
  const handleMarkComplete = async () => {
    if (!selectedEvent) return;
    setIsSubmitting(true);
    try {
      await api.markEventCompleted(selectedEvent._id || selectedEvent.id, { completionNotes });
      addToast({ type: 'success', title: 'Completed', message: 'Event marked as completed.' });
      setIsCompleteModalOpen(false);
      setSelectedEvent(null);
      setCompletionNotes('');
      fetchEvents();
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: err.message || 'Failed to mark event as complete.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
    try {
      await api.deleteEvent(id);
      addToast({ type: 'success', title: 'Deleted', message: 'Event successfully removed.' });
      fetchEvents();
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: err.message || 'Failed to delete event.' });
    }
  };

  const openCreateModal = () => {
    setSelectedEvent(null);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    setFormData({
      title: '',
      description: '',
      eventCategory: 'Academic Event',
      startDate: `${dateStr}T09:00`,
      endDate: `${dateStr}T17:00`,
      priority: 'medium',
      department: '',
      venue: 'Main Campus',
      isAllDay: false,
      reminderDaysBefore: 2
    });
    setIsCreateModalOpen(true);
  };

  const openEditModal = (evt) => {
    setSelectedEvent(evt);
    const startStr = evt.startDate ? new Date(evt.startDate).toISOString().slice(0, 16) : '';
    const endStr = evt.endDate ? new Date(evt.endDate).toISOString().slice(0, 16) : '';
    setFormData({
      title: evt.title || '',
      description: evt.description || '',
      eventCategory: evt.eventCategory || 'Academic Event',
      startDate: startStr,
      endDate: endStr,
      priority: evt.priority || 'medium',
      department: evt.department?._id || evt.department || '',
      venue: evt.venue || 'Main Campus',
      isAllDay: !!evt.isAllDay,
      reminderDaysBefore: evt.reminderDaysBefore ?? 2
    });
    setIsCreateModalOpen(true);
  };

  // Helper formatting
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTimeDisplay = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityBadgeVariant = (priority) => {
    switch (priority) {
      case 'urgent': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'overdue': return 'danger';
      case 'in_progress': return 'primary';
      case 'scheduled': return 'info';
      case 'cancelled': return 'secondary';
      default: return 'secondary';
    }
  };

  // Calendar calculations
  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Padding from previous month
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null });
    }
    // Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      const currentDayDate = new Date(year, month, d);
      const dayStart = new Date(year, month, d, 0, 0, 0);
      const dayEnd = new Date(year, month, d, 23, 59, 59);

      const dayEvents = events.filter((evt) => {
        const s = new Date(evt.startDate);
        const e = new Date(evt.endDate);
        return s <= dayEnd && e >= dayStart;
      });

      const isToday =
        new Date().getDate() === d &&
        new Date().getMonth() === month &&
        new Date().getFullYear() === year;

      days.push({
        day: d,
        date: currentDayDate,
        isToday,
        events: dayEvents
      });
    }
    return days;
  }, [calendarDate, events]);

  const handlePrevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  };

  const handleTodayMonth = () => {
    setCalendarDate(new Date());
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-7 h-7 text-indigo-600" />
            Institutional Deadline & Event Tracker
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track academic milestones, compliance deadlines, council reviews, and campus events.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
              List View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              Calendar View
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchEvents}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={openCreateModal}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Schedule Event
          </Button>
        </div>
      </div>

      {/* 5 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Today's Events */}
        <Card className="p-4 border-l-4 border-l-blue-500 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Today&apos;s Events</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{summary.todayEvents}</h3>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-xl">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Active on campus today</p>
        </Card>

        {/* Upcoming Deadlines */}
        <Card className="p-4 border-l-4 border-l-amber-500 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Upcoming (14 Days)</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{summary.upcomingDeadlines}</h3>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-xl">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Deadlines approaching</p>
        </Card>

        {/* Overdue Tasks */}
        <Card className="p-4 border-l-4 border-l-rose-500 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Overdue Tasks</p>
              <h3 className="text-2xl font-bold text-rose-600 mt-1">{summary.overdueTasks}</h3>
            </div>
            <div className="p-2.5 bg-rose-50 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </div>
          </div>
          <p className="text-xs text-rose-600 font-medium mt-2">Requires immediate action</p>
        </Card>

        {/* Completed Tasks */}
        <Card className="p-4 border-l-4 border-l-emerald-500 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Completed Tasks</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{summary.completedTasks}</h3>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-2">Fulfilled milestones</p>
        </Card>

        {/* Events This Month */}
        <Card className="p-4 border-l-4 border-l-purple-500 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">This Month</p>
              <h3 className="text-2xl font-bold text-purple-600 mt-1">{summary.eventsThisMonth}</h3>
            </div>
            <div className="p-2.5 bg-purple-50 rounded-xl">
              <CalendarCheck className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Total monthly agenda</p>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search title, venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
            className="w-full py-1.5 px-3 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          >
            <option value="all">All Categories</option>
            {EVENT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Priority */}
          <select
            value={selectedPriority}
            onChange={(e) => { setSelectedPriority(e.target.value); setCurrentPage(1); }}
            className="w-full py-1.5 px-3 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          >
            <option value="all">All Priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p.toUpperCase()}</option>
            ))}
          </select>

          {/* Status */}
          <select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
            className="w-full py-1.5 px-3 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Department */}
          <select
            value={selectedDept}
            onChange={(e) => { setSelectedDept(e.target.value); setCurrentPage(1); }}
            className="w-full py-1.5 px-3 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          >
            <option value="all">All Departments / Campus</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>{d.name}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Main Content: List View or Calendar View */}
      {viewMode === 'list' ? (
        <Card className="shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="py-16 text-center text-gray-500 flex flex-col items-center justify-center">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
              <p className="text-sm">Loading institutional schedule...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={CalendarCheck}
                title="No Events Found"
                description="No institutional events or deadlines match the selected criteria."
                actionLabel="Schedule Event"
                onAction={openCreateModal}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 font-semibold text-gray-700">Event & Category</th>
                    <th scope="col" className="px-6 py-3 font-semibold text-gray-700">Timeline</th>
                    <th scope="col" className="px-6 py-3 font-semibold text-gray-700">Location / Dept</th>
                    <th scope="col" className="px-6 py-3 font-semibold text-gray-700">Priority</th>
                    <th scope="col" className="px-6 py-3 font-semibold text-gray-700">Status</th>
                    <th scope="col" className="px-6 py-3 font-semibold text-gray-700">Assigned To</th>
                    <th scope="col" className="px-6 py-3 text-right font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {events.map((evt) => (
                    <tr key={evt._id || evt.id} className="hover:bg-gray-50/75 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{evt.title}</div>
                        <div className="text-xs text-indigo-600 font-medium mt-0.5">{evt.eventCategory}</div>
                        {evt.description && (
                          <div className="text-xs text-gray-500 mt-1 line-clamp-1 max-w-xs">{evt.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-900 font-medium">
                          {evt.isAllDay
                            ? `${formatDateDisplay(evt.startDate)} - ${formatDateDisplay(evt.endDate)}`
                            : `${formatDateTimeDisplay(evt.startDate)}`
                          }
                        </div>
                        {!evt.isAllDay && (
                          <div className="text-xs text-gray-500">
                            to {formatDateTimeDisplay(evt.endDate)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-medium text-gray-800 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          {evt.venue || 'Main Campus'}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <Building className="w-3 h-3 text-gray-400" />
                          {evt.department?.name || 'All Campus'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getPriorityBadgeVariant(evt.priority)}>
                          {evt.priority.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getStatusBadgeVariant(evt.status)}>
                          {evt.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs font-medium text-gray-800 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          {evt.assignedOwner?.name || 'Administrator'}
                        </div>
                        <div className="text-xs text-gray-500">{evt.assignedOwner?.email || ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {evt.status !== 'completed' && evt.status !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => { setSelectedEvent(evt); setIsCompleteModalOpen(true); }}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50"
                              title="Mark as Completed"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => { setSelectedEvent(evt); setIsDetailModalOpen(true); }}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(evt)}
                            className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50"
                            title="Edit Event"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEvent(evt._id || evt.id)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                            title="Delete Event"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Showing {events.length} of {totalRecords} events
              </span>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          )}
        </Card>
      ) : (
        /* Calendar View */
        <Card className="p-6 shadow-sm">
          {/* Calendar Header with Navigation */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900">
                {calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h2>
              <button
                type="button"
                onClick={handleTodayMonth}
                className="px-2.5 py-1 text-xs font-semibold rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Today
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100"
                title="Previous Month"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100"
                title="Next Month"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-px mb-2 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((cell, index) => {
              if (!cell.day) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="min-h-[110px] rounded-lg bg-gray-50/50 p-2 border border-gray-100"
                  />
                );
              }

              return (
                <div
                  key={`day-${cell.day}`}
                  className={`min-h-[110px] rounded-lg p-2 border transition-all flex flex-col justify-between ${
                    cell.isToday
                      ? 'border-indigo-500 bg-indigo-50/20 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        cell.isToday
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-700'
                      }`}
                    >
                      {cell.day}
                    </span>
                    {cell.events.length > 0 && (
                      <span className="text-[10px] font-semibold text-gray-400">
                        {cell.events.length} evt
                      </span>
                    )}
                  </div>

                  {/* Day Events list */}
                  <div className="space-y-1 overflow-y-auto max-h-[85px]">
                    {cell.events.map((evt) => {
                      let chipColor = 'bg-blue-50 text-blue-700 border-blue-200';
                      if (evt.priority === 'urgent') chipColor = 'bg-rose-50 text-rose-700 border-rose-200';
                      else if (evt.priority === 'high') chipColor = 'bg-amber-50 text-amber-700 border-amber-200';
                      else if (evt.status === 'completed') chipColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';

                      return (
                        <button
                          key={evt._id || evt.id}
                          type="button"
                          onClick={() => { setSelectedEvent(evt); setIsDetailModalOpen(true); }}
                          className={`w-full text-left p-1 text-[11px] font-medium rounded border truncate block ${chipColor} hover:opacity-80 transition-opacity`}
                          title={`${evt.title} (${evt.eventCategory})`}
                        >
                          {evt.title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Schedule / Edit Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title={selectedEvent ? 'Edit Institutional Event' : 'Schedule New Event or Deadline'}
          size="lg"
        >
          <form onSubmit={handleSubmitEvent} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Event / Deadline Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. End Semester Exam Registration Deadline"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Description *
              </label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed objectives, compliance milestones, or procedures..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Category *
                </label>
                <select
                  value={formData.eventCategory}
                  onChange={(e) => setFormData({ ...formData, eventCategory: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {EVENT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Priority *
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  End Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Department (Leave blank for campus-wide)
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Campus-Wide (All Departments)</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Venue / Location
                </label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  placeholder="e.g. Auditorium A, Board Room, Online"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 font-medium">
                <input
                  type="checkbox"
                  checked={formData.isAllDay}
                  onChange={(e) => setFormData({ ...formData, isAllDay: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                All Day Event
              </label>

              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-700 font-medium">
                  Reminder (days before):
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={formData.reminderDaysBefore}
                  onChange={(e) => setFormData({ ...formData, reminderDaysBefore: parseInt(e.target.value, 10) || 0 })}
                  className="w-16 px-2 py-1 text-sm rounded border border-gray-300"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isSubmitting ? 'Saving...' : selectedEvent ? 'Update Event' : 'Schedule Event'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Mark Completed Modal */}
      {isCompleteModalOpen && selectedEvent && (
        <Modal
          isOpen={isCompleteModalOpen}
          onClose={() => setIsCompleteModalOpen(false)}
          title="Mark Event as Completed"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to mark <span className="font-semibold text-gray-900">&ldquo;{selectedEvent.title}&rdquo;</span> as completed?
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Completion Notes / Summary
              </label>
              <textarea
                rows={3}
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Add any outcomes, minutes reference, or compliance resolution notes..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsCompleteModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="button"
                onClick={handleMarkComplete}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                {isSubmitting ? 'Marking Complete...' : 'Confirm Completion'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Event Details View Modal */}
      {isDetailModalOpen && selectedEvent && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Event & Deadline Details"
          size="md"
        >
          <div className="space-y-4 text-sm">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={getStatusBadgeVariant(selectedEvent.status)}>
                  {selectedEvent.status.toUpperCase()}
                </Badge>
                <Badge variant={getPriorityBadgeVariant(selectedEvent.priority)}>
                  {selectedEvent.priority.toUpperCase()} PRIORITY
                </Badge>
              </div>
              <h3 className="text-lg font-bold text-gray-900">{selectedEvent.title}</h3>
              <p className="text-xs text-indigo-600 font-medium">{selectedEvent.eventCategory}</p>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg text-gray-700">
              {selectedEvent.description}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="font-semibold text-gray-500 block">Start Time</span>
                <span className="text-gray-900">{formatDateTimeDisplay(selectedEvent.startDate)}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-500 block">End Time</span>
                <span className="text-gray-900">{formatDateTimeDisplay(selectedEvent.endDate)}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-500 block">Venue</span>
                <span className="text-gray-900">{selectedEvent.venue || 'Main Campus'}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-500 block">Department</span>
                <span className="text-gray-900">{selectedEvent.department?.name || 'All Campus'}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-500 block">Assigned Owner</span>
                <span className="text-gray-900">{selectedEvent.assignedOwner?.name || 'Administrator'}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-500 block">Reminder Notice</span>
                <span className="text-gray-900">{selectedEvent.reminderDaysBefore} days before</span>
              </div>
            </div>

            {selectedEvent.completionNotes && (
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <span className="text-xs font-bold text-emerald-800 uppercase block mb-1">Completion Notes</span>
                <p className="text-xs text-emerald-900">{selectedEvent.completionNotes}</p>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DeadlineEventTrackerPage;

