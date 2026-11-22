import React, { useMemo, useRef, useState, useLayoutEffect } from 'react';
import { PatientDemographics } from '../types';
import { Scissors } from 'lucide-react';

interface PrintableBedsideCardSheetProps {
  patient: PatientDemographics;
  isPrintOnly?: boolean;
  showDimensionBadges?: boolean;
}

// Helper to format date as DD/MM/YY (e.g. 18/08/26)
export function formatShortDate(dateStr?: string): string {
  if (!dateStr || !dateStr.trim()) {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = String(today.getFullYear()).slice(-2);
    return `${d}/${m}/${y}`;
  }
  const clean = dateStr.trim();
  if (clean.includes('/')) return clean;

  try {
    const parts = clean.split('-');
    if (parts.length === 3) {
      const year = parts[0].slice(-2);
      const month = parts[1];
      const day = parts[2];
      return `${day}/${month}/${year}`;
    }
  } catch {
    // fallback
  }
  return clean;
}

// Helper to format ward & bed string (e.g. "Ward 12 bed 4")
export function formatWardBed(patient: PatientDemographics): string {
  const ward = (patient.wardNumber || '').trim();
  const bed = (patient.bedNumber || '').trim();

  if (ward && bed) {
    const cleanWard = ward.replace(/^ward\s*/i, '');
    const cleanBed = bed.replace(/^bed\s*/i, '');
    return `Ward ${cleanWard} bed ${cleanBed}`;
  }

  if (patient.wardAndBedNumber?.trim()) {
    const raw = patient.wardAndBedNumber.trim();
    if (raw.toLowerCase().includes('bed')) {
      return raw.replace(/,/g, '');
    }
    return raw;
  }

  if (ward) return `Ward ${ward}`;
  if (bed) return `Bed ${bed}`;
  return 'Ward — bed —';
}

// Helper to extract clean doctor title and name (e.g. "DR." and "Layla")
export function getDoctorDisplay(doctor?: string): { title: string; name: string; full: string } {
  if (!doctor || !doctor.trim()) {
    return { title: 'DR.', name: 'Physician', full: 'Dr. Physician' };
  }
  const clean = doctor
    .replace(/\(.*?\)/g, '')
    .replace(/,.*$/, '')
    .trim();

  const withoutDr = clean.replace(/^dr\.?\s+/i, '').trim();
  return {
    title: 'DR.',
    name: withoutDr || clean,
    full: clean.startsWith('Dr.') ? clean : `Dr. ${clean}`,
  };
}

// Helper to split patient name nicely across lines for 9x7cm display
export function splitPatientName(fullName?: string): { line1: string; line2: string } {
  if (!fullName || !fullName.trim()) {
    return { line1: 'Patient', line2: 'Name' };
  }
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { line1: parts[0], line2: '' };
  }
  if (parts.length === 2) {
    return { line1: parts[0], line2: parts[1] };
  }
  if (parts.length === 3) {
    return { line1: `${parts[0]} ${parts[1]}`, line2: parts[2] };
  }
  // 4 or more words
  const midpoint = Math.ceil(parts.length / 2);
  return {
    line1: parts.slice(0, midpoint).join(' '),
    line2: parts.slice(midpoint).join(' '),
  };
}

// Helper for allergy display
export function formatAllergy(allergy?: string): string {
  if (!allergy || !allergy.trim()) return 'Unknown Drug Allergy';
  const clean = allergy.trim();
  if (/^nkda\s*(\(no\s+known\s+drug\s+allergies\))?$/i.test(clean) || /^no\s+known\s+drug\s+allergies$/i.test(clean)) {
    return 'NKDA';
  }
  return clean.replace(/\(no\s+known\s+drug\s+allergies\)/gi, '').trim();
}

// Dedicated helper for ID tag allergy: strictly outputs NKDA instead of verbose phrases
export function formatIdTagAllergy(allergy?: string): string {
  if (!allergy || !allergy.trim()) return 'Unknown Drug Allergy';
  const clean = allergy.trim();
  if (/no\s+known\s+drug\s+allergies/i.test(clean) || /^nkda/i.test(clean) || /^nka/i.test(clean)) {
    return 'NKDA';
  }
  return clean.replace(/\(no\s+known\s+drug\s+allergies\)/gi, '').trim();
}

