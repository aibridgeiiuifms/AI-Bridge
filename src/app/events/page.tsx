import { Calendar, MapPin, Tag, Users, Sparkles } from 'lucide-react';

export default function EventsGalleryPage() {
  const events = [
    {
      title: 'The AI Bridge: Launch & Campus Awareness Drive',
      date: 'October 05, 2026',
      location: 'Central Library & Faculty of Management Sciences, IIUI',
      team: 'Awareness Campaign',
      sdgs: ['SDG 4: Quality Education', 'SDG 10: Reduced Inequalities'],
      description:
        'Official initiation of The AI Bridge under the Hum Hain Pakistan SDG Youth Campaign. Distributing awareness flyers, introducing NotebookLM capabilities, and launching the baseline pre-assessment survey.',
    },
    {
      title: 'Faculty Hands-On Workshop: NotebookLM for Non-IT Educators',
      date: 'October 08, 2026',
      location: 'FMS Executive Seminar Hall, IIUI',
      team: 'Workshops & Trainings',
      sdgs: ['SDG 4: Quality Education', 'SDG 8: Decent Work', 'SDG 17: Partnerships'],
      description:
        'Intensive practical training session for faculty members from Sharia & Law, Usuluddin, and Social Sciences. Demonstrating source grounding, Audio Overviews, and automated study guide generation.',
    },
    {
      title: 'Institutional SDG Walk & National Gala Demonstration Stall',
      date: 'Upcoming (November 2026)',
      location: 'IIUI Main Boulevard & National SDG Gala Venue',
      team: 'All Teams Coordination',
      sdgs: ['SDG 4: Quality Education', 'SDG 8: Decent Work', 'SDG 10: Reduced Inequalities', 'SDG 17: Partnerships'],
      description:
        'Showcasing The AI Bridge digital platform, live QR verification of student certificates, and final analytical impact report to university leadership and national campaign evaluators.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
          Campaign Evidence & Activities
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Events & Institutional Documentation
        </h1>
        <p className="text-sm text-slate-500">
          Photographic and operational evidence from workshops, awareness sessions, and SDG campaigns at IIUI Islamabad.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {events.map((evt, idx) => (
          <div
            key={idx}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
          >
            <div className="p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 font-bold">
                  {evt.team}
                </span>
                <span className="text-slate-400 font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {evt.date}
                </span>
              </div>

              <h2 className="text-lg font-bold text-slate-900 leading-snug">{evt.title}</h2>

              <p className="text-xs text-slate-600 leading-relaxed">{evt.description}</p>

              <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{evt.location}</span>
              </div>
            </div>

            <div className="p-6 pt-0 border-t border-slate-100 mt-4">
              <div className="flex flex-wrap gap-1.5 pt-3">
                {evt.sdgs.map((sdg, sIdx) => (
                  <span
                    key={sIdx}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600"
                  >
                    {sdg}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
