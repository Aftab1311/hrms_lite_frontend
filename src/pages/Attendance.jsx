import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar as CalendarIcon, Filter, Users, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Button } from '../components/ui/button';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL ;
const API = `${BACKEND_URL.replace(/\/+$/, '')}/api`;

const Attendance = () => {
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('mark');

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (activeTab === 'view') {
      fetchAttendanceRecords();
    }
  }, [activeTab, dateRange]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/employees`);
      setEmployees(response.data);
      
      // Fetch today's attendance
      const today = format(selectedDate, 'yyyy-MM-dd');
      const attendanceRes = await axios.get(`${API}/attendance?date_filter=${today}`);
      
      // Merge employees with their attendance status
      const attendanceMap = {};
      attendanceRes.data.forEach(record => {
        attendanceMap[record.employeeId] = record.status;
      });
      
      const employeesWithAttendance = response.data.map(emp => ({
        ...emp,
        status: attendanceMap[emp.employeeId] || 'Not Marked'
      }));
      
      setEmployees(employeesWithAttendance);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      let url = `${API}/attendance`;
      
      if (dateRange.from && dateRange.to) {
        const startDate = format(dateRange.from, 'yyyy-MM-dd');
        const endDate = format(dateRange.to, 'yyyy-MM-dd');
        url += `?start_date=${startDate}&end_date=${endDate}`;
      }
      
      const response = await axios.get(url);
      
      // Group by employee and calculate stats
      const employeeMap = {};
      response.data.forEach(record => {
        if (!employeeMap[record.employeeId]) {
          employeeMap[record.employeeId] = {
            employeeId: record.employeeId,
            records: [],
            presentDays: 0,
            absentDays: 0
          };
        }
        employeeMap[record.employeeId].records.push(record);
        if (record.status === 'Present') {
          employeeMap[record.employeeId].presentDays++;
        } else {
          employeeMap[record.employeeId].absentDays++;
        }
      });
      
      // Fetch employee details
      const employeesRes = await axios.get(`${API}/employees`);
      const employeeDetailsMap = {};
      employeesRes.data.forEach(emp => {
        employeeDetailsMap[emp.employeeId] = emp;
      });
      
      const recordsWithDetails = Object.values(employeeMap).map(record => ({
        ...record,
        employee: employeeDetailsMap[record.employeeId]
      }));
      
      setAttendanceRecords(recordsWithDetails);
    } catch (error) {
      console.error('Failed to fetch attendance records:', error);
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = async (employeeId, status) => {
    try {
      setSaving(true);
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      await axios.post(`${API}/attendance`, {
        employeeId,
        date: dateStr,
        status
      });
      
      // Update local state
      setEmployees(employees.map(emp => 
        emp.employeeId === employeeId ? { ...emp, status } : emp
      ));
      
      toast.success('Attendance marked successfully');
    } catch (error) {
      console.error('Failed to mark attendance:', error);
      toast.error('Failed to mark attendance');
    } finally {
      setSaving(false);
    }
  };

  const handleDateChange = async (date) => {
    setSelectedDate(date);
    
    try {
      setLoading(true);
      const dateStr = format(date, 'yyyy-MM-dd');
      const attendanceRes = await axios.get(`${API}/attendance?date_filter=${dateStr}`);
      
      const attendanceMap = {};
      attendanceRes.data.forEach(record => {
        attendanceMap[record.employeeId] = record.status;
      });
      
      setEmployees(employees.map(emp => ({
        ...emp,
        status: attendanceMap[emp.employeeId] || 'Not Marked'
      })));
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'Present') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
          <CheckCircle2 size={12} />
          Present
        </span>
      );
    } else if (status === 'Absent') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
          <XCircle size={12} />
          Absent
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
        Not Marked
      </span>
    );
  };

  return (
    <div className="space-y-6" data-testid="attendance-page">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Attendance</h1>
        <p className="text-sm text-slate-500 mt-1">Manage daily attendance records</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="mark" data-testid="mark-attendance-tab">Mark Attendance</TabsTrigger>
          <TabsTrigger value="view" data-testid="view-records-tab">View Records</TabsTrigger>
        </TabsList>

        {/* Mark Attendance Tab */}
        <TabsContent value="mark" className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Mark Attendance</h2>
                <p className="text-sm text-slate-500 mt-1">Select date and mark attendance for employees</p>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" data-testid="select-date-btn">
                    <CalendarIcon className="mr-2" size={16} />
                    {format(selectedDate, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {loading ? (
              <div className="text-center py-8 text-slate-500">Loading...</div>
            ) : employees.length === 0 ? (
              <div className="text-center py-12" data-testid="no-employees-message">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="text-slate-400" size={32} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No employees found</h3>
                <p className="text-sm text-slate-500">Add employees first to mark attendance</p>
              </div>
            ) : (
              <div className="space-y-3">
                {employees.map((employee, index) => (
                  <div
                    key={employee.employeeId}
                    data-testid={`attendance-row-${index}`}
                    className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-indigo-600">
                            {employee.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{employee.fullName}</p>
                          <p className="text-xs text-slate-500">{employee.employeeId} • {employee.department}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="mr-4">
                        {getStatusBadge(employee.status)}
                      </div>
                      <RadioGroup
                        value={employee.status === 'Not Marked' ? '' : employee.status}
                        onValueChange={(value) => handleAttendanceChange(employee.employeeId, value)}
                        className="flex gap-4"
                        disabled={saving}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="Present"
                            id={`present-${employee.employeeId}`}
                            data-testid={`present-radio-${index}`}
                          />
                          <Label htmlFor={`present-${employee.employeeId}`} className="text-sm cursor-pointer">
                            Present
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="Absent"
                            id={`absent-${employee.employeeId}`}
                            data-testid={`absent-radio-${index}`}
                          />
                          <Label htmlFor={`absent-${employee.employeeId}`} className="text-sm cursor-pointer">
                            Absent
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* View Records Tab */}
        <TabsContent value="view" className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Attendance Records</h2>
                <p className="text-sm text-slate-500 mt-1">View and filter attendance history</p>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" data-testid="filter-date-range-btn">
                    <Filter className="mr-2" size={16} />
                    {dateRange.from && dateRange.to
                      ? `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd')}`
                      : 'Filter by Date Range'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {loading ? (
              <div className="text-center py-8 text-slate-500">Loading...</div>
            ) : attendanceRecords.length === 0 ? (
              <div className="text-center py-12" data-testid="no-records-message">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarIcon className="text-slate-400" size={32} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No records found</h3>
                <p className="text-sm text-slate-500">Attendance records will appear here once marked</p>
              </div>
            ) : (
              <div className="space-y-4">
                {attendanceRecords.map((record, index) => (
                  <div
                    key={record.employeeId}
                    data-testid={`record-row-${index}`}
                    className="border border-slate-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-indigo-600">
                            {record.employee?.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{record.employee?.fullName}</p>
                          <p className="text-xs text-slate-500">{record.employeeId} • {record.employee?.department}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-emerald-600">{record.presentDays} Present</p>
                          <p className="text-xs text-slate-500">{record.absentDays} Absent</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {record.records.slice(0, 6).map((att, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 bg-slate-50 rounded text-xs"
                        >
                          <span className="text-slate-600">{format(new Date(att.date), 'MMM dd, yyyy')}</span>
                          {getStatusBadge(att.status)}
                        </div>
                      ))}
                    </div>
                    {record.records.length > 6 && (
                      <p className="text-xs text-slate-500 mt-2 text-center">
                        +{record.records.length - 6} more records
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Attendance;