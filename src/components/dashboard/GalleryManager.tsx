'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Folder, 
  Plus, 
  Edit3, 
  Trash2, 
  Calendar, 
  MapPin, 
  ExternalLink, 
  Upload, 
  Eye, 
  EyeOff, 
  Image as ImageIcon, 
  ArrowLeft, 
  ArrowRight,
  Check, 
  X, 
  UserCheck, 
  Users, 
  Sparkles,
  ArrowUp,
  ArrowDown,
  Star,
  RefreshCw,
  Search
} from 'lucide-react';
import { 
  adminFetchAllFolders, 
  adminCreateFolder, 
  adminUpdateFolder, 
  adminArchiveFolder,
  adminFetchEventsByFolder,
  adminCreateEvent,
  adminUpdateEvent,
  adminArchiveEvent,
  uploadGalleryImage,
  adminAddPicture,
  adminUpdatePicture,
  adminSetPictureCover,
  adminDeletePicture,
  adminReorderPictures,
  adminSetPictureTags,
  fetchTeamMembersForTagging
} from '@/lib/gallery';
import { 
  GalleryFolder, 
  GalleryEventWithPictures, 
  GalleryPictureWithTags, 
  TaggedMemberInfo,
  ExternalLinkItem
} from '@/types/database';
import MarkdownView from '@/components/MarkdownView';

