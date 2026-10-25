'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Edit3,
  Trash2,
  ExternalLink,
  Upload,
  FileText,
  Video,
  Headphones,
  Link2,
  Check,
  X,
  AlertCircle,
  Eye,
  CheckCircle2,
  Layers,
  ArrowUpDown,
  Loader2
} from 'lucide-react';
import { TrainingResource, TrainingResourceType } from '@/types/database';

interface AdminResourcesPanelProps {
  isSuperAdmin: boolean;
  currentUserEmail: string;
}

export default function AdminResourcesPanel({
  isSuperAdmin,
  currentUserEmail,
}: AdminResourcesPanelProps) {
  const [resources, setResources] = useState<TrainingResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<TrainingResource | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form State
  const [sourceMode, setSourceMode] = useState<'url' | 'upload'>('url');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    module: '',
    newModuleName: '',
    type: 'video' as TrainingResourceType,
    url: '',
    storage_path: null as string | null,
    file_size_bytes: null as number | null,
    sort_order: 0,
    is_active: true,
  });

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const fetchResources = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/portal/resources?admin=true');
      const data = await res.json();
      if (data.success) {
        setResources(data.resources || []);
      } else {
        showFeedback(data.error || 'Failed to fetch resources', 'error');
      }
    } catch (err: any) {
      showFeedback('Network error loading resources', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  // Distinct modules for filtering and select
  const distinctModules = useMemo(() => {
    const set = new Set<string>();
    resources.forEach((r) => {
      if (r.module) set.add(r.module);
    });
    return Array.from(set);
  }, [resources]);

  // Filtered resources
  const filteredList = useMemo(() => {
    return resources.filter((item) => {
      const matchesSearch =
        searchQuery === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.module.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesModule = moduleFilter === 'all' || item.module === moduleFilter;
      const matchesType = typeFilter === 'all' || item.type === typeFilter;

      return matchesSearch && matchesModule && matchesType;
    });
  }, [resources, searchQuery, moduleFilter, typeFilter]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingResource(null);
    setSourceMode('url');
    setForm({
      title: '',
      description: '',
      module: distinctModules[0] || 'NotebookLM Foundations',
      newModuleName: '',
      type: 'video',
      url: '',
      storage_path: null,
      file_size_bytes: null,
      sort_order: resources.length + 1,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (res: TrainingResource) => {
    setEditingResource(res);
    setSourceMode(res.storage_path ? 'upload' : 'url');
    setForm({
      title: res.title,
      description: res.description || '',
      module: res.module,
      newModuleName: '',
      type: res.type,
      url: res.url,
      storage_path: res.storage_path || null,
      file_size_bytes: res.file_size_bytes || null,
      sort_order: res.sort_order,
      is_active: res.is_active,
    });
    setIsModalOpen(true);
  };

  // File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setUploadProgressText(`Uploading ${file.name}...`);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/portal/resources/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      // Auto-detect type from file
      let detectedType: TrainingResourceType = 'pdf';
      if (file.type.startsWith('audio/') || file.name.endsWith('.mp3') || file.name.endsWith('.wav')) {
        detectedType = 'audio';
      } else if (file.type.startsWith('video/') || file.name.endsWith('.mp4')) {
        detectedType = 'video';
      }

      setForm((prev) => ({
        ...prev,
        url: data.publicUrl,
        storage_path: data.storagePath,
        file_size_bytes: data.fileSize,
        type: detectedType,
        title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
      }));

      showFeedback(`File "${file.name}" uploaded successfully!`);
    } catch (err: any) {
      showFeedback(`Upload error: ${err.message}`, 'error');
    } finally {
      setUploadingFile(false);
      setUploadProgressText('');
    }
  };

  // Submit Add / Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalModule = form.newModuleName.trim() ? form.newModuleName.trim() : form.module.trim();

    if (!form.title.trim()) {
      showFeedback('Resource title is required', 'error');
      return;
    }
    if (!finalModule) {
      showFeedback('Module name is required', 'error');
      return;
    }
    if (!form.url.trim()) {
      showFeedback('URL or uploaded file is required', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        module: finalModule,
        type: form.type,
        url: form.url.trim(),
        storage_path: form.storage_path,
        file_size_bytes: form.file_size_bytes,
        sort_order: Number(form.sort_order) || 0,
        is_active: form.is_active,
      };

      if (editingResource) {
        const res = await fetch('/api/portal/resources', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingResource.id, ...payload }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error);

        setResources((prev) =>
          prev.map((r) => (r.id === editingResource.id ? data.resource : r))
        );
        showFeedback(`Resource "${data.resource.title}" updated!`);
      } else {
        const res = await fetch('/api/portal/resources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error);

        setResources((prev) => [...prev, data.resource]);
        showFeedback(`Resource "${data.resource.title}" created successfully!`);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      showFeedback(`Save failed: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Quick Toggle Active State
  const handleToggleActive = async (res: TrainingResource) => {
    const updatedStatus = !res.is_active;
    setResources((prev) =>
      prev.map((r) => (r.id === res.id ? { ...r, is_active: updatedStatus } : r))
    );

    try {
      const response = await fetch('/api/portal/resources', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: res.id, is_active: updatedStatus }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error);
      }
      showFeedback(`Resource is now ${updatedStatus ? 'Active' : 'Hidden'}.`);
    } catch (err: any) {
      // Revert on error
      setResources((prev) =>
        prev.map((r) => (r.id === res.id ? { ...r, is_active: !updatedStatus } : r))
      );
      showFeedback(`Failed to update status: ${err.message}`, 'error');
    }
  };

  // Delete Resource
  const handleDelete = async (res: TrainingResource) => {
    if (!confirm(`Are you sure you want to delete "${res.title}"? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/portal/resources?id=${res.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error);
      }

      setResources((prev) => prev.filter((r) => r.id !== res.id));
      showFeedback('Resource deleted successfully.');
    } catch (err: any) {
      showFeedback(`Delete failed: ${err.message}`, 'error');
    }
  };

  const getTypeIcon = (type: TrainingResourceType) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-rose-600" />;
      case 'video':
        return <Video className="w-4 h-4 text-red-600" />;
      case 'audio':
        return <Headphones className="w-4 h-4 text-purple-600" />;
      default:
        return <Link2 className="w-4 h-4 text-sky-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast message */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between gap-3 shadow-md border animate-fade-in ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-red-50 text-red-900 border-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Controls Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <BookOpen className="w-4 h-4" />
            </span>
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
              NotebookLM & Training Materials
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Manage student-facing learning resources, guides, videos, PDFs, and official NotebookLM links.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={fetchResources}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Refresh resources list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Resource</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, description, or module..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Module Filter */}
        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
        >
          <option value="all">All Modules ({distinctModules.length})</option>
          {distinctModules.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
        >
          <option value="all">All Types</option>
          <option value="video">Videos</option>
          <option value="pdf">PDFs</option>
          <option value="link">Links</option>
          <option value="audio">Audios</option>
        </select>
      </div>

      {/* Resources Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Title & Details</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4 text-center">Active</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    <span>Loading learning resources...</span>
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No resources found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-center text-slate-400 font-bold text-[11px]">
                      {item.sort_order}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{item.title}</span>
                          {item.url.includes('notebooklm.google.com') && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-extrabold">
                              NotebookLM
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <div className="text-[11px] text-slate-500 line-clamp-1 max-w-md">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-block bg-slate-100 text-slate-700 font-semibold px-2.5 py-0.5 rounded-full text-[11px] border border-slate-200">
                        {item.module}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 capitalize font-bold text-[11px]">
                        {getTypeIcon(item.type)}
                        <span>{item.type}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                        {item.storage_path ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Supabase File
                          </span>
                        ) : (
                          <span className="text-sky-700 font-bold bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                            External Link
                          </span>
                        )}
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-emerald-700 p-0.5"
                          title="Open URL in new tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(item)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                          item.is_active
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                        title="Click to toggle visibility"
                      >
                        {item.is_active ? 'Active' : 'Hidden'}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                          title="Edit resource"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete resource"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Resource Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <BookOpen className="w-4 h-4" />
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingResource ? 'Edit Learning Resource' : 'Add New Learning Resource'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Resource Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Mastering NotebookLM: Complete Video Walkthrough"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Short Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Summarize what students will learn from this resource..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              {/* Module Name (Dropdown + Custom Input) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Topic / Module *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={form.module}
                    onChange={(e) => setForm({ ...form, module: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
                  >
                    {distinctModules.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                    <option value="New Module">+ Create New Module</option>
                  </select>

                  <input
                    type="text"
                    value={form.newModuleName}
                    onChange={(e) => setForm({ ...form, newModuleName: e.target.value })}
                    placeholder="Or type custom module name..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Resource Type */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Resource Type *</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['video', 'pdf', 'link', 'audio'] as TrainingResourceType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, type: t })}
                      className={`p-2.5 rounded-xl border text-xs font-bold capitalize flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        form.type === t
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-xs ring-1 ring-emerald-500'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      {getTypeIcon(t)}
                      <span>{t}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Source Mode Tabs (URL vs Upload) */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Resource Source *</label>
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setSourceMode('url')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        sourceMode === 'url' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      External URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setSourceMode('upload')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        sourceMode === 'upload' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      Upload File
                    </button>
                  </div>
                </div>

                {sourceMode === 'url' ? (
                  <div className="space-y-1">
                    <input
                      type="url"
                      required={sourceMode === 'url'}
                      value={form.url}
                      onChange={(e) => setForm({ ...form, url: e.target.value })}
                      placeholder="https://notebooklm.google.com or https://youtube.com/watch?v=..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                    <p className="text-[11px] text-slate-400">
                      Supports YouTube links, Google Drive public links, website URLs, or direct media links.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-2xl p-5 text-center bg-slate-50/50 transition-colors">
                      <input
                        type="file"
                        id="resource_file_upload"
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                        accept=".pdf,.mp3,.wav,.m4a,.mp4,audio/*,application/pdf"
                        className="hidden"
                      />
                      <label
                        htmlFor="resource_file_upload"
                        className="cursor-pointer space-y-2 block"
                      >
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                          {uploadingFile ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Upload className="w-5 h-5" />
                          )}
                        </div>
                        <div className="text-xs font-bold text-slate-700">
                          {uploadingFile ? uploadProgressText : 'Click to upload PDF, Audio, or Video'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Max 50MB (PDF, MP3, WAV, M4A, MP4)
                        </div>
                      </label>
                    </div>

                    {form.url && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                        <span className="truncate max-w-xs font-mono text-[11px]">
                          {form.url}
                        </span>
                        <span className="text-[10px] font-bold uppercase bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded">
                          Uploaded
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sort Order and Active Switch */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Display Order</label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>

                <div className="space-y-1 flex flex-col justify-end">
                  <label className="text-xs font-bold text-slate-700 mb-2">Visibility</label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-800">
                      Active (Visible to students)
                    </span>
                  </label>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingFile}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingResource ? 'Save Changes' : 'Create Resource'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