export interface IdTagCardProps {
  patient: PatientDemographics;
  id?: string;
  className?: string;
  zoom?: number;
  showBorder?: boolean;
}

// Dedicated ID Tag component scaled and calibrated exactly to 1.8cm × 6.7cm (18mm × 67mm)
export const IdTagCard: React.FC<IdTagCardProps> = ({
  patient,
  id,
  className = '',
  zoom = 1,
  showBorder = true,
}) => {
  const shortDate = formatShortDate(patient.dateOfAdmission);
  const wardBed = formatWardBed(patient);
  const doctor = getDoctorDisplay(patient.caringDoctor);
  const patientName = patient.fullName || 'Patient Name';
  const cprNumber = patient.idNumber || '—';
  const ageDisplay = patient.age ? `${patient.age} YRS` : '— YRS';
  const sexCode = patient.sex ? (patient.sex.toUpperCase().startsWith('M') ? 'M' : 'F') : '—';
  const nationalityDisplay = (patient.nationality || 'BAHRAINI').toUpperCase();
  const allergyDisplay = formatIdTagAllergy(patient.allergies);

  return (
    <div
      id={id}
      className={`bg-white relative flex items-center justify-center box-border select-text overflow-hidden ${
        showBorder ? 'border-[1.5px] border-[#002878] shadow-2xs' : ''
      } ${className}`}
      style={{
        width: '18mm',
        height: '67mm',
        minWidth: '18mm',
        maxWidth: '18mm',
        minHeight: '67mm',
        maxHeight: '67mm',
        boxSizing: 'border-box',
        transform: zoom !== 1 ? `scale(${zoom})` : undefined,
        transformOrigin: 'center center',
      }}
    >
      <div
        className="id-tag-inner flex flex-col justify-between text-black font-sans box-border"
        style={{
          width: '65mm',
          height: '16.5mm',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(-90deg)',
          transformOrigin: 'center center',
          boxSizing: 'border-box',
          lineHeight: 1.1,
          padding: '0.3mm 0.6mm',
        }}
      >
        {/* Row 1: Header - Date of Admission & Ward / Bed Number */}
        <div className="flex items-center justify-between text-[9.5px] font-black tracking-tight text-black border-b border-slate-300 pb-[1px] leading-none">
          <span className="font-mono">{shortDate}</span>
          <span className="font-bold text-[#002878] uppercase">{wardBed}</span>
        </div>

        {/* Row 2: Patient Full Name (Prominent & Clear) */}
        <div className="text-[12px] font-black tracking-tight leading-none text-black uppercase truncate">
          {patientName}
        </div>

        {/* Row 3: CPR Number, Age, Sex, Nationality */}
        <div className="flex items-center justify-between text-[9.2px] font-bold text-black tracking-tight leading-none">
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

        {/* Row 4: Caring Doctor & Allergy Warning */}
        <div
          className={`flex items-center justify-between gap-1 font-bold text-black tracking-tight leading-none ${
            allergyDisplay.length > 14 ? 'text-[8.2px]' : 'text-[9.2px]'
          }`}
        >
          <span className="truncate flex-1 min-w-0">
            C/O <strong className="font-black text-[#002878]">{doctor.full}</strong>
          </span>
          <span className="truncate max-w-[39mm] shrink-0 text-right font-black text-red-700 uppercase">
            ALLERGY: {allergyDisplay}
          </span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Auto-fit Typography Engine for 9 × 7 cm (90 × 70 mm) Bedside Cards
// Uses offscreen Canvas 2D measurement (works even inside display:none print
// containers) plus DOM overflow verification when visible on screen.
// ============================================================================
const CARD_USABLE_WIDTH_PX = 308; // 90mm (~340px) minus 6px borders & ~26px horizontal breathing room
const CARD_USABLE_HEIGHT_PX = 224; // 70mm (~264px) minus 6px borders & ~34px vertical breathing room
const WIDTH_SAFETY_FACTOR = 1.04;

let cachedCanvasCtx: CanvasRenderingContext2D | null = null;

function getMeasureContext(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null;
  if (!cachedCanvasCtx) {
    const canvas = document.createElement('canvas');
    cachedCanvasCtx = canvas.getContext('2d');
  }
  return cachedCanvasCtx;
}

function getSansFontFamily(): string {
  if (typeof window !== 'undefined' && typeof document !== 'undefined' && document.body) {
    const computed = window.getComputedStyle(document.body).fontFamily;
    if (computed) return computed;
  }
  return 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
}

function measureTextWidthAt100(text: string, fontFamily: string): number {
  const ctx = getMeasureContext();
  if (!ctx) {
    // SSR / fallback heuristic
    return Math.max(1, text.length) * 64;
  }
  ctx.font = `900 100px ${fontFamily}`;
  const metrics = ctx.measureText(text);
  // Apply tight tracking (-0.02em) compensation + safety factor
  return Math.max(1, metrics.width * 0.985 * WIDTH_SAFETY_FACTOR);
}

function greedySplitIntoLines(words: string[], numLines: number): string[] {
  if (numLines <= 1 || words.length <= 1) return [words.join(' ')];
  const totalChars = words.reduce((sum, w) => sum + w.length, 0) + (words.length - 1);
  const target = totalChars / numLines;
  const lines: string[] = [];
  let current: string[] = [];
  let currentLen = 0;

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const remainingWords = words.length - i;
    const remainingLines = numLines - lines.length;

    if (current.length > 0 && remainingWords === remainingLines) {
      lines.push(current.join(' '));
      current = [w];
      currentLen = w.length;
    } else if (
      current.length > 0 &&
      lines.length < numLines - 1 &&
      currentLen + 1 + w.length > target &&
      Math.abs(currentLen - target) <= Math.abs(currentLen + 1 + w.length - target)
    ) {
      lines.push(current.join(' '));
      current = [w];
      currentLen = w.length;
    } else {
      current.push(w);
      currentLen += (current.length > 1 ? 1 : 0) + w.length;
    }
  }
  if (current.length > 0) lines.push(current.join(' '));
  return lines;
}

function generateLineCandidates(words: string[], maxLines: number): string[][] {
  const n = words.length;
  if (n === 0) return [['']];
  if (n === 1) return [[words[0]]];

  const candidates: string[][] = [[words.join(' ')]];
  const cappedMax = Math.min(maxLines, n);

  if (n <= 8) {
    if (cappedMax >= 2) {
      for (let i = 1; i < n; i++) {
        candidates.push([words.slice(0, i).join(' '), words.slice(i).join(' ')]);
      }
    }
    if (cappedMax >= 3) {
      for (let i = 1; i < n - 1; i++) {
        for (let j = i + 1; j < n; j++) {
          candidates.push([
            words.slice(0, i).join(' '),
            words.slice(i, j).join(' '),
            words.slice(j).join(' '),
          ]);
        }
      }
    }
    if (cappedMax >= 4) {
      candidates.push(greedySplitIntoLines(words, 4));
    }
  } else {
    for (let k = 2; k <= cappedMax; k++) {
      candidates.push(greedySplitIntoLines(words, k));
    }
  }

  return candidates;
}

export function computeAutoFitNameLayout(fullName?: string): { lines: string[]; fontSize: number } {
  const raw = (fullName || '').trim() || 'PATIENT NAME';
  const upper = raw.toUpperCase();
  const words = upper.split(/\s+/).filter(Boolean);
  const fontFamily = getSansFontFamily();
  const candidates = generateLineCandidates(words, 4);

  const lineHeight = 1.05;
  const maxFontSize = 96;
  const minFontSize = 16;

  let bestLines = candidates[0];
  let bestSize = minFontSize;
  let bestScore = -Infinity;

  for (const lines of candidates) {
    const widths = lines.map((l) => measureTextWidthAt100(l, fontFamily));
    const maxW = Math.max(...widths);
    const minW = Math.min(...widths);

    const maxByWidth = (CARD_USABLE_WIDTH_PX / maxW) * 100;
    const maxByHeight = CARD_USABLE_HEIGHT_PX / (lines.length * lineHeight);
    const size = Math.max(minFontSize, Math.min(maxByWidth, maxByHeight, maxFontSize));

    // Primary objective: largest font size.
    // Tie-breakers: prefer balanced widths and slightly fewer lines when sizes are nearly equal.
    const balanceRatio = maxW > 0 ? minW / maxW : 1;
    const score = size + balanceRatio * 0.9 - lines.length * 0.45;

    if (score > bestScore) {
      bestScore = score;
      bestLines = lines;
      bestSize = Math.floor(size * 2) / 2;
    }
  }

  return { lines: bestLines, fontSize: bestSize };
}

export function computeAutoFitDoctorLayout(
  title: string,
  name: string
): { title: string; nameLines: string[]; titleFontSize: number; nameFontSize: number } {
  const cleanTitle = (title || 'DR.').trim().toUpperCase();
  const cleanName = (name || 'Physician').trim();
  const words = cleanName.split(/\s+/).filter(Boolean);
  const fontFamily = getSansFontFamily();
  const candidates = generateLineCandidates(words, 3);

  const titleRatio = 0.78;
  const titleLineHeight = 1.04;
  const nameLineHeight = 1.06;
  const gapRatio = 0.08;
  const maxNameFontSize = 88;
  const minNameFontSize = 16;

  const titleWidthAt100 = measureTextWidthAt100(cleanTitle, fontFamily) * titleRatio;

  let bestNameLines = candidates[0];
  let bestNameSize = minNameFontSize;
  let bestScore = -Infinity;

  for (const nameLines of candidates) {
    const widths = nameLines.map((l) => measureTextWidthAt100(l, fontFamily));
    const maxNameW = Math.max(...widths);
    const minNameW = Math.min(...widths);
    const overallMaxW = Math.max(titleWidthAt100, maxNameW);

    const maxByWidth = (CARD_USABLE_WIDTH_PX / overallMaxW) * 100;
    const totalHeightFactor = titleRatio * titleLineHeight + gapRatio + nameLines.length * nameLineHeight;
    const maxByHeight = CARD_USABLE_HEIGHT_PX / totalHeightFactor;
    const nameSize = Math.max(minNameFontSize, Math.min(maxByWidth, maxByHeight, maxNameFontSize));

    const balanceRatio = maxNameW > 0 ? minNameW / maxNameW : 1;
    const score = nameSize + balanceRatio * 0.9 - nameLines.length * 0.45;

    if (score > bestScore) {
      bestScore = score;
      bestNameLines = nameLines;
      bestNameSize = Math.floor(nameSize * 2) / 2;
    }
  }

  return {
    title: cleanTitle,
    nameLines: bestNameLines,
    titleFontSize: Math.floor(bestNameSize * titleRatio * 2) / 2,
    nameFontSize: bestNameSize,
  };
}

export const BedsidePatientNameContent: React.FC<{ fullName?: string }> = ({ fullName }) => {
  const layout = useMemo(() => computeAutoFitNameLayout(fullName), [fullName]);
  const layoutKey = `${layout.lines.join('|')}@${layout.fontSize}`;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [fitState, setFitState] = useState<{ key: string; scale: number }>({
    key: layoutKey,
    scale: 1,
  });

  const activeScale = fitState.key === layoutKey ? fitState.scale : 1;

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const inner = innerRef.current;
    if (!wrapper || !inner) return;
    const availW = wrapper.clientWidth;
    const availH = wrapper.clientHeight;
    if (availW <= 0 || availH <= 0) return;

    const neededW = inner.scrollWidth;
    const neededH = inner.scrollHeight;
    if (neededW > availW || neededH > availH) {
      const ratio = Math.min(availW / neededW, availH / neededH) * 0.97;
      if (ratio < 1 && ratio > 0.3) {
        setFitState({ key: layoutKey, scale: activeScale * ratio });
      }
    }
  }, [layoutKey, activeScale]);

  const effectiveSize = Math.max(14, Math.floor(layout.fontSize * activeScale * 2) / 2);

  return (
    <div
      ref={wrapperRef}
      className="w-full h-full flex items-center justify-center overflow-hidden"
    >
      <div
        ref={innerRef}
        className="flex flex-col items-center justify-center text-center font-sans font-black text-black uppercase tracking-tight"
        style={{
          fontSize: `${effectiveSize}px`,
          lineHeight: 1.05,
        }}
      >
        {layout.lines.map((line, idx) => (
          <div key={idx} className="whitespace-nowrap">
            {line}
          </div>
        ))}
      </div>
    </div>
  );
};

export const BedsideDoctorContent: React.FC<{ doctor?: string }> = ({ doctor }) => {
  const display = useMemo(() => getDoctorDisplay(doctor), [doctor]);
  const layout = useMemo(
    () => computeAutoFitDoctorLayout(display.title, display.name),
    [display.title, display.name]
  );
  const layoutKey = `${layout.title}|${layout.nameLines.join('|')}@${layout.nameFontSize}`;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [fitState, setFitState] = useState<{ key: string; scale: number }>({
    key: layoutKey,
    scale: 1,
  });

  const activeScale = fitState.key === layoutKey ? fitState.scale : 1;

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const inner = innerRef.current;
    if (!wrapper || !inner) return;
    const availW = wrapper.clientWidth;
    const availH = wrapper.clientHeight;
    if (availW <= 0 || availH <= 0) return;

    const neededW = inner.scrollWidth;
    const neededH = inner.scrollHeight;
    if (neededW > availW || neededH > availH) {
      const ratio = Math.min(availW / neededW, availH / neededH) * 0.97;
      if (ratio < 1 && ratio > 0.3) {
        setFitState({ key: layoutKey, scale: activeScale * ratio });
      }
    }
  }, [layoutKey, activeScale]);

  const effectiveTitleSize = Math.max(12, Math.floor(layout.titleFontSize * activeScale * 2) / 2);
  const effectiveNameSize = Math.max(14, Math.floor(layout.nameFontSize * activeScale * 2) / 2);

  return (
    <div
      ref={wrapperRef}
      className="w-full h-full flex items-center justify-center overflow-hidden"
    >
      <div
        ref={innerRef}
        className="flex flex-col items-center justify-center text-center font-sans font-black text-black"
        style={{ gap: `${Math.max(2, Math.round(effectiveNameSize * 0.08))}px` }}
      >
        <div
          className="uppercase tracking-wide whitespace-nowrap"
          style={{
            fontSize: `${effectiveTitleSize}px`,
            lineHeight: 1.04,
          }}
        >
          {layout.title}
        </div>
        <div
          className="tracking-tight flex flex-col items-center"
          style={{
            fontSize: `${effectiveNameSize}px`,
            lineHeight: 1.06,
          }}
        >
          {layout.nameLines.map((line, idx) => (
            <div key={idx} className="whitespace-nowrap">
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function computeSingleLineFitSize(
  text: string,
  maxSize: number,
  minSize: number,
  maxWidthPx: number
): number {
  if (!text.trim()) return maxSize;
  const fontFamily = getSansFontFamily();
  const widthAt100 = measureTextWidthAt100(text, fontFamily);
  const fitSize = (maxWidthPx / widthAt100) * 100;
  const clamped = Math.max(minSize, Math.min(maxSize, fitSize));
  return Math.floor(clamped * 2) / 2;
}

export const FileAttachedCardContent: React.FC<{ patient: PatientDemographics }> = ({ patient }) => {
  const shortDate = formatShortDate(patient.dateOfAdmission);
  const wardBed = formatWardBed(patient);
  const doctor = getDoctorDisplay(patient.caringDoctor);
  const patientName = (patient.fullName || 'Patient Name').trim().toUpperCase();
  const cprNumber = patient.idNumber || '—';
  const ageDisplay = patient.age ? `${patient.age} YRS` : '— YRS';
  const sexCode = patient.sex ? (patient.sex.toUpperCase().startsWith('M') ? 'M' : 'F') : '—';
  const nationalityDisplay = (patient.nationality || 'BAHRAINI').toUpperCase();
  const allergyDisplay = formatAllergy(patient.allergies);

  const sizes = useMemo(() => {
    const innerWidth = 310;
    return {
      header: computeSingleLineFitSize(`${shortDate}   ${wardBed.toUpperCase()}`, 16.5, 12, innerWidth),
      name: computeSingleLineFitSize(patientName, 25, 14, innerWidth),
      cpr: computeSingleLineFitSize(`CPR ${cprNumber}`, 20.5, 14, innerWidth),
      demographics: computeSingleLineFitSize(
        `${ageDisplay} • (${sexCode}) • ${nationalityDisplay}`,
        18.5,
        13,
        innerWidth
      ),
      doctor: computeSingleLineFitSize(`C/O ${doctor.full}`, 18.5, 13, innerWidth),
      allergy: computeSingleLineFitSize(`ALLERGY: ${allergyDisplay.toUpperCase()}`, 18.5, 13, innerWidth),
    };
  }, [shortDate, wardBed, patientName, cprNumber, ageDisplay, sexCode, nationalityDisplay, doctor.full, allergyDisplay]);

  return (
    <>
      {/* Header Row: Date & Ward/Bed */}
      <div
        className="flex items-center justify-between font-black text-black border-b-[1.5px] border-slate-300 pb-1 px-0.5 leading-none"
        style={{ fontSize: `${sizes.header}px` }}
      >
        <span className="font-mono whitespace-nowrap">{shortDate}</span>
        <span className="font-extrabold text-[#002878] uppercase whitespace-nowrap">{wardBed}</span>
      </div>

      {/* Center Info - enlarged & auto-fitted to fill 9×7 cm card */}
      <div className="flex flex-col justify-evenly flex-1 py-1 text-center">
        <h2
          className="font-black text-black tracking-tight leading-none uppercase whitespace-nowrap overflow-hidden text-ellipsis"
          style={{ fontSize: `${sizes.name}px` }}
        >
          {patientName}
        </h2>

        <div
          className="font-bold text-black tracking-wide leading-none whitespace-nowrap"
          style={{ fontSize: `${sizes.cpr}px` }}
        >
          <span>CPR </span>
          <strong className="font-mono font-black ml-1">{cprNumber}</strong>
        </div>

        <div
          className="font-bold text-black tracking-tight leading-none whitespace-nowrap"
          style={{ fontSize: `${sizes.demographics}px` }}
        >
          <span>{ageDisplay}</span>
          <span className="mx-1.5 font-black">•</span>
          <strong className="font-black">({sexCode})</strong>
          <span className="mx-1.5 font-black">•</span>
          <strong className="font-black text-slate-800 uppercase">{nationalityDisplay}</strong>
        </div>

        <div
          className="font-bold text-black leading-none whitespace-nowrap overflow-hidden text-ellipsis"
          style={{ fontSize: `${sizes.doctor}px` }}
        >
          <span>C/O </span>
          <strong className="font-black text-[#002878]">{doctor.full}</strong>
        </div>

        <div
          className="font-bold text-black tracking-tight leading-none whitespace-nowrap overflow-hidden text-ellipsis"
          style={{ fontSize: `${sizes.allergy}px` }}
        >
          <span>ALLERGY: </span>
          <strong className="font-black uppercase text-red-700">{allergyDisplay}</strong>
        </div>
      </div>
    </>
  );
};

export const PrintableBedsideCardSheet: React.FC<PrintableBedsideCardSheetProps> = ({
  patient,
  isPrintOnly = false,
  showDimensionBadges = false,
}) => {
  return (
    <div
      id="printable-bedside-label-sheet"
      className={`bedside-card-sheet bg-white text-black font-sans box-border select-text flex flex-col items-center justify-center relative ${
        isPrintOnly
          ? 'printable-landscape-sheet'
          : 'w-full max-w-[297mm] shadow-xl border border-slate-300 rounded-sm mx-auto'
      }`}
      style={{
        width: '297mm', // Exact A4 Landscape Width
        minHeight: '210mm', // Exact A4 Landscape Height
        height: '210mm',
        backgroundColor: '#ffffff',
        color: '#000000',
        padding: '0',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      {/* A4 Sheet Header Trim & Calibration Bar (Visible in Screen & Print Margin) */}
      <div className="w-full max-w-[270mm] flex items-center justify-between text-[8px] text-slate-400 font-mono pt-3 pb-1.5 px-1 no-print">
        <span className="flex items-center gap-1 font-semibold text-slate-600">
          <Scissors className="w-3 h-3 text-slate-400" />
          <span>A4 Landscape Sheet (297 × 210 mm) • Cut along the solid blue lines</span>
        </span>
        <span className="font-bold text-slate-500">
          Cards: 9 × 7 cm | ID Tags: 1.8 × 6.7 cm
        </span>
      </div>

      {/* Main Centered 27cm × 14cm Card Grid Frame (3 Columns of 9cm, 2 Rows of 7cm) */}
      <div
        className="bedside-sheet-grid bg-white border-[3px] border-[#002878] box-border relative"
        style={{
          width: '270mm', // Exact 3 * 90mm = 27cm
          height: '140mm', // Exact 2 * 70mm = 14cm
          minWidth: '270mm',
          maxWidth: '270mm',
          minHeight: '140mm',
          maxHeight: '140mm',
          display: 'grid',
          gridTemplateColumns: '90mm 90mm 90mm',
          gridTemplateRows: '70mm 70mm',
          borderColor: '#002878',
          boxSizing: 'border-box',
          margin: 'auto',
        }}
      >
        {/* ========================================================= */}
        {/* ROW 1: TOP 3 CARDS (Each 90mm × 70mm = 9cm × 7cm)          */}
        {/* ========================================================= */}

        {/* 1. TOP-LEFT: Bedside Patient Name Card (9cm × 7cm) */}
        <div
          id="card-bedside-name"
          className="relative border-r-[3px] border-b-[3px] border-[#002878] p-2.5 flex flex-col justify-center items-center overflow-hidden bg-white box-border"
          style={{ width: '90mm', height: '70mm', minWidth: '90mm', maxWidth: '90mm', minHeight: '70mm', maxHeight: '70mm', boxSizing: 'border-box' }}
        >
          {showDimensionBadges && (
            <span className="absolute top-1.5 right-1.5 text-[8.5px] font-mono font-bold bg-blue-50 text-blue-900 px-1 py-0.2 rounded border border-blue-200 no-print z-10">
              9 × 7 cm
            </span>
          )}
          <BedsidePatientNameContent fullName={patient.fullName} />
        </div>

        {/* 2. TOP-MIDDLE: Bedside Caring Dr Card #1 (9cm × 7cm) */}
        <div
          id="card-bedside-doctor-1"
          className="relative border-r-[3px] border-b-[3px] border-[#002878] p-2.5 flex flex-col justify-center items-center overflow-hidden bg-white box-border"
          style={{ width: '90mm', height: '70mm', minWidth: '90mm', maxWidth: '90mm', minHeight: '70mm', maxHeight: '70mm', boxSizing: 'border-box' }}
        >
          {showDimensionBadges && (
            <span className="absolute top-1.5 right-1.5 text-[8.5px] font-mono font-bold bg-blue-50 text-blue-900 px-1 py-0.2 rounded border border-blue-200 no-print z-10">
              9 × 7 cm
            </span>
          )}
          <BedsideDoctorContent doctor={patient.caringDoctor} />
        </div>

        {/* 3. TOP-RIGHT: File Attached Card #1 (9cm × 7cm) */}
        {/* Fields: [date of admission, ward numer, bed number, patient name, ID, age, sex, nationality, caring Dr, allergy] */}
        <div
          id="card-file-attached-1"
          className="relative border-b-[3px] border-[#002878] p-2.5 flex flex-col justify-between overflow-hidden bg-white box-border font-sans"
          style={{ width: '90mm', height: '70mm', minWidth: '90mm', maxWidth: '90mm', minHeight: '70mm', maxHeight: '70mm', boxSizing: 'border-box' }}
        >
          {showDimensionBadges && (
            <span className="absolute top-1 right-1 text-[8px] font-mono font-bold bg-blue-50 text-blue-900 px-1 py-0.2 rounded border border-blue-200 no-print z-10">
              9 × 7 cm
            </span>
          )}
          <FileAttachedCardContent patient={patient} />
        </div>

        {/* ========================================================= */}
        {/* ROW 2: BOTTOM 3 CARDS / SLOTS (Each 90mm × 70mm = 9cm × 7cm)*/}
        {/* ========================================================= */}

        {/* 4. BOTTOM-LEFT: Bedside Caring Dr Card #2 (9cm × 7cm) */}
        <div
          id="card-bedside-doctor-2"
          className="relative border-r-[3px] border-[#002878] p-2.5 flex flex-col justify-center items-center overflow-hidden bg-white box-border"
          style={{ width: '90mm', height: '70mm', minWidth: '90mm', maxWidth: '90mm', minHeight: '70mm', maxHeight: '70mm', boxSizing: 'border-box' }}
        >
          {showDimensionBadges && (
            <span className="absolute top-1.5 right-1.5 text-[8.5px] font-mono font-bold bg-blue-50 text-blue-900 px-1 py-0.2 rounded border border-blue-200 no-print z-10">
              9 × 7 cm
            </span>
          )}
          <BedsideDoctorContent doctor={patient.caringDoctor} />
        </div>

        {/* 5. BOTTOM-MIDDLE: ID Tags Slot (9cm × 7cm slot holding two 1.8cm × 6.7cm vertical tags) */}
        <div
          id="slot-id-tags"
          className="relative border-r-[3px] border-[#002878] flex items-center justify-center gap-3.5 p-0.5 bg-white box-border overflow-hidden"
          style={{ width: '90mm', height: '70mm', minWidth: '90mm', maxWidth: '90mm', minHeight: '70mm', maxHeight: '70mm', boxSizing: 'border-box' }}
        >
          {showDimensionBadges && (
            <span className="absolute top-1.5 right-1.5 text-[8px] font-mono font-bold bg-blue-50 text-blue-900 px-1 py-0.2 rounded border border-blue-200 no-print z-10">
              ID Tags (1.8 × 6.7 cm)
            </span>
          )}

          {/* ID Tag #1 (Exactly 1.8cm × 6.7cm = 18mm × 67mm) */}
          <IdTagCard patient={patient} id="id-tag-1" />

          {/* ID Tag #2 (Duplicate, Exactly 1.8cm × 6.7cm = 18mm × 67mm) */}
          <IdTagCard patient={patient} id="id-tag-2" />
        </div>

        {/* 6. BOTTOM-RIGHT: File Attached Card #2 (9cm × 7cm) */}
        {/* Fields: [date of admission, ward numer, bed number, patient name, ID, age, sex, nationality, caring Dr, allergy] */}
        <div
          id="card-file-attached-2"
          className="relative p-2.5 flex flex-col justify-between overflow-hidden bg-white box-border font-sans"
          style={{ width: '90mm', height: '70mm', minWidth: '90mm', maxWidth: '90mm', minHeight: '70mm', maxHeight: '70mm', boxSizing: 'border-box' }}
        >
          {showDimensionBadges && (
            <span className="absolute top-1 right-1 text-[8px] font-mono font-bold bg-blue-50 text-blue-900 px-1 py-0.2 rounded border border-blue-200 no-print z-10">
              9 × 7 cm
            </span>
          )}
          <FileAttachedCardContent patient={patient} />
        </div>
      </div>

      {/* A4 Sheet Bottom Calibration Bar (Visible in Screen & Print Margin) */}
      <div className="w-full max-w-[270mm] flex items-center justify-between text-[8px] text-slate-400 font-mono pb-3 pt-1.5 px-1 no-print">
        <span>KINGDOM OF BAHRAIN • GOVERNMENT HOSPITALS</span>
        <span>Standard Hospital Printout Format</span>
      </div>
    </div>
  );
};