export default function GalleryManager() {
  // Navigation level
  const [selectedFolder, setSelectedFolder] = useState<GalleryFolder | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<GalleryEventWithPictures | null>(null);

  // Data states
  const [folders, setFolders] = useState<GalleryFolder[]>([]);
  const [events, setEvents] = useState<GalleryEventWithPictures[]>([]);
  const [teamMembers, setTeamMembers] = useState<TaggedMemberInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Folder Modal state
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderForm, setFolderForm] = useState<{
    id?: string;
    title: string;
    slug: string;
    description: string;
    thumbnail_url: string;
    display_order: number;
    is_published: boolean;
  }>({
    title: '',
    slug: '',
    description: '',
    thumbnail_url: '',
    display_order: 0,
    is_published: true
  });

  // Event Modal state
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventMarkdownPreview, setEventMarkdownPreview] = useState(false);
  const [eventForm, setEventForm] = useState<{
    id?: string;
    title: string;
    slug: string;
    location: string;
    event_date: string;
    is_date_visible: boolean;
    description_markdown: string;
    external_links: ExternalLinkItem[];
    display_order: number;
    is_published: boolean;
  }>({
    title: '',
    slug: '',
    location: '',
    event_date: '',
    is_date_visible: true,
    description_markdown: '',
    external_links: [],
    display_order: 0,
    is_published: true
  });

  // Tagging Modal state
  const [taggingPicture, setTaggingPicture] = useState<GalleryPictureWithTags | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [tagSearchQuery, setTagSearchQuery] = useState('');

  // Initial load
  useEffect(() => {
    loadFolders();
    loadTeamMembers();
  }, []);

  const showFeedbackMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadFolders = async () => {
    setLoading(true);
    try {
      const data = await adminFetchAllFolders();
      setFolders(data);
    } catch (err: any) {
      console.error('Error fetching folders:', err);
      showFeedbackMsg(`Failed to load gallery albums: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadTeamMembers = async () => {
    try {
      const data = await fetchTeamMembersForTagging();
      setTeamMembers(data);
    } catch (err) {
      console.error('Failed to load team members:', err);
    }
  };

  const loadEventsForFolder = async (folder: GalleryFolder) => {
    setSelectedFolder(folder);
    setSelectedEvent(null);
    setLoading(true);
    try {
      const data = await adminFetchEventsByFolder(folder.id);
      setEvents(data);
    } catch (err: any) {
      showFeedbackMsg(`Failed to load events: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Helper to auto-generate slug
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  // --------------------------------------------------------------------------
  // Folder Handlers
  // --------------------------------------------------------------------------
  const openNewFolderModal = () => {
    setFolderForm({
      title: '',
      slug: '',
      description: '',
      thumbnail_url: '',
      display_order: folders.length + 1,
      is_published: true
    });
    setShowFolderModal(true);
  };

  const openEditFolderModal = (f: GalleryFolder) => {
    setFolderForm({
      id: f.id,
      title: f.title,
      slug: f.slug,
      description: f.description || '',
      thumbnail_url: f.thumbnail_url,
      display_order: f.display_order,
      is_published: f.is_published
    });
    setShowFolderModal(true);
  };

  const handleSaveFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderForm.title.trim()) return showFeedbackMsg('Title is required', 'error');
    if (!folderForm.thumbnail_url.trim()) return showFeedbackMsg('Thumbnail URL is required', 'error');

    const finalSlug = folderForm.slug.trim() || generateSlug(folderForm.title);
    setActionLoading(true);

    try {
      if (folderForm.id) {
        await adminUpdateFolder(folderForm.id, {
          title: folderForm.title,
          slug: finalSlug,
          description: folderForm.description,
          thumbnail_url: folderForm.thumbnail_url,
          display_order: folderForm.display_order,
          is_published: folderForm.is_published
        });
        showFeedbackMsg('Folder updated successfully');
      } else {
        await adminCreateFolder({
          title: folderForm.title,
          slug: finalSlug,
          description: folderForm.description,
          thumbnail_url: folderForm.thumbnail_url,
          display_order: folderForm.display_order,
          is_published: folderForm.is_published
        });
        showFeedbackMsg('Folder created successfully');
      }
      setShowFolderModal(false);
      loadFolders();
    } catch (err: any) {
      showFeedbackMsg(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchiveFolder = async (id: string, currentArchived: boolean) => {
    const action = currentArchived ? 'restore' : 'archive';
    if (!confirm(`Are you sure you want to ${action} this folder?`)) return;
    try {
      await adminArchiveFolder(id, !currentArchived);
      showFeedbackMsg(`Folder ${action}d successfully`);
      loadFolders();
    } catch (err: any) {
      showFeedbackMsg(err.message, 'error');
    }
  };

  const handleFolderThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setActionLoading(true);
    try {
      const res = await uploadGalleryImage(file, 'folders');
      setFolderForm(prev => ({ ...prev, thumbnail_url: res.publicUrl }));
      showFeedbackMsg('Thumbnail uploaded & compressed successfully');
    } catch (err: any) {
      showFeedbackMsg(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // Event Handlers
  // --------------------------------------------------------------------------
  const openNewEventModal = () => {
    setEventForm({
      title: '',
      slug: '',
      location: '',
      event_date: new Date().toISOString().split('T')[0],
      is_date_visible: true,
      description_markdown: '',
      external_links: [],
      display_order: events.length + 1,
      is_published: true
    });
    setEventMarkdownPreview(false);
    setShowEventModal(true);
  };

  const openEditEventModal = (evt: GalleryEventWithPictures) => {
    setEventForm({
      id: evt.id,
      title: evt.title,
      slug: evt.slug,
      location: evt.location,
      event_date: evt.event_date || '',
      is_date_visible: evt.is_date_visible,
      description_markdown: evt.description_markdown,
      external_links: evt.external_links || [],
      display_order: evt.display_order,
      is_published: evt.is_published
    });
    setEventMarkdownPreview(false);
    setShowEventModal(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFolder) return;
    if (!eventForm.title.trim()) return showFeedbackMsg('Event Title is required', 'error');
    if (!eventForm.location.trim()) return showFeedbackMsg('Location is required', 'error');

    const finalSlug = eventForm.slug.trim() || generateSlug(eventForm.title);
    setActionLoading(true);

    try {
      if (eventForm.id) {
        await adminUpdateEvent(eventForm.id, {
          title: eventForm.title,
          slug: finalSlug,
          location: eventForm.location,
          event_date: eventForm.event_date || null,
          is_date_visible: eventForm.is_date_visible,
          description_markdown: eventForm.description_markdown,
          external_links: eventForm.external_links,
          display_order: eventForm.display_order,
          is_published: eventForm.is_published
        });
        showFeedbackMsg('Event updated successfully');
      } else {
        await adminCreateEvent({
          folder_id: selectedFolder.id,
          title: eventForm.title,
          slug: finalSlug,
          location: eventForm.location,
          event_date: eventForm.event_date || null,
          is_date_visible: eventForm.is_date_visible,
          description_markdown: eventForm.description_markdown,
          external_links: eventForm.external_links,
          display_order: eventForm.display_order,
          is_published: eventForm.is_published
        });
        showFeedbackMsg('Event created successfully');
      }
      setShowEventModal(false);
      loadEventsForFolder(selectedFolder);
    } catch (err: any) {
      showFeedbackMsg(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchiveEvent = async (id: string, currentArchived: boolean) => {
    const action = currentArchived ? 'restore' : 'archive';
    if (!confirm(`Are you sure you want to ${action} this event?`)) return;
    try {
      await adminArchiveEvent(id, !currentArchived);
      showFeedbackMsg(`Event ${action}d successfully`);
      if (selectedFolder) loadEventsForFolder(selectedFolder);
    } catch (err: any) {
      showFeedbackMsg(err.message, 'error');
    }
  };

  // --------------------------------------------------------------------------
  // Picture Handlers
  // --------------------------------------------------------------------------
  const handleBatchPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedEvent) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setActionLoading(true);
    let successCount = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await uploadGalleryImage(file, `events/${selectedEvent.slug}`);
        const isCover = (selectedEvent.pictures.length === 0 && i === 0);
        const order = selectedEvent.pictures.length + i;
        await adminAddPicture(selectedEvent.id, res.publicUrl, res.storagePath, '', isCover, order, []);
        successCount++;
      }
      showFeedbackMsg(`Uploaded & compressed ${successCount} photos!`);
      // Refresh event pictures
      if (selectedFolder) {
        const refreshed = await adminFetchEventsByFolder(selectedFolder.id);
        setEvents(refreshed);
        const currentEvt = refreshed.find(e => e.id === selectedEvent.id);
        if (currentEvt) setSelectedEvent(currentEvt);
      }
    } catch (err: any) {
      const partialUploadMessage = successCount > 0
        ? ` Uploaded ${successCount} photo${successCount === 1 ? '' : 's'} before the failure.`
        : '';
      showFeedbackMsg(`Error during upload: ${err.message}.${partialUploadMessage}`, 'error');
    } finally {
      setActionLoading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleSetCoverPhoto = async (picId: string) => {
    if (!selectedEvent) return;
    try {
      await adminSetPictureCover(picId, selectedEvent.id);
      showFeedbackMsg('Cover photo updated');
      if (selectedFolder) {
        const refreshed = await adminFetchEventsByFolder(selectedFolder.id);
        setEvents(refreshed);
        const currentEvt = refreshed.find(e => e.id === selectedEvent.id);
        if (currentEvt) setSelectedEvent(currentEvt);
      }
    } catch (err: any) {
      showFeedbackMsg(err.message, 'error');
    }
  };

  const handleDeletePhoto = async (picId: string, storagePath: string) => {
    if (!confirm('Are you sure you want to remove this photo?')) return;
    try {
      await adminDeletePicture(picId, storagePath);
      showFeedbackMsg('Photo removed');
      if (selectedFolder) {
        const refreshed = await adminFetchEventsByFolder(selectedFolder.id);
        setEvents(refreshed);
        const currentEvt = refreshed.find(e => e.id === selectedEvent?.id);
        if (currentEvt) setSelectedEvent(currentEvt);
      }
    } catch (err: any) {
      showFeedbackMsg(err.message, 'error');
    }
  };

  const handleMovePhoto = async (index: number, direction: 'up' | 'down') => {
    if (!selectedEvent) return;
    const pics = [...selectedEvent.pictures];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= pics.length) return;

    // Swap
    const temp = pics[index];
    pics[index] = pics[targetIndex];
    pics[targetIndex] = temp;

    const idsInOrder = pics.map(p => p.id);
    try {
      await adminReorderPictures(idsInOrder);
      if (selectedFolder) {
        const refreshed = await adminFetchEventsByFolder(selectedFolder.id);
        setEvents(refreshed);
        const currentEvt = refreshed.find(e => e.id === selectedEvent.id);
        if (currentEvt) setSelectedEvent(currentEvt);
      }
    } catch (err: any) {
      showFeedbackMsg(err.message, 'error');
    }
  };

  // --------------------------------------------------------------------------
  // Tagging Handlers
  // --------------------------------------------------------------------------
  const openTagModal = (pic: GalleryPictureWithTags) => {
    setTaggingPicture(pic);
    const currentMemberIds = (pic.tags || []).map(t => t.member?.id).filter(Boolean) as string[];
    setSelectedMemberIds(currentMemberIds);
    setTagSearchQuery('');
  };

  const toggleMemberTag = (memberId: string) => {
    setSelectedMemberIds(prev => 
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    );
  };

  const handleSaveTags = async () => {
    if (!taggingPicture || !selectedFolder || !selectedEvent) return;
    setActionLoading(true);
    try {
      await adminSetPictureTags(taggingPicture.id, selectedMemberIds);
      showFeedbackMsg('Tagged members updated successfully');
      setTaggingPicture(null);
      // Refresh events
      const refreshed = await adminFetchEventsByFolder(selectedFolder.id);
      setEvents(refreshed);
      const currentEvt = refreshed.find(e => e.id === selectedEvent.id);
      if (currentEvt) setSelectedEvent(currentEvt);
    } catch (err: any) {
      showFeedbackMsg(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================================================
  // RENDER: LEVEL 3 - PICTURES MANAGER FOR EVENT
  // ==========================================================================
  if (selectedEvent && selectedFolder) {
    const pictures = selectedEvent.pictures || [];

    return (
      <div className="space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <button
              onClick={() => setSelectedFolder(null)}
              className="hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Folder className="w-3.5 h-3.5" />
              Albums
            </button>
            <span>/</span>
            <button
              onClick={() => setSelectedEvent(null)}
              className="hover:text-emerald-800 font-bold cursor-pointer"
            >
              {selectedFolder.title}
            </button>
            <span>/</span>
            <span className="font-extrabold text-slate-900">{selectedEvent.title} (Photos)</span>
          </div>

          <button
            onClick={() => setSelectedEvent(null)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Events
          </button>
        </div>

        {/* Feedback Message */}
        {feedback && (
          <div className={`p-3 rounded-xl text-xs font-bold ${
            feedback.type === 'success' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-red-100 text-red-900 border border-red-300'
          }`}>
            {feedback.text}
          </div>
        )}

        {/* Header Action Bar */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div>
            <h2 className="text-xl font-black text-slate-900">
              Manage Photos & Member Tagging
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Event: <span className="font-semibold text-slate-700">{selectedEvent.title}</span> • {pictures.length} Photos
            </p>
          </div>

          {/* Upload Button */}
          <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-all shadow-sm cursor-pointer hover:scale-102">
            <Upload className="w-4 h-4" />
            <span>Upload Photos (Batch)</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleBatchPhotoUpload}
              className="hidden"
              disabled={actionLoading}
            />
          </label>
        </div>

        <p className="text-xs text-slate-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          Photos appear publicly only when both this event and its album are published and not archived.
        </p>

        {/* Photos Grid */}
        {pictures.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
            <ImageIcon className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">No photos uploaded for this event yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Click &quot;Upload Photos (Batch)&quot; to upload high-resolution images. Images are automatically compressed to ~350KB for rapid loading.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {pictures.map((pic, idx) => {
              const tags = pic.tags || [];

              return (
                <div 
                  key={pic.id}
                  className={`bg-white rounded-2xl border transition-all shadow-xs flex flex-col justify-between overflow-hidden ${
                    pic.is_cover ? 'border-emerald-500 ring-2 ring-emerald-400/40' : 'border-slate-200'
                  }`}
                >
                  {/* Photo Preview Container */}
                  <div className="relative h-44 w-full bg-slate-100 group">
                    <Image
                      src={pic.image_url}
                      alt={pic.caption || `Event photo ${idx + 1}`}
                      fill
                      className="object-cover"
                    />

                    {/* Cover Photo Badge */}
                    {pic.is_cover ? (
                      <span className="absolute top-2 left-2 inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-700 text-white shadow-sm">
                        <Star className="w-3 h-3 fill-white" />
                        Cover
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetCoverPhoto(pic.id)}
                        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 hover:bg-emerald-700 text-white cursor-pointer"
                      >
                        Set as Cover
                      </button>
                    )}

                    {/* Order Badges & Move Controls */}
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      {idx > 0 && (
                        <button
                          onClick={() => handleMovePhoto(idx, 'up')}
                          className="p-1 rounded-md bg-black/50 hover:bg-black text-white text-xs cursor-pointer"
                          title="Move Left"
                        >
                          <ArrowLeft className="w-3 h-3" />
                        </button>
                      )}
                      {idx < pictures.length - 1 && (
                        <button
                          onClick={() => handleMovePhoto(idx, 'down')}
                          className="p-1 rounded-md bg-black/50 hover:bg-black text-white text-xs cursor-pointer"
                          title="Move Right"
                        >
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeletePhoto(pic.id, pic.storage_path)}
                        className="p-1 rounded-md bg-red-600/80 hover:bg-red-700 text-white text-xs cursor-pointer"
                        title="Delete photo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Details & Tagged Members */}
                  <div className="p-3.5 space-y-2.5">
                    {/* Caption input */}
                    <input
                      type="text"
                      defaultValue={pic.caption || ''}
                      onBlur={(e) => adminUpdatePicture(pic.id, { caption: e.target.value })}
                      placeholder="Add photo caption..."
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-800"
                    />

                    {/* Tagged Members list */}
                    <div className="pt-1 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <Users className="w-3 h-3 text-emerald-600" />
                          Tagged ({tags.length})
                        </span>
                        <button
                          onClick={() => openTagModal(pic)}
                          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                        >
                          + Tag People
                        </button>
                      </div>

                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {tags.map((t, tIdx) => (
                            <span 
                              key={tIdx} 
                              className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 px-2 py-0.5 rounded-full"
                            >
                              <span>{t.member?.full_name}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tag Members Modal */}
        {taggingPicture && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-700" />
                  <h3 className="text-base font-extrabold text-slate-900">Tag Team Members in Photo</h3>
                </div>
                <button
                  onClick={() => setTaggingPicture(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search Members */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={tagSearchQuery}
                  onChange={(e) => setTagSearchQuery(e.target.value)}
                  placeholder="Search team members by name..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* Members Checklist */}
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {teamMembers
                  .filter(m => !tagSearchQuery.trim() || m.full_name.toLowerCase().includes(tagSearchQuery.toLowerCase()))
                  .map((mem) => {
                    const isSelected = selectedMemberIds.includes(mem.id);

                    return (
                      <div
                        key={mem.id}
                        onClick={() => toggleMemberTag(mem.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors cursor-pointer ${
                          isSelected 
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold' 
                            : 'hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {mem.avatar_url ? (
                            <Image
                              src={mem.avatar_url}
                              alt={mem.full_name}
                              width={24}
                              height={24}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                              {mem.full_name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <span className="text-xs block leading-tight">{mem.full_name}</span>
                            {mem.team_tag && (
                              <span className="text-[10px] text-slate-400 font-normal">{mem.team_tag}</span>
                            )}
                          </div>
                        </div>

                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                          isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setTaggingPicture(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTags}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer shadow-sm"
                >
                  {actionLoading ? 'Saving...' : `Save Tags (${selectedMemberIds.length})`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================================================
  // RENDER: LEVEL 2 - EVENTS LIST FOR SELECTED FOLDER
  // ==========================================================================
  if (selectedFolder) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <button
              onClick={() => setSelectedFolder(null)}
              className="hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Folder className="w-3.5 h-3.5" />
              Albums
            </button>
            <span>/</span>
            <span className="font-extrabold text-slate-900">{selectedFolder.title}</span>
          </div>

          <button
            onClick={() => setSelectedFolder(null)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Albums
          </button>
        </div>

        {/* Feedback Message */}
        {feedback && (
          <div className={`p-3 rounded-xl text-xs font-bold ${
            feedback.type === 'success' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-red-100 text-red-900 border border-red-300'
          }`}>
            {feedback.text}
          </div>
        )}

        {/* Folder Header Summary */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Selected Album
              </span>
              <span className="text-xs text-slate-400">Slug: /{selectedFolder.slug}</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900">{selectedFolder.title}</h2>
            {selectedFolder.description && (
              <p className="text-xs text-slate-500 max-w-xl">{selectedFolder.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/events/${selectedFolder.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Preview Public View</span>
            </Link>

            <button
              onClick={openNewEventModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-all shadow-sm cursor-pointer hover:scale-102"
            >
              <Plus className="w-4 h-4" />
              <span>Add Event</span>
            </button>
          </div>
        </div>

        {/* Events Table / Cards */}
        {events.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">No events inside this album yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Click &quot;Add Event&quot; above to create the first documented event in this folder.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((evt, idx) => {
              const photoCount = evt.pictures?.length || 0;

              return (
                <div 
                  key={evt.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                        Event #{idx + 1}
                      </span>
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {evt.location}
                      </span>
                      {evt.event_date && (
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                          evt.is_date_visible ? 'bg-slate-100 text-slate-700' : 'bg-amber-50 text-amber-800'
                        }`}>
                          <Calendar className="w-3 h-3" />
                          {evt.event_date}
                          {!evt.is_date_visible && <span className="font-bold text-[9px] uppercase ml-1">(Hidden on Public View)</span>}
                        </span>
                      )}
                      {evt.is_archived ? (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Archived
                        </span>
                      ) : !evt.is_published ? (
                        <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Draft
                        </span>
                      ) : null}
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 leading-snug">
                      {evt.title}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2">
                      {evt.description_markdown.substring(0, 160)}...
                    </p>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => setSelectedEvent(evt)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition-colors cursor-pointer border border-emerald-200"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Photos ({photoCount})</span>
                    </button>

                    <button
                      onClick={() => openEditEventModal(evt)}
                      className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                      title="Edit event"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleArchiveEvent(evt.id, evt.is_archived)}
                      className={`p-2 rounded-xl transition-colors cursor-pointer ${
                        evt.is_archived
                          ? 'hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800'
                          : 'hover:bg-red-50 text-slate-400 hover:text-red-600'
                      }`}
                      title={evt.is_archived ? 'Restore event' : 'Archive event'}
                    >
                      {evt.is_archived ? <RefreshCw className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add / Edit Event Modal */}
        {showEventModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-slate-900">
                  {eventForm.id ? 'Edit Event Details' : 'Create New Event in Album'}
                </h3>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEvent} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={eventForm.title}
                    onChange={(e) => setEventForm(prev => ({ 
                      ...prev, 
                      title: e.target.value,
                      slug: prev.id ? prev.slug : generateSlug(e.target.value)
                    }))}
                    placeholder="e.g. Hands-On NotebookLM Workshop"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Venue / Location *
                    </label>
                    <input
                      type="text"
                      required
                      value={eventForm.location}
                      onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g. FMS Executive Seminar Hall, IIUI"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Event Date
                    </label>
                    <input
                      type="date"
                      value={eventForm.event_date}
                      onChange={(e) => setEventForm(prev => ({ ...prev, event_date: e.target.value }))}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                {/* Date Visibility Switch (Core Requirement!) */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Show Date on Public Cards</span>
                    <span className="text-[11px] text-slate-500">
                      When turned off, the event date is hidden from public visitors and only visible in admin records.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={eventForm.is_date_visible}
                      onChange={(e) => setEventForm(prev => ({ ...prev, is_date_visible: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
                  </label>
                </div>

                {/* Markdown Description / Caption Editor with Live Preview */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      Event Caption / Story (Markdown Supported) *
                    </label>
                    <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 bg-slate-50 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setEventMarkdownPreview(false)}
                        className={`px-2.5 py-1 rounded font-bold transition-colors cursor-pointer ${
                          !eventMarkdownPreview ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
                        }`}
                      >
                        Write
                      </button>
                      <button
                        type="button"
                        onClick={() => setEventMarkdownPreview(true)}
                        className={`px-2.5 py-1 rounded font-bold transition-colors cursor-pointer ${
                          eventMarkdownPreview ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
                        }`}
                      >
                        Preview
                      </button>
                    </div>
                  </div>

                  {!eventMarkdownPreview ? (
                    <textarea
                      required
                      rows={6}
                      value={eventForm.description_markdown}
                      onChange={(e) => setEventForm(prev => ({ ...prev, description_markdown: e.target.value }))}
                      placeholder="Write event description using markdown: **bold**, *italic*, ### headings, - bullet lists, > blockquotes..."
                      className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 leading-relaxed"
                    />
                  ) : (
                    <div className="min-h-36 p-4 rounded-xl border border-slate-200 bg-slate-50/60 overflow-y-auto">
                      <MarkdownView content={eventForm.description_markdown || '*Nothing to preview yet*'} />
                    </div>
                  )}
                </div>

                {/* External Links */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">External Links (Optional)</span>
                    <button
                      type="button"
                      onClick={() => setEventForm(prev => ({
                        ...prev,
                        external_links: [...prev.external_links, { label: '', url: '' }]
                      }))}
                      className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                    >
                      + Add Link
                    </button>
                  </div>

                  {eventForm.external_links.map((link, lIdx) => (
                    <div key={lIdx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Label (e.g. YouTube Recap)"
                        value={link.label}
                        onChange={(e) => {
                          const updated = [...eventForm.external_links];
                          updated[lIdx].label = e.target.value;
                          setEventForm(prev => ({ ...prev, external_links: updated }));
                        }}
                        className="w-1/3 text-xs px-3 py-1.5 rounded-lg border border-slate-200"
                      />
                      <input
                        type="url"
                        placeholder="URL (https://...)"
                        value={link.url}
                        onChange={(e) => {
                          const updated = [...eventForm.external_links];
                          updated[lIdx].url = e.target.value;
                          setEventForm(prev => ({ ...prev, external_links: updated }));
                        }}
                        className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = eventForm.external_links.filter((_, i) => i !== lIdx);
                          setEventForm(prev => ({ ...prev, external_links: updated }));
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowEventModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer shadow-sm"
                  >
                    {actionLoading ? 'Saving...' : 'Save Event'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================================================
  // RENDER: LEVEL 1 - ALBUMS / FOLDERS LIST
  // ==========================================================================
  return (
    <div className="space-y-6">
      {/* Feedback Message */}
      {feedback && (
        <div className={`p-3 rounded-xl text-xs font-bold ${
          feedback.type === 'success' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-red-100 text-red-900 border border-red-300'
        }`}>
          {feedback.text}
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Event Gallery Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Organize campaign initiatives into folders, manage sticky card events, and tag team members in photos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/events"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>Public Gallery</span>
          </Link>

          <button
            onClick={openNewFolderModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-all shadow-sm cursor-pointer hover:scale-102"
          >
            <Plus className="w-4 h-4" />
            <span>New Album Folder</span>
          </button>
        </div>
      </div>

      {/* Folders List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 font-semibold animate-pulse">
          Loading gallery albums...
        </div>
      ) : folders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <Folder className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No album folders created yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Create an album folder (e.g. &quot;Faculty Workshops&quot;) to start documenting event photographs.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
            >
              <div>
                {/* Thumbnail */}
                <div className="relative h-44 w-full bg-slate-100">
                  <Image
                    src={folder.thumbnail_url}
                    alt={folder.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-1">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      folder.is_archived
                        ? 'bg-amber-800/90 text-white'
                        : folder.is_published
                          ? 'bg-emerald-800/90 text-white'
                          : 'bg-slate-700/90 text-white'
                    }`}>
                      {folder.is_archived ? 'Archived' : folder.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-2">
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">
                    {folder.title}
                  </h3>
                  {folder.description && (
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {folder.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="p-5 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between gap-2 pt-3">
                <button
                  onClick={() => loadEventsForFolder(folder)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition-colors cursor-pointer"
                >
                  <Folder className="w-3.5 h-3.5" />
                  <span>Manage Events</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditFolderModal(folder)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                    title="Edit album"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleArchiveFolder(folder.id, folder.is_archived)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      folder.is_archived
                        ? 'hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800'
                        : 'hover:bg-red-50 text-slate-400 hover:text-red-600'
                    }`}
                    title={folder.is_archived ? 'Restore album' : 'Archive album'}
                  >
                    {folder.is_archived ? <RefreshCw className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">
                {folderForm.id ? 'Edit Album Folder' : 'Create New Album Folder'}
              </h3>
              <button
                onClick={() => setShowFolderModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Album Title *
                </label>
                <input
                  type="text"
                  required
                  value={folderForm.title}
                  onChange={(e) => setFolderForm(prev => ({ 
                    ...prev, 
                    title: e.target.value,
                    slug: prev.id ? prev.slug : generateSlug(e.target.value)
                  }))}
                  placeholder="e.g. Faculty Workshops Series"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  URL Slug *
                </label>
                <input
                  type="text"
                  required
                  value={folderForm.slug}
                  onChange={(e) => setFolderForm(prev => ({ ...prev, slug: generateSlug(e.target.value) }))}
                  placeholder="e.g. faculty-workshops"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Overview Description
                </label>
                <textarea
                  rows={3}
                  value={folderForm.description}
                  onChange={(e) => setFolderForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief summary of what this album contains..."
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* Cover Thumbnail Upload */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Folder Cover Thumbnail *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    required
                    value={folderForm.thumbnail_url}
                    onChange={(e) => setFolderForm(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                    placeholder="https://... or upload below"
                    className="flex-1 text-xs px-3.5 py-2 rounded-xl border border-slate-200"
                  />
                  <label className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer shrink-0">
                    <Upload className="w-3.5 h-3.5 inline mr-1" />
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFolderThumbnailUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-700">Publish Immediately</span>
                <input
                  type="checkbox"
                  checked={folderForm.is_published}
                  onChange={(e) => setFolderForm(prev => ({ ...prev, is_published: e.target.checked }))}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFolderModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer shadow-sm"
                >
                  {actionLoading ? 'Saving...' : 'Save Album'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
