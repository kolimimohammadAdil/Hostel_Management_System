import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Avatar } from '../../components/common/Avatar';
import {
  Users,
  Search,
  Filter,
  UserCheck,
  Building2,
  Mail,
  Phone,
  ShieldCheck,
  GraduationCap,
  Plus,
  Lock,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  Power,
  KeyRound,
} from 'lucide-react';

export const AdminUserManagementPage: React.FC = () => {
  const { addToast } = useApp();

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isStaffModalOpen, setIsStaffModalOpen] = useState<boolean>(false);
  const [staffFormLoading, setStaffFormLoading] = useState<boolean>(false);
  const [selectedUserDetails, setSelectedUserDetails] = useState<any | null>(null);

  // Staff Form
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('HostelGuard#2026');
  const [role, setRole] = useState<string>('girls_warden');
  const [employeeId, setEmployeeId] = useState<string>('');
  const [assignedHostel, setAssignedHostel] = useState<string>('Chakrika Girls Hostel');
  const [dutyAssignment, setDutyAssignment] = useState<string>('Chief Warden');
  const [phone, setPhone] = useState<string>('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getUsers({
        role: roleFilter,
        status: statusFilter,
        search: searchQuery,
      });
      if (res && res.success) {
        setUsers(res.users || []);
      }
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  // Toggle Account Active / Inactive Status
  const handleToggleStatus = async (user: any) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await adminApi.updateUserStatus(user.id || user._id, newStatus);
      if (res && res.success) {
        addToast(
          'Account Status Updated',
          `${user.fullName} is now ${newStatus.toUpperCase()}.`,
          'info'
        );
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
        );
      }
    } catch (err: any) {
      addToast('Update Failed', err.message || 'Failed to update user status', 'error');
    }
  };

  // Create Staff Account
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      addToast('Missing Info', 'Full name, email, and password are required', 'error');
      return;
    }

    try {
      setStaffFormLoading(true);
      const res = await adminApi.createStaffAccount({
        fullName,
        email,
        password,
        role,
        employeeId: employeeId || `EMP-${Date.now().toString().slice(-4)}`,
        assignedHostel,
        dutyAssignment,
        phone,
      });

      if (res && res.success) {
        addToast('Staff Created', `Staff account for ${fullName} provisioned successfully.`, 'success');
        setIsStaffModalOpen(false);
        setFullName('');
        setEmail('');
        setPhone('');
        fetchUsers();
      }
    } catch (err: any) {
      addToast('Creation Error', err.message || 'Failed to provision staff account', 'error');
    } finally {
      setStaffFormLoading(false);
    }
  };

  const roleTabOptions = [
    { label: 'All Roles', value: 'ALL' },
    { label: 'Students', value: 'student' },
    { label: 'Girls Warden', value: 'girls_warden' },
    { label: 'Boys Warden', value: 'boys_warden' },
    { label: 'Gate Security', value: 'gate_security' },
    { label: 'Parents', value: 'parent' },
    { label: 'Mess Incharge', value: 'mess_incharge' },
    { label: 'Maintenance', value: 'maintenance_incharge' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            User & Institutional Staff Directory
          </h2>
          <p className="text-xs text-slate-400">
            Supervisory administrative account control, room allocations, and role authorization.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsStaffModalOpen(true)}
          className="cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Provision Staff Account</span>
        </Button>
      </div>

      {/* Role Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        {roleTabOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setRoleFilter(opt.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              roleFilter === opt.value
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Search Bar & Secondary Filters */}
      <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name, roll number, employee ID, or room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-hidden"
        >
          <option value="ALL">All Account Statuses</option>
          <option value="active">Active Accounts</option>
          <option value="inactive">Inactive Accounts</option>
          <option value="suspended">Suspended Accounts</option>
        </select>

        <Button variant="outline" size="sm" type="submit">
          Search
        </Button>
      </form>

      {/* User Directory Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-400 uppercase font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">User Identity</th>
                <th className="py-3 px-4">Role & Department</th>
                <th className="py-3 px-4">Hostel / Room Allocation</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">Administrative Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {users.map((u) => {
                const isActive = u.status === 'active';
                return (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={u.avatarUrl || u.photoUrl}
                          name={u.fullName}
                          alt={u.fullName}
                          size="md"
                          shape="rounded"
                        />
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {u.fullName}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {u.rollNumber || u.employeeId || 'ID: ' + u.id.slice(-6)}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize block">
                        {u.role.replace('_', ' ')}
                      </span>
                      {u.dutyAssignment && (
                        <span className="text-[10px] text-blue-500 font-medium">
                          {u.dutyAssignment}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {u.hostelName ? (
                        <div>
                          <span className="text-slate-800 dark:text-slate-200 font-medium block">
                            {u.hostelName}
                          </span>
                          {u.roomNumber && (
                            <span className="text-[10px] font-mono text-slate-400">
                              Room {u.roomNumber}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Not Assigned</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-500 font-mono">
                      <span className="block">{u.email}</span>
                      {u.phone && <span className="text-[10px] text-slate-400">{u.phone}</span>}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 w-fit ${
                          isActive
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            ACTIVE
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            INACTIVE
                          </>
                        )}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedUserDetails(u)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                          title="View Profile Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 hover:bg-emerald-100'
                          }`}
                          title={isActive ? 'Deactivate Account' : 'Activate Account'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PROVISION STAFF MODAL */}
      <Modal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        title="Provision Authorized Institutional Staff Account"
      >
        <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Prof. Arvind Rao"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Institutional Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@alts.edu.in"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Initial Password *
              </label>
              <input
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Assigned Staff Role *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-medium"
              >
                <option value="girls_warden">Girls Hostel Warden</option>
                <option value="boys_warden">Boys Hostel Warden</option>
                <option value="gate_security">Gate Security Guard</option>
                <option value="mess_incharge">Mess Incharge</option>
                <option value="maintenance_incharge">Maintenance Incharge</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Assigned Hostel Wing
              </label>
              <select
                value={assignedHostel}
                onChange={(e) => setAssignedHostel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-medium"
              >
                <option value="Chakrika Girls Hostel">Chakrika Girls Hostel</option>
                <option value="ALTS Boys Hostel">ALTS Boys Hostel</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Employee ID
              </label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="e.g. EMP-2026-44"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Duty / Designation
              </label>
              <input
                type="text"
                value={dutyAssignment}
                onChange={(e) => setDutyAssignment(e.target.value)}
                placeholder="e.g. Chief Warden / Shift A"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsStaffModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={staffFormLoading}
            >
              Create Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* USER DETAILS MODAL */}
      {selectedUserDetails && (
        <Modal
          isOpen={Boolean(selectedUserDetails)}
          onClose={() => setSelectedUserDetails(null)}
          title={`Profile Details — ${selectedUserDetails.fullName}`}
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <Avatar
                src={selectedUserDetails.avatarUrl || selectedUserDetails.photoUrl}
                name={selectedUserDetails.fullName}
                alt={selectedUserDetails.fullName}
                size="lg"
                shape="rounded"
              />
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedUserDetails.fullName}
                </h4>
                <p className="font-mono text-blue-500 font-medium">
                  {selectedUserDetails.role.toUpperCase().replace('_', ' ')}
                </p>
                <p className="text-slate-400 font-mono text-[11px] mt-0.5">
                  ID: {selectedUserDetails.id}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Email</span>
                <p className="font-medium text-slate-800 dark:text-slate-200">{selectedUserDetails.email}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Phone</span>
                <p className="font-medium text-slate-800 dark:text-slate-200">{selectedUserDetails.phone || 'N/A'}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Hostel Allocation</span>
                <p className="font-medium text-slate-800 dark:text-slate-200">{selectedUserDetails.hostelName || 'None'}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Room Number</span>
                <p className="font-medium text-slate-800 dark:text-slate-200">{selectedUserDetails.roomNumber || 'None'}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedUserDetails(null)}
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

export default AdminUserManagementPage;

