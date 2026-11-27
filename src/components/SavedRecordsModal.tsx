import React, { useState, useRef } from 'react';
import { InpatientRecord } from '../types';
import { FolderOpen, X, Trash2, Download, Upload, Clock, User, Calendar, Bed, ArrowRight, RotateCcw, Plus, AlertTriangle, ShieldCheck } from 'lucide-react';

interface SavedRecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedRecords: InpatientRecord[];
  currentPatientIdNumber?: string;
  onLoadRecord: (record: InpatientRecord) => void;
  onDeleteRecord: (id: string) => void;
  onImportRecords: (records: InpatientRecord[]) => void;
  onResetPresets: () => void;
  onNewPatient: () => void;
}

export const SavedRecordsModal: React.FC<SavedRecordsModalProps> = ({
  isOpen,
  onClose,
  savedRecords,
  currentPatientIdNumber,
  onLoadRecord,
  onDeleteRecord,
  onImportRecords,
  onResetPresets,
  onNewPatient,
}) => {
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const filtered = savedRecords.filter((rec) => {
    const term = search.toLowerCase();
    const wardStr = (rec.patient.wardNumber || '').toLowerCase();
    const bedStr = (rec.patient.bedNumber || '').toLowerCase();
    const wardBedStr = (rec.patient.wardAndBedNumber || '').toLowerCase();
    const allergyStr = (rec.patient.allergies || '').toLowerCase();

    return (
      rec.patient.fullName.toLowerCase().includes(term) ||
      rec.patient.idNumber.toLowerCase().includes(term) ||
      wardStr.includes(term) ||
      bedStr.includes(term) ||
      wardBedStr.includes(term) ||
      allergyStr.includes(term) ||
      rec.carePlan1.diagnosis.toLowerCase().includes(term) ||
      rec.carePlan2.diagnosis.toLowerCase().includes(term)
    );
  });

  const handleExportAll = () => {
    const dataStr = JSON.stringify(savedRecords, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nursing_care_plans_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportRecords(parsed);
        } else if (parsed && parsed.patient && parsed.carePlan1) {
          onImportRecords([parsed]);
        }
      } catch (err) {
        console.error('Failed to parse JSON file', err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div
      id="saved-records-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="saved-records-modal-container"
        className="relative w-full max-w-3xl max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-indigo-200/80 flex flex-col overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-800 via-blue-700 to-teal-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 text-amber-300 flex items-center justify-center shadow-xs">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white">
                  Saved Inpatient Care Plans
                </h2>
                <span className="text-xs font-bold text-cyan-200 tabular-nums">
                  · {savedRecords.length} Records
                </span>
              </div>
              <p className="text-xs text-sky-100/85">
                Switch between inpatient profiles or backup/restore records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onNewPatient();
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white font-bold text-xs border border-white/25 transition-all flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-300" />
              <span>New Inpatient</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="p-4 border-b border-indigo-100 bg-gradient-to-r from-sky-50/70 via-white to-teal-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1 min-w-[220px]">
            <input
              type="text"
              placeholder="Search by patient name, MRN, ward, or diagnosis..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportAll}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-sky-50 text-sky-800 font-bold text-xs border border-sky-200 transition-all flex items-center gap-1.5 shadow-xs whitespace-nowrap"
              title="Export all saved care plans as JSON"
            >
              <Download className="w-3.5 h-3.5 text-sky-600" />
              <span>Export JSON</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-teal-50 text-teal-800 font-bold text-xs border border-teal-200 transition-all flex items-center gap-1.5 shadow-xs whitespace-nowrap"
              title="Import JSON care plans backup"
            >
              <Upload className="w-3.5 h-3.5 text-teal-600" />
              <span>Import JSON</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={onResetPresets}
              className="px-3 py-1.5 rounded-lg text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 text-xs font-semibold transition-all whitespace-nowrap"
              title="Restore standard clinical sample presets"
            >
              Reset Samples
            </button>
          </div>
        </div>

        {/* Record List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-slate-50/80 to-sky-50/40">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <FolderOpen className="w-10 h-10 mx-auto text-indigo-300 mb-2" />
              <p className="font-bold text-sm text-slate-700">No saved care plan records match your search</p>
              <p className="text-xs text-slate-500 mt-1">Try another search keyword or create a new inpatient</p>
            </div>
          ) : (
            filtered.map((record) => {
              const isCurrent = record.patient.idNumber === currentPatientIdNumber;
              return (
                <div
                  key={record.id}
                  className={`p-4 rounded-xl border transition-all flex flex-wrap items-center justify-between gap-3 ${
                    isCurrent
                      ? 'bg-gradient-to-r from-sky-50 via-indigo-50/70 to-teal-50/60 border-indigo-300 shadow-xs ring-1 ring-indigo-300/60'
                      : 'bg-white border-slate-200/90 hover:border-sky-300 hover:shadow-xs'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-slate-900">
                        {record.patient.fullName || 'Unnamed Inpatient'}
                      </span>
                      {record.patient.idNumber && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="font-mono tabular-nums text-xs text-indigo-700 font-bold">
                            {record.patient.idNumber}
                          </span>
                        </>
                      )}
                      {(record.patient.wardNumber || record.patient.bedNumber || record.patient.wardAndBedNumber) && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="text-xs text-teal-700 font-bold">
                            {record.patient.wardNumber && record.patient.bedNumber
                              ? `${record.patient.wardNumber}, Bed ${record.patient.bedNumber}`
                              : record.patient.wardNumber || (record.patient.bedNumber ? `Bed ${record.patient.bedNumber}` : record.patient.wardAndBedNumber)}
                          </span>
                        </>
                      )}
                      {isCurrent && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="text-xs font-extrabold text-blue-700">
                            Active in Workspace
                          </span>
                        </>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 tabular-nums">
                      <span>Admitted: {record.patient.dateOfAdmission || '—'}</span>
                      <span className="text-slate-300">·</span>
                      <span>DR: {record.patient.caringDoctor || '—'}</span>
                      <span className="text-slate-300">·</span>
                      <span>Age: {record.patient.age || '—'} / {record.patient.sex}</span>
                      {record.patient.allergies && (
                        <>
                          <span className="text-slate-300">·</span>
                          {record.patient.allergies.toLowerCase().includes('nkda') || record.patient.allergies.toLowerCase().includes('no known') ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" /> NKDA
                            </span>
                          ) : record.patient.allergies.toLowerCase().includes('unknown') ? (
                            <span className="text-amber-700 font-bold flex items-center gap-1" title={record.patient.allergies}>
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              {record.patient.allergies}
                            </span>
                          ) : (
                            <span className="text-rose-700 font-bold flex items-center gap-1" title={record.patient.allergies}>
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              Allergies: {record.patient.allergies.length > 20 ? `${record.patient.allergies.slice(0, 20)}...` : record.patient.allergies}
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Care Plans Snapshot */}
                    {(record.carePlan1.diagnosis || record.carePlan2.diagnosis) && (
                      <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs">
                        {record.carePlan1.diagnosis && (
                          <span className="text-sky-800 font-semibold">
                            #1: {record.carePlan1.diagnosis}
                          </span>
                        )}
                        {record.carePlan1.diagnosis && record.carePlan2.diagnosis && (
                          <span className="text-slate-300">/</span>
                        )}
                        {record.carePlan2.diagnosis && (
                          <span className="text-violet-800 font-semibold">
                            #2: {record.carePlan2.diagnosis}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onLoadRecord(record);
                        onClose();
                      }}
                      className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <span>Load Plan</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteRecord(record.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete saved record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-indigo-100 bg-white flex items-center justify-between text-xs text-slate-500">
          <span>All patient drafts are stored locally in your browser session.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-indigo-700 hover:bg-indigo-50 font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
