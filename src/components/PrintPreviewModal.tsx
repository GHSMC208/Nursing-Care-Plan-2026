import React, { useState } from 'react';
import { PatientDemographics, NursingCarePlan } from '../types';
import { PrintableCarePlan } from './PrintableCarePlan';
import { PrintableBedsideCardSheet } from './PrintableBedsideCardSheet';
import {
  Printer,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  CheckCircle2,
  Tag,
  Layers,
  Sparkles,
} from 'lucide-react';

export type PrintDocumentType = 'careplans' | 'bedside' | 'both_types';
export type PrintCarePlanScope = 'all' | number;

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientDemographics;
  carePlans: NursingCarePlan[];
  printScope: PrintCarePlanScope;
  onPrintScopeChange: (scope: PrintCarePlanScope) => void;
  activeDocType?: PrintDocumentType;
  onDocTypeChange?: (docType: PrintDocumentType) => void;
}

const PLAN_PREVIEW_ACCENTS = [
  { btn: 'bg-sky-500/40 text-white', label: 'text-sky-300', sub: 'text-sky-200/80', border: 'border-sky-400/30' },
  { btn: 'bg-violet-500/40 text-white', label: 'text-violet-300', sub: 'text-violet-200/80', border: 'border-violet-400/30' },
  { btn: 'bg-emerald-500/40 text-white', label: 'text-emerald-300', sub: 'text-emerald-200/80', border: 'border-emerald-400/30' },
  { btn: 'bg-amber-500/40 text-white', label: 'text-amber-300', sub: 'text-amber-200/80', border: 'border-amber-400/30' },
  { btn: 'bg-rose-500/40 text-white', label: 'text-rose-300', sub: 'text-rose-200/80', border: 'border-rose-400/30' },
];

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  patient,
  carePlans,
  printScope,
  onPrintScopeChange,
  activeDocType = 'bedside',
  onDocTypeChange,
}) => {
  const [docType, setDocType] = useState<PrintDocumentType>(activeDocType);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showDimensions, setShowDimensions] = useState<boolean>(true);

  if (!isOpen) return null;

  const currentDocType = onDocTypeChange ? activeDocType : docType;
  const handleSelectDocType = (type: PrintDocumentType) => {
    setDocType(type);
    if (onDocTypeChange) {
      onDocTypeChange(type);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedPlans =
    printScope === 'all'
      ? carePlans.map((plan, idx) => ({ plan, planNumber: idx + 1 }))
      : carePlans
          .map((plan, idx) => ({ plan, planNumber: idx + 1 }))
          .filter((item) => item.planNumber === printScope);

  const totalPlanPages = selectedPlans.length;

  return (
    <div
      id="print-preview-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-indigo-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="print-preview-modal-container"
        className="relative w-full max-w-6xl max-h-[96vh] bg-slate-950 rounded-2xl shadow-2xl border border-indigo-400/25 flex flex-col overflow-hidden text-slate-100 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-indigo-950 via-blue-950 to-teal-950 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400 text-slate-950 flex items-center justify-center font-bold shadow-sm">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                A4 Print Preview & Export
              </h2>
              <p className="text-xs text-sky-200/80">
                {currentDocType === 'bedside'
                  ? 'Bedside & Door Label Sheet (A4 Landscape — Exact Hospital Template)'
                  : currentDocType === 'careplans'
                  ? 'Inpatient Nursing Care Plans (A4 Portrait — Clinical Formatted)'
                  : 'Complete Inpatient Bundle (Care Plans + Bedside Label Sheet)'}
              </p>
            </div>
          </div>

          {/* Document Type Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-slate-950/60 p-1 rounded-xl border border-white/15 flex items-center text-xs gap-1">
              <button
                type="button"
                onClick={() => handleSelectDocType('bedside')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  currentDocType === 'bedside'
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-xs'
                    : 'text-sky-100/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Bedside & Door Labels (A4)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectDocType('careplans')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  currentDocType === 'careplans'
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-xs'
                    : 'text-sky-100/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Care Plans ({carePlans.length})</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectDocType('both_types')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  currentDocType === 'both_types'
                    ? 'bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white shadow-xs'
                    : 'text-sky-100/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>All Documents</span>
              </button>
            </div>

            {/* Scope Selection (When Care Plans are visible) */}
            {(currentDocType === 'careplans' || currentDocType === 'both_types') && (
              <div className="bg-slate-950/60 p-1 rounded-xl border border-white/15 flex flex-wrap items-center text-xs gap-0.5">
                <button
                  type="button"
                  onClick={() => onPrintScopeChange('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                    printScope === 'all'
                      ? 'bg-white/20 text-white shadow-xs'
                      : 'text-sky-200/75 hover:text-white'
                  }`}
                >
                  All Plans ({carePlans.length})
                </button>
                {carePlans.map((plan, idx) => {
                  const planNum = idx + 1;
                  const accent = PLAN_PREVIEW_ACCENTS[idx % PLAN_PREVIEW_ACCENTS.length];
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => onPrintScopeChange(planNum)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                        printScope === planNum
                          ? `${accent.btn} shadow-xs`
                          : 'text-sky-200/75 hover:text-white'
                      }`}
                    >
                      Plan {planNum}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Zoom Controls & Dimension Guide Toggle */}
            <div className="hidden md:flex items-center bg-slate-950/60 rounded-xl border border-white/15 p-1 text-xs gap-1">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                className="p-1.5 rounded text-sky-200 hover:text-white transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 text-white font-mono tabular-nums text-[11px] min-w-[42px] text-center">
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
                className="p-1.5 rounded text-sky-200 hover:text-white transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(100)}
                className="px-2 py-1 rounded text-[10px] text-sky-200 hover:text-white transition-colors font-semibold border-l border-white/15"
                title="Reset to 100%"
              >
                100%
              </button>

              {currentDocType === 'bedside' && (
                <button
                  type="button"
                  onClick={() => setShowDimensions(!showDimensions)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all border-l border-white/15 ml-1 flex items-center gap-1 whitespace-nowrap ${
                    showDimensions ? 'bg-emerald-500/25 text-emerald-200' : 'text-sky-200/70 hover:text-white'
                  }`}
                  title="Toggle 9x7cm and 1.8x6.7cm dimension rulers on screen"
                >
                  <Tag className="w-3 h-3" />
                  <span className="tabular-nums">{showDimensions ? 'Sizes On (9×7, 1.8×6.7)' : 'Sizes Off'}</span>
                </button>
              )}
            </div>

            <button
              id="confirm-print-btn"
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-extrabold text-xs rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-sky-200 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Print Instruction Subbar */}
        <div className="bg-indigo-950/90 px-6 py-2.5 border-b border-white/10 text-xs text-sky-100/90 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Print Setting Tip:</strong> Paper size <span className="text-cyan-300 font-bold">A4</span> ·{' '}
              {currentDocType === 'bedside' ? (
                <>
                  Orientation: <span className="text-emerald-300 font-bold">Landscape</span> ·{' '}
                </>
              ) : (
                <>
                  Orientation: <span className="text-sky-300 font-bold">Portrait</span> ·{' '}
                </>
              )}
              Enable <span className="text-amber-300 font-bold">"Background Graphics"</span> in browser print dialog.
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-sky-200/75 font-mono tabular-nums">
            <span>A4 Size: 297mm × 210mm</span>
            <span>·</span>
            <span className="text-cyan-300 font-bold">
              {currentDocType === 'bedside'
                ? '1 Page (Bedside & Door Sheet)'
                : currentDocType === 'careplans'
                ? `${totalPlanPages} ${totalPlanPages === 1 ? 'Page' : 'Pages'} Total`
                : `${totalPlanPages + 1} Pages Total (${totalPlanPages} Care ${totalPlanPages === 1 ? 'Plan' : 'Plans'} + Bedside Sheet)`}
            </span>
          </div>
        </div>

        {/* Paper Canvas Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gradient-to-b from-slate-950 via-indigo-950/75 to-slate-950 space-y-10 flex flex-col items-center">
          <div
            className="w-full flex flex-col items-center space-y-10 transition-transform origin-top duration-150"
            style={{ transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined }}
          >
            {/* 1. Bedside & Door Label Sheet (A4 Landscape Layout) */}
            {(currentDocType === 'bedside' || currentDocType === 'both_types') && (
              <div className="w-full flex flex-col items-center">
                <div className="w-full max-w-[297mm] text-xs font-bold text-emerald-300 mb-2 flex items-center justify-between px-1">
                  <span>Bedside & File Cards Sheet (A4 Landscape — All 6 Cards)</span>
                  <span className="text-emerald-200/80 font-mono tabular-nums text-[11px]">
                    2 Bedside Cards (9×7) · 2 ID Tags (1.8×6.7) · 2 File Attached Cards (9×7)
                  </span>
                </div>
                <div className="w-full max-w-[297mm] bg-white rounded-xs shadow-2xl overflow-x-auto border border-emerald-400/30">
                  <div className="min-w-[270mm] flex justify-center">
                    <PrintableBedsideCardSheet patient={patient} showDimensionBadges={showDimensions} />
                  </div>
                </div>
              </div>
            )}

            {/* 2. Dynamic Care Plans */}
            {(currentDocType === 'careplans' || currentDocType === 'both_types') &&
              selectedPlans.map(({ plan, planNumber }, idx) => {
                const accent = PLAN_PREVIEW_ACCENTS[(planNumber - 1) % PLAN_PREVIEW_ACCENTS.length];
                return (
                  <div key={plan.id} className="w-full flex flex-col items-center">
                    <div className={`w-full max-w-[210mm] text-xs font-bold mb-2 flex items-center justify-between px-1 ${accent.label}`}>
                      <span>Page {idx + 1}: Nursing Care Plan #{planNumber} (A4 Portrait)</span>
                      <span className={`font-mono text-[11px] ${accent.sub}`}>Upper-Right Inpatient Label Included</span>
                    </div>
                    <div className={`w-full max-w-[210mm] bg-white rounded-xs shadow-2xl overflow-hidden border ${accent.border}`}>
                      <PrintableCarePlan
                        patient={patient}
                        carePlan={plan}
                        planNumber={planNumber}
                        totalPlans={carePlans.length}
                        pageNumber={idx + 1}
                        totalPages={totalPlanPages}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};
