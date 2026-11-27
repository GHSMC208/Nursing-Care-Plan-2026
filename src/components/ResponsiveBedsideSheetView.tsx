import React, { useState, useRef, useEffect } from 'react';
import { PatientDemographics } from '../types';
import {
  PrintableBedsideCardSheet,
  IdTagCard,
  BedsidePatientNameContent,
  BedsideDoctorContent,
  FileAttachedCardContent,
  formatShortDate,
  formatWardBed,
  getDoctorDisplay,
  formatIdTagAllergy,
} from './PrintableBedsideCardSheet';
import { Maximize2, ZoomIn, ZoomOut, RotateCcw, Tag, Layers, FileText, User, Stethoscope, Scissors } from 'lucide-react';

interface ResponsiveBedsideSheetViewProps {
  patient: PatientDemographics;
  showDimensionBadges?: boolean;
  onToggleDimensions?: () => void;
}

type CardFocusMode = 'full_sheet' | 'file_cards' | 'name_card' | 'doctor_cards' | 'id_tags';

export const ResponsiveBedsideSheetView: React.FC<ResponsiveBedsideSheetViewProps> = ({
  patient,
  showDimensionBadges = true,
  onToggleDimensions,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1);
  const [userZoom, setUserZoom] = useState<number>(1);
  const [focusMode, setFocusMode] = useState<CardFocusMode>('full_sheet');

  // Measure container and compute auto-fit scale so the 297mm width fits 100% inside container
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        // 297mm at 96dpi is approx 1122.5px. Add 16px safety margin = 1138px
        const targetWidthPx = 1130;
        const computedScale = Math.min(1, Math.max(0.28, (containerWidth - 24) / targetWidthPx));
        setScale(computedScale);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const shortDate = formatShortDate(patient.dateOfAdmission);
  const wardBed = formatWardBed(patient);
  const doctor = getDoctorDisplay(patient.caringDoctor);
  const patientName = patient.fullName || 'Patient Name';
  const cprNumber = patient.idNumber || '—';
  const ageDisplay = patient.age ? `${patient.age} YRS` : '— YRS';
  const sexCode = patient.sex ? (patient.sex.toUpperCase().startsWith('M') ? 'M' : 'F') : '—';
  const nationalityDisplay = (patient.nationality || 'BAHRAINI').toUpperCase();
  const idTagAllergyDisplay = formatIdTagAllergy(patient.allergies);

  const effectiveScale = scale * userZoom;

  return (
    <div className="w-full flex flex-col items-center space-y-4">
      {/* View & Focus Mode Bar */}
      <div className="w-full bg-gradient-to-r from-indigo-950 via-blue-950 to-teal-950 text-white rounded-2xl p-3.5 shadow-md flex flex-wrap items-center justify-between gap-3 border border-indigo-400/20">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-cyan-200 mr-1 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-300" />
            <span>Card View:</span>
          </span>

          <button
            type="button"
            onClick={() => setFocusMode('full_sheet')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              focusMode === 'full_sheet'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-xs'
                : 'bg-white/10 text-sky-100 hover:bg-white/20'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Full A4 Sheet (All 6 Cards)</span>
          </button>

          <button
            type="button"
            onClick={() => setFocusMode('file_cards')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              focusMode === 'file_cards'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs'
                : 'bg-white/10 text-emerald-200 hover:bg-white/20'
            }`}
            title="Inspect File Attached Cards #1 & #2 (9×7 cm)"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>File Attached Cards (9×7 cm)</span>
          </button>

          <button
            type="button"
            onClick={() => setFocusMode('name_card')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              focusMode === 'name_card'
                ? 'bg-gradient-to-r from-sky-500 to-cyan-600 text-white shadow-xs'
                : 'bg-white/10 text-sky-200 hover:bg-white/20'
            }`}
            title="Inspect Patient Bedside Name Card (9×7 cm)"
          >
            <User className="w-3.5 h-3.5" />
            <span>Bedside Name Card</span>
          </button>

          <button
            type="button"
            onClick={() => setFocusMode('doctor_cards')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              focusMode === 'doctor_cards'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs'
                : 'bg-white/10 text-amber-200 hover:bg-white/20'
            }`}
            title="Inspect Doctor Door Signs (9×7 cm)"
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Doctor Signs</span>
          </button>

          <button
            type="button"
            onClick={() => setFocusMode('id_tags')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              focusMode === 'id_tags'
                ? 'bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white shadow-xs'
                : 'bg-white/10 text-violet-200 hover:bg-white/20'
            }`}
            title="Inspect Vertical ID Tags (1.8×6.7 cm)"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>ID Tags</span>
          </button>
        </div>

        {/* Zoom Controls & Dimension Badges Toggle */}
        <div className="flex items-center gap-2">
          {onToggleDimensions && (
            <button
              type="button"
              onClick={onToggleDimensions}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 whitespace-nowrap ${
                showDimensionBadges
                  ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/50'
                  : 'bg-white/10 text-slate-300 border-white/15 hover:text-white'
              }`}
              title="Toggle 9x7cm and 1.8x6.7cm dimension markers"
            >
              <Tag className="w-3.5 h-3.5" />
              <span className="tabular-nums">{showDimensionBadges ? 'Sizes: 9×7, 1.8×6.7' : 'Sizes: Off'}</span>
            </button>
          )}

          {focusMode === 'full_sheet' && (
            <div className="flex items-center bg-slate-950/60 rounded-lg border border-white/15 p-1 text-xs">
              <button
                type="button"
                onClick={() => setUserZoom((z) => Math.max(0.6, z - 0.1))}
                className="p-1 rounded text-sky-200 hover:text-white transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 text-white font-mono tabular-nums text-[11px] min-w-[40px] text-center">
                {Math.round(effectiveScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setUserZoom((z) => Math.min(1.5, z + 0.1))}
                className="p-1 rounded text-sky-200 hover:text-white transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setUserZoom(1)}
                className="p-1 text-[10px] text-sky-200 hover:text-white transition-colors border-l border-white/15 ml-1"
                title="Reset to Fit Width"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* FOCUS VIEW 1: FULL A4 SHEET (Responsive Auto-Fitting Frame) */}
      {focusMode === 'full_sheet' && (
        <div
          ref={containerRef}
          className="w-full bg-gradient-to-br from-sky-100/70 via-indigo-50/70 to-teal-100/60 rounded-2xl p-3 sm:p-6 border border-indigo-200/80 shadow-inner flex flex-col items-center overflow-x-auto"
        >
          <div
            className="transition-transform origin-top flex flex-col items-center"
            style={{
              width: '297mm',
              transform: `scale(${effectiveScale})`,
              transformOrigin: 'top center',
              marginBottom: `${(effectiveScale - 1) * 210}mm`,
            }}
          >
            <PrintableBedsideCardSheet
              patient={patient}
              showDimensionBadges={showDimensionBadges}
            />
          </div>
        </div>
      )}

      {/* FOCUS VIEW 2: DEDICATED FILE ATTACHED CARDS INSPECTION (High-Res 9×7 cm Focus) */}
      {focusMode === 'file_cards' && (
        <div className="w-full bg-gradient-to-br from-slate-900 via-teal-950 to-indigo-950 text-white rounded-2xl p-5 border border-teal-400/25 shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-emerald-300 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <span>File Attached Cards (Exact Size: 9 × 7 cm)</span>
              </h3>
              <p className="text-xs text-teal-100/75 mt-0.5">
                Contains all 9 inpatient clinical registration fields: Date of admission, Ward No, Bed No, Patient Name, ID (CPR), Age, Sex, Caring Dr, and Allergy.
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums font-bold text-emerald-300">
              Physical Card: 90 × 70 mm
            </span>
          </div>

          {/* Cards Display Grid (Both File Attached Cards side-by-side or stacked) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-items-center">
            {/* Card 1 (Top-Right position on A4 Sheet) */}
            <div className="flex flex-col items-center space-y-2">
              <span className="text-xs font-bold text-teal-100">
                1. File Attached Card #1 (Top-Right on A4 Sheet)
              </span>
              <div
                className="border-[3px] border-[#002878] bg-white text-black p-2.5 flex flex-col justify-between overflow-hidden rounded-xs shadow-2xl font-sans"
                style={{
                  width: '90mm',
                  height: '70mm',
                  minWidth: '90mm',
                  maxWidth: '90mm',
                  minHeight: '70mm',
                  maxHeight: '70mm',
                  boxSizing: 'border-box',
                }}
              >
                <FileAttachedCardContent patient={patient} />
              </div>
            </div>

            {/* Card 2 (Bottom-Right position on A4 Sheet) */}
            <div className="flex flex-col items-center space-y-2">
              <span className="text-xs font-bold text-teal-100">
                2. File Attached Card #2 (Bottom-Right on A4 Sheet)
              </span>
              <div
                className="border-[3px] border-[#002878] bg-white text-black p-2.5 flex flex-col justify-between overflow-hidden rounded-xs shadow-2xl font-sans"
                style={{
                  width: '90mm',
                  height: '70mm',
                  minWidth: '90mm',
                  maxWidth: '90mm',
                  minHeight: '70mm',
                  maxHeight: '70mm',
                  boxSizing: 'border-box',
                }}
              >
                <FileAttachedCardContent patient={patient} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOCUS VIEW 3: PATIENT BEDSIDE NAME CARD (9×7 cm) */}
      {focusMode === 'name_card' && (
        <div className="w-full bg-gradient-to-br from-slate-900 via-sky-950 to-indigo-950 text-white rounded-2xl p-5 border border-sky-400/25 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <h3 className="text-base font-extrabold text-sky-300 flex items-center gap-2">
              <User className="w-5 h-5 text-sky-400" />
              <span>Bedside Patient Name Card (Exact Size: 9 × 7 cm)</span>
            </h3>
            <span className="text-xs font-mono tabular-nums font-bold text-sky-300">
              Physical Card: 90 × 70 mm
            </span>
          </div>

          <div className="flex justify-center py-4">
            <div
              className="border-[3px] border-[#002878] bg-white text-black p-2.5 flex flex-col justify-center items-center overflow-hidden rounded-xs shadow-2xl"
              style={{
                width: '90mm',
                height: '70mm',
                minWidth: '90mm',
                maxWidth: '90mm',
                minHeight: '70mm',
                maxHeight: '70mm',
                boxSizing: 'border-box',
              }}
            >
              <BedsidePatientNameContent fullName={patient.fullName} />
            </div>
          </div>
        </div>
      )}

      {/* FOCUS VIEW 4: DOCTOR SIGNS (9×7 cm) */}
      {focusMode === 'doctor_cards' && (
        <div className="w-full bg-gradient-to-br from-slate-900 via-indigo-950 to-amber-950/80 text-white rounded-2xl p-5 border border-amber-400/25 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <h3 className="text-base font-extrabold text-amber-300 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-amber-400" />
              <span>Doctor Door & Bedside Cards (Exact Size: 9 × 7 cm)</span>
            </h3>
            <span className="text-xs font-mono tabular-nums font-bold text-amber-300">
              Physical Card: 90 × 70 mm
            </span>
          </div>

          <div className="flex justify-center py-4">
            <div
              className="border-[3px] border-[#002878] bg-white text-black p-2.5 flex flex-col justify-center items-center overflow-hidden rounded-xs shadow-2xl"
              style={{
                width: '90mm',
                height: '70mm',
                minWidth: '90mm',
                maxWidth: '90mm',
                minHeight: '70mm',
                maxHeight: '70mm',
                boxSizing: 'border-box',
              }}
            >
              <BedsideDoctorContent doctor={patient.caringDoctor} />
            </div>
          </div>
        </div>
      )}

      {/* FOCUS VIEW 5: VERTICAL ID TAGS (1.8×6.7 cm) */}
      {focusMode === 'id_tags' && (
        <div className="w-full bg-gradient-to-br from-slate-900 via-violet-950 to-indigo-950 text-white rounded-2xl p-5 border border-violet-400/25 shadow-xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-violet-300 flex items-center gap-2">
                <Scissors className="w-5 h-5 text-violet-400" />
                <span>ID Tags for Specimen Tubes & Wristbands (1.8 × 6.7 cm)</span>
              </h3>
              <p className="text-xs text-violet-100/75 mt-0.5">
                All 9 identification fields formatted into 4 structured rows, precision-fitted to the 18mm × 67mm physical tag size.
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums font-bold text-violet-300">
              Physical Tags: 18 × 67 mm
            </span>
          </div>

          {/* Display Grid: Actual Size & Enlarged Reading View */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Left: Physical Size Tags (1:1) */}
            <div className="flex flex-col items-center bg-slate-950/75 p-5 rounded-xl border border-violet-400/20 space-y-3">
              <span className="text-xs font-bold text-violet-100">
                1:1 Scale Print Output (Two 18 × 67 mm Tags)
              </span>
              <div className="flex justify-center items-center gap-8 py-2">
                <div className="flex flex-col items-center gap-1.5">
                  <IdTagCard patient={patient} id="preview-id-tag-1" />
                  <span className="text-[11px] font-mono text-violet-200/80">Tag #1</span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <IdTagCard patient={patient} id="preview-id-tag-2" emptyBedNumber={true} />
                  <span className="text-[11px] font-mono text-violet-200/80">Tag #2 (Empty Bed No.)</span>
                </div>
              </div>
            </div>

            {/* Right: Enlarged Horizontal Layout Inspection (67mm × 18mm at 2×) */}
            <div className="flex flex-col items-center bg-slate-950/75 p-5 rounded-xl border border-violet-400/20 space-y-3">
              <span className="text-xs font-bold text-violet-100">
                Rotated Content Inspection (2× Scale)
              </span>
              <div className="py-2 flex flex-col items-center">
                {/* Horizontal representation for easy reading */}
                <div
                  className="border-[2px] border-[#002878] bg-white text-black p-2.5 rounded-xs shadow-xl flex flex-col justify-between font-sans"
                  style={{
                    width: '134mm',
                    height: '36mm',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  {/* Row 1: Header */}
                  <div className="flex items-center justify-between text-[14px] font-black text-black border-b border-slate-300 pb-0.5 leading-none">
                    <span className="font-mono">{shortDate}</span>
                    <span className="font-bold text-[#002878] uppercase">{wardBed}</span>
                  </div>

                  {/* Row 2: Patient Name */}
                  <div className="text-[18px] font-black tracking-tight leading-none text-black uppercase truncate">
                    {patientName}
                  </div>

                  {/* Row 3: Demographics */}
                  <div className="flex items-center justify-between text-[13.5px] font-bold text-black tracking-tight leading-none">
                    <span>
                      CPR: <strong className="font-black">{cprNumber}</strong>
                    </span>
                    <span>
                      {ageDisplay} <strong className="font-black">({sexCode})</strong>
                    </span>
                    <span className="tracking-wide text-slate-800 uppercase font-black">
                      {nationalityDisplay}
                    </span>
                  </div>

                  {/* Row 4: Doctor & Allergy */}
                  <div className="flex items-center justify-between gap-2 text-[13.5px] font-bold text-black tracking-tight leading-none">
                    <span className="truncate">
                      C/O <strong className="font-black text-[#002878]">{doctor.full}</strong>
                    </span>
                    <span className="font-black text-red-700 uppercase shrink-0">
                      ALLERGY: {idTagAllergyDisplay}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 text-center">
                The 4 structured rows are rotated 90° onto the vertical 18×67mm strip to fit specimen tubes and wristbands.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
