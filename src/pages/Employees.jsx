import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Mail, Building2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${BACKEND_URL.replace(/\/+$/, '')}/api`;

const DEPARTMENTS = ['HR', 'Engineering', 'Sales', 'Marketing', 'Finance', 'Operations'];

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, employeeId: null });
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    department: ''
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/employees`);
      setEmployees(response.data);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email || !formData.department) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setFormLoading(true);
      await axios.post(`${API}/employees`, formData);
      toast.success('Employee added successfully');
      setDialogOpen(false);
      setFormData({ fullName: '', email: '', department: '' });
      fetchEmployees();
    } catch (error) {
      console.error('Failed to add employee:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to add employee';
      toast.error(errorMsg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/employees/${deleteDialog.employeeId}`);
      toast.success('Employee deleted successfully');
      setDeleteDialog({ open: false, employeeId: null });
      fetchEmployees();
    } catch (error) {
      console.error('Failed to delete employee:', error);
      toast.error('Failed to delete employee');
    }
  };

  const getDepartmentColor = (dept) => {
    const colors = {
      HR: 'bg-indigo-100 text-indigo-700',
      Engineering: 'bg-blue-100 text-blue-700',
      Sales: 'bg-emerald-100 text-emerald-700',
      Marketing: 'bg-purple-100 text-purple-700',
      Finance: 'bg-amber-100 text-amber-700',
      Operations: 'bg-rose-100 text-rose-700'
    };
    return colors[dept] || 'bg-slate-100 text-slate-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="employees-loading">
        <div className="text-slate-500">Loading employees...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="employees-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Employees</h1>
          <p className="text-sm text-slate-500 mt-1">{employees.length} total employees</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="add-employee-btn" className="bg-indigo-600 hover:bg-indigo-700">
              <Plus size={16} className="mr-2" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="add-employee-dialog">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
              <DialogDescription>
                Fill in the employee details below. Employee ID will be auto-generated.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  data-testid="employee-name-input"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  data-testid="employee-email-input"
                  placeholder="john.doe@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="department">Department *</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => setFormData({ ...formData, department: value })}
                >
                  <SelectTrigger className="mt-1" data-testid="employee-department-select">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={formLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  data-testid="submit-employee-btn"
                  disabled={formLoading}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {formLoading ? 'Adding...' : 'Add Employee'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Employees Table */}
      {employees.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center" data-testid="employees-empty-state">
          <div className="max-w-sm mx-auto">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="text-slate-400" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No employees yet</h3>
            <p className="text-sm text-slate-500 mb-6">Get started by adding your first employee</p>
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus size={16} className="mr-2" />
              Add Employee
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="employees-table">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                    Employee ID
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                    Name
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                    Email
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                    Department
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee, index) => (
                  <tr
                    key={employee.employeeId}
                    data-testid={`employee-row-${index}`}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-900">{employee.employeeId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{employee.fullName}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail size={14} className="text-slate-400" />
                        {employee.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${getDepartmentColor(employee.department)}`}>
                        <Building2 size={12} />
                        {employee.department}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        data-testid={`delete-employee-btn-${index}`}
                        onClick={() => setDeleteDialog({ open: true, employeeId: employee.employeeId })}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent data-testid="delete-employee-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this employee? This action cannot be undone and will also remove all associated attendance records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              data-testid="confirm-delete-btn"
              className="bg-rose-600 hover:bg-rose-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Employees;