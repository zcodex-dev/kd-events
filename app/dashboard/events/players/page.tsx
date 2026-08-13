'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/shared/header';
import { useDashboard } from '@/app/dashboard/layout';
import { Edit, Ban, Trash2, X, Upload, Loader2, Image as ImageIcon, Calendar, Users, Download } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export default function PlayersPage() {
  const { openSidebar } = useDashboard();
  const [stats, setStats] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'All' | 'Members' | 'NonMembers'>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; reg: any } | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingReg, setEditingReg] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: '', memberId: '', contact: '', phoneNumber: '', passportId: '', memberType: '', nationality: '' });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Add Player State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', memberId: '', memberType: 'Gold', nationality: '' });

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/registrations');
      const data = await res.json();
      if (data.success) {
        setStats(data.data.stats);
        setRegistrations(data.data.registrations);
      }
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Click outside context menu to close
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, reg: any) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      reg,
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredRegistrations.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to completely delete ${selectedIds.length} selected players?`)) return;
    setIsLoading(true);
    try {
      await Promise.all(selectedIds.map(id => fetch(`/api/admin/registrations/${id}`, { method: 'DELETE' })));
      toast.success(`${selectedIds.length} players deleted successfully`);
      setSelectedIds([]);
      fetchData();
    } catch {
      toast.error('Failed to delete some players');
      setIsLoading(false);
    }
  };

  const handleAction = async (action: 'edit' | 'ban' | 'delete') => {
    if (!contextMenu) return;
    const reg = contextMenu.reg;
    setContextMenu(null);

    if (action === 'edit') {
      setEditingReg(reg);
      setEditForm({
        name: reg.name || '',
        memberId: reg.memberId || '',
        contact: reg.contact || '',
        phoneNumber: reg.phoneNumber || '',
        passportId: reg.passportId || '',
        memberType: reg.memberType || (reg.isMember ? 'Gold' : ''),
        nationality: reg.nationality || '',
      });
      setAvatarFile(null);
      setAvatarPreview(reg.avatarUrl || null);
      setIsEditModalOpen(true);
    } else if (action === 'ban') {
      if (!confirm(`Are you sure you want to ${reg.isBanned ? 'unban' : 'ban'} ${reg.name}?`)) return;
      
      const formData = new FormData();
      formData.append('isBanned', String(!reg.isBanned));
      
      try {
        const res = await fetch(`/api/admin/registrations/${reg.id}`, {
          method: 'PUT',
          body: formData,
        });
        const data = await res.json();
        if (data.success) {
          toast.success(`Player ${reg.isBanned ? 'unbanned' : 'banned'} successfully`);
          fetchData();
        }
      } catch {
        toast.error('Failed to update ban status');
      }
    } else if (action === 'delete') {
      if (!confirm(`Are you sure you want to completely delete ${reg.name}?`)) return;
      
      try {
        const res = await fetch(`/api/admin/registrations/${reg.id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          toast.success('Player deleted');
          fetchData();
        }
      } catch {
        toast.error('Failed to delete player');
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReg) return;
    setIsSaving(true);

    const formData = new FormData();
    formData.append('name', editForm.name);
    formData.append('memberId', editForm.memberId);
    formData.append('contact', editForm.contact);
    formData.append('phoneNumber', editForm.phoneNumber);
    formData.append('passportId', editForm.passportId);
    formData.append('memberType', editForm.memberType);
    formData.append('nationality', editForm.nationality);
    
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }

    try {
      const res = await fetch(`/api/admin/registrations/${editingReg.id}`, {
        method: 'PUT',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Player updated successfully');
        setIsEditModalOpen(false);
        fetchData();
      } else {
        toast.error(data.error || 'Update failed');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenAddModal = () => {
    const randomNum = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
    setAddForm({ name: '', memberId: `KDB-${randomNum}`, memberType: 'Gold', nationality: '' });
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Player added successfully');
        setIsAddModalOpen(false);
        fetchData();
      } else {
        toast.error(data.error || 'Failed to add player');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'silver': return 'text-slate-400 font-bold';
      case 'platinum': return 'text-zinc-400 font-bold';
      case 'gold': return 'text-yellow-500 font-bold';
      case 'diamonds':
      case 'diamond': return 'text-cyan-500 font-bold';
      default: return 'text-neutral-500';
    }
  };

  const filteredRegistrations = registrations.filter(reg => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Members') return reg.isMember;
    if (activeTab === 'NonMembers') return !reg.isMember;
    return true;
  });

  const handleExport = () => {
    const formatData = (dataList: any[]) => dataList.map((reg, index) => ({
      '#': dataList.length - index,
      'Player / Guest Name': reg.name,
      'Member ID': reg.memberId || '-',
      'Member Type': reg.memberType || '-',
      'Registered Event': reg.eventTitle || '-',
      'Nationality': reg.nationality || '-',
      'Registered At': new Date(reg.createdAt).toLocaleString(),
      'Contact': reg.phoneNumber || reg.contact || '-',
      'Passport / ID': reg.passportId || reg.passportImageUrl || '-',
      'Status': reg.isBanned ? 'Banned' : 'Active'
    }));

    const members = registrations.filter(r => r.isMember);
    const nonMembers = registrations.filter(r => !r.isMember);

    const wb = XLSX.utils.book_new();

    const wsAll = XLSX.utils.json_to_sheet(formatData(registrations));
    XLSX.utils.book_append_sheet(wb, wsAll, `All Players (${registrations.length})`);

    const wsMembers = XLSX.utils.json_to_sheet(formatData(members));
    XLSX.utils.book_append_sheet(wb, wsMembers, `Members (${members.length})`);

    const wsNonMembers = XLSX.utils.json_to_sheet(formatData(nonMembers));
    XLSX.utils.book_append_sheet(wb, wsNonMembers, `Non-Members (${nonMembers.length})`);

    XLSX.writeFile(wb, `Players_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <>
      <Header
        title="Manage Players"
        description="Manage your event registrations and attendees"
        onMenuClick={openSidebar}
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-4 sm:p-6 space-y-6"
      >
        {/* Parent-Child Sub Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mr-2">
            Event Management:
          </span>
          <Link
            href="/dashboard/events"
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-all"
          >
            <Calendar className="w-3.5 h-3.5" />
            Events List
          </Link>
          <Link
            href="/dashboard/events/players"
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white shadow-sm transition-all"
          >
            <Users className="w-3.5 h-3.5" />
            Manage Players
          </Link>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl shadow-sm">
            <h3 className="text-neutral-500 text-sm">Total Registered</h3>
            <p className="text-3xl font-black mt-2">{stats?.total || 0}</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl shadow-sm">
            <h3 className="text-neutral-500 text-sm">KD Members</h3>
            <p className="text-3xl font-black mt-2 text-[#c3943a]">{stats?.members || 0}</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl shadow-sm">
            <h3 className="text-neutral-500 text-sm">Non-Members</h3>
            <p className="text-3xl font-black mt-2">{stats?.nonMembers || 0}</p>
          </div>
        </div>

        {/* Attendees Table */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <h2 className="text-lg font-bold">Manage Player <span className="text-xs font-normal text-neutral-500 ml-2">(Right-click rows to edit/ban)</span></h2>
            <div className="flex gap-2">
              {selectedIds.length > 0 && (
                <button onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-2">
                  <Trash2 className="w-4 h-4" /> Delete ({selectedIds.length})
                </button>
              )}
              <button onClick={handleExport} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-2">
                <Download className="w-4 h-4" /> Export Excel
              </button>
              <button onClick={handleOpenAddModal} className="bg-[#c3943a] hover:bg-[#e5ac53] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-all">
                + Add Player
              </button>
            </div>
          </div>
          <div className="px-6 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex gap-2 overflow-x-auto">
            <button 
              onClick={() => { setActiveTab('All'); setSelectedIds([]); }}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${activeTab === 'All' ? 'bg-[#c3943a] text-white' : 'text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800'}`}
            >
              All Players ({registrations.length})
            </button>
            <button 
              onClick={() => { setActiveTab('Members'); setSelectedIds([]); }}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${activeTab === 'Members' ? 'bg-[#c3943a] text-white' : 'text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800'}`}
            >
              Members ({stats?.members || 0})
            </button>
            <button 
              onClick={() => { setActiveTab('NonMembers'); setSelectedIds([]); }}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${activeTab === 'NonMembers' ? 'bg-[#c3943a] text-white' : 'text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800'}`}
            >
              Non-Members ({stats?.nonMembers || 0})
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left select-none">
              <thead className="text-xs text-neutral-500 bg-[#c3943a] text-white">
                <tr>
                  <th className="px-4 py-3 font-bold border-r border-white/20 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredRegistrations.length && filteredRegistrations.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-white/30 text-neutral-900 focus:ring-white bg-transparent cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3 font-bold border-r border-white/20">#</th>
                  <th className="px-6 py-3 font-bold border-r border-white/20">Player / Guest Name</th>
                  <th className="px-6 py-3 font-bold border-r border-white/20">Member ID</th>
                  <th className="px-6 py-3 font-bold border-r border-white/20">Member Type</th>
                  <th className="px-6 py-3 font-bold border-r border-white/20">Registered Event</th>
                  <th className="px-6 py-3 font-bold border-r border-white/20">Nationality</th>
                  <th className="px-6 py-3 font-bold border-r border-white/20">Registered At</th>
                  <th className="px-6 py-3 font-bold border-r border-white/20">Contact</th>
                  <th className="px-6 py-3 font-bold">Passport / ID</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-neutral-500">Loading...</td>
                  </tr>
                ) : filteredRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center">
                      <Users className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                      <p className="text-neutral-500 font-medium">No registrations found in this category.</p>
                    </td>
                  </tr>
                ) : (
                  filteredRegistrations.map((reg, index) => (
                    <tr 
                      key={reg.id} 
                      onContextMenu={(e) => handleContextMenu(e, reg)}
                      className={`border-b border-neutral-100 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-context-menu transition-colors ${reg.isBanned ? 'bg-red-50 dark:bg-red-900/10 opacity-70' : ''} ${selectedIds.includes(reg.id) ? 'bg-orange-50/50 dark:bg-orange-900/10' : ''}`}
                    >
                      <td className="px-4 py-4 border-r border-neutral-100 dark:border-neutral-800/50">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(reg.id)}
                          onChange={() => handleSelectOne(reg.id)}
                          className="w-4 h-4 rounded border-neutral-300 text-[#c3943a] focus:ring-[#c3943a] cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-4 font-medium text-neutral-500 border-r border-neutral-100 dark:border-neutral-800/50">
                        {filteredRegistrations.length - index}
                      </td>
                      <td className="px-6 py-4 font-medium border-r border-neutral-100 dark:border-neutral-800/50">
                        <div className="flex items-center gap-3">
                          {reg.avatarUrl ? (
                            <img src={reg.avatarUrl} alt={reg.name} className="w-8 h-8 rounded-full object-cover border border-neutral-200 dark:border-neutral-700" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center">
                              <span className="text-xs font-bold text-neutral-500">{reg.name.charAt(0).toUpperCase()}</span>
                            </div>
                          )}
                          <span className={reg.isBanned ? 'line-through text-red-500' : ''}>{reg.name}</span>
                          {reg.isBanned && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold uppercase ml-2">Banned</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 border-r border-neutral-100 dark:border-neutral-800/50">
                        {reg.memberId || '-'}
                      </td>
                      <td className="px-6 py-4 border-r border-neutral-100 dark:border-neutral-800/50">
                        <span className={getTypeColor(reg.memberType || (reg.isMember ? 'Gold' : ''))}>
                          {reg.memberType || (reg.isMember ? 'Gold' : '-')}
                        </span>
                      </td>
                      <td className="px-6 py-4 border-r border-neutral-100 dark:border-neutral-800/50 text-neutral-700 dark:text-neutral-300">
                        {reg.eventTitle || '-'}
                      </td>
                      <td className="px-6 py-4 border-r border-neutral-100 dark:border-neutral-800/50 text-neutral-700 dark:text-neutral-300">
                        {reg.nationality || '-'}
                      </td>
                      <td className="px-6 py-4 text-neutral-500 border-r border-neutral-100 dark:border-neutral-800/50 whitespace-nowrap">
                        {new Date(reg.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-neutral-500 border-r border-neutral-100 dark:border-neutral-800/50">
                        {reg.phoneNumber || reg.contact || '-'}
                      </td>
                      <td className="px-6 py-4 text-neutral-500">
                        {reg.passportId ? (
                          <span className="font-medium text-neutral-700 dark:text-neutral-300">{reg.passportId}</span>
                        ) : reg.passportImageUrl ? (
                          <a href={reg.passportImageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                            <ImageIcon className="w-3.5 h-3.5" /> View Image
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* Context Menu */}
      {contextMenu?.visible && (
        <div 
          className="fixed bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-2xl z-50 w-56 overflow-hidden flex flex-col"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50">
            <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">{contextMenu.reg.name}</p>
            <p className="text-[11px] text-neutral-500 truncate mt-0.5 font-medium">
              ID: <span className="text-neutral-700 dark:text-neutral-300">{contextMenu.reg.memberId || contextMenu.reg.passportId || 'N/A'}</span>
            </p>
            <p className="text-[11px] text-neutral-500 truncate mt-0.5 font-medium">
              Phone: <span className="text-neutral-700 dark:text-neutral-300">{contextMenu.reg.phoneNumber || contextMenu.reg.contact || 'N/A'}</span>
            </p>
          </div>
          
          <div className="py-1">
            <button onClick={() => handleAction('edit')} className="w-full text-left px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 text-sm font-medium">
              <Edit className="w-4 h-4" /> Edit Details
            </button>
          <button onClick={() => handleAction('ban')} className="w-full text-left px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 text-sm font-medium text-yellow-600 dark:text-yellow-500">
            <Ban className="w-4 h-4" /> {contextMenu.reg.isBanned ? 'Unban Player' : 'Ban Player'}
          </button>
          <button onClick={() => handleAction('delete')} className="w-full text-left px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-500 border-t border-neutral-100 dark:border-neutral-800">
            <Trash2 className="w-4 h-4" /> Delete Player
          </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-md overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-2xl"
            >
              <div className="flex justify-between items-center p-5 border-b border-neutral-100 dark:border-neutral-800">
                <h3 className="font-bold text-lg">Edit Player Details</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
                {/* Image Upload */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative group cursor-pointer w-24 h-24 rounded-full overflow-hidden border-2 border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-neutral-400" />
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-bold">
                      <Upload className="w-4 h-4 mb-1" />
                      Upload
                    </div>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                  <p className="text-xs text-neutral-500 font-medium">Click to upload avatar</p>
                </div>

                {/* Form Fields */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Full Name</label>
                      <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 outline-none focus:border-[#c3943a]" required />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Member ID</label>
                      <input type="text" value={editForm.memberId} onChange={e => setEditForm({...editForm, memberId: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 outline-none focus:border-[#c3943a]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Phone Number</label>
                      <input type="text" value={editForm.phoneNumber || ''} onChange={e => setEditForm({...editForm, phoneNumber: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 outline-none focus:border-[#c3943a]" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Contact (Email/TG)</label>
                      <input type="text" value={editForm.contact} onChange={e => setEditForm({...editForm, contact: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 outline-none focus:border-[#c3943a]" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Nationality</label>
                      <input type="text" value={editForm.nationality} onChange={e => setEditForm({...editForm, nationality: e.target.value})} placeholder="e.g. Cambodian" className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 outline-none focus:border-[#c3943a]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Member Type</label>
                      <select value={editForm.memberType} onChange={e => setEditForm({...editForm, memberType: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 outline-none focus:border-[#c3943a]">
                        <option value="">None</option>
                        <option value="Gold">Gold</option>
                        <option value="Silver">Silver</option>
                        <option value="Platinum">Platinum</option>
                        <option value="Diamond">Diamond</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Passport ID</label>
                      <input type="text" value={editForm.passportId} onChange={e => setEditForm({...editForm, passportId: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 outline-none focus:border-[#c3943a]" />
                    </div>
                  </div>
                  {editingReg?.passportImageUrl && (
                    <div>
                      <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Uploaded Passport Image</label>
                      <a href={editingReg.passportImageUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">
                        View Passport Image ↗
                      </a>
                    </div>
                  )}
                </div>

                <div className="pt-3">
                  <button type="submit" disabled={isSaving} className="w-full bg-[#c3943a] hover:bg-[#b08534] text-white font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Player Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !isSaving && setIsAddModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-900/50">
                <h3 className="text-xl font-bold">Add New Player</h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full transition-colors"
                  disabled={isSaving}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <form id="add-form" onSubmit={handleAddSubmit} className="space-y-6">
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Full Name</label>
                      <input type="text" value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 outline-none focus:border-[#c3943a]" required />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Member ID (Auto-Generated)</label>
                      <input type="text" value={addForm.memberId} onChange={e => setAddForm({...addForm, memberId: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-950/50 outline-none focus:border-[#c3943a] text-neutral-500" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Member Type</label>
                      <select value={addForm.memberType} onChange={e => setAddForm({...addForm, memberType: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 outline-none focus:border-[#c3943a]">
                        <option value="Gold">Gold</option>
                        <option value="Silver">Silver</option>
                        <option value="Platinum">Platinum</option>
                        <option value="Diamond">Diamond</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Nationality</label>
                      <input type="text" value={addForm.nationality} onChange={e => setAddForm({...addForm, nationality: e.target.value})} placeholder="e.g. Cambodian" className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 outline-none focus:border-[#c3943a]" />
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="add-form"
                  disabled={isSaving}
                  className="px-6 py-2 bg-[#c3943a] hover:bg-[#e5ac53] text-white font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Player'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
