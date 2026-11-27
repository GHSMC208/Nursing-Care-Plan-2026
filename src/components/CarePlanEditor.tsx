import React, { useState } from 'react';
import { NursingCarePlan, NandaItem } from '../types';
import { NANDA_DATABASE } from '../data/nandaData';
import { Search, Calendar, AlertTriangle, Target, ClipboardList, CheckCircle2, Copy, Sparkles, BookOpen, RefreshCw, Trash2, ArrowRightLeft, UserCheck, Award, RotateCcw } from 'lucide-react';

interface CarePlanEditorProps {
  plan: NursingCarePlan;
  planNumber: 1 | 2;
  onChange: (updated: NursingCarePlan) => void;
  onOpenNandaSearch: () => void;
  onSwapWithOtherPlan?: () => void;
  onClearPlan?: () => void;
}

export const CarePlanEditor: React.FC<CarePlanEditorProps> = ({
  plan,
  planNumber,
  onChange,
  onOpenNandaSearch,
  onSwapWithOtherPlan,
  onClearPlan,
}) => {
  const handleFieldChange = (field: keyof NursingCarePlan, value: any) => {
    onChange({
      ...plan,
      [field]: value,
    });
  };

  const setTodayOnset = () => {
    const today = new Date().toISOString().split('T')[0];
    handleFieldChange('dateOfOnset', today);
  };

  // Find matching NANDA in database to offer quick inline suggestions if available
  const normalizedPlanDiagnosis = plan.diagnosis.trim().toLowerCase();
  const matchedNanda = NANDA_DATABASE.find((n) => {
    const dbDiag = n.diagnosis.toLowerCase();
    return (
      dbDiag === normalizedPlanDiagnosis ||
      dbDiag === normalizedPlanDiagnosis.replace(/^risk of\s+/, 'risk for ')
    );
  });

  const appendSuggestion = (field: 'relatedFactors' | 'expectedOutcome' | 'interventions', text: string) => {
    const current = plan[field] || '';
    if (!current.trim()) {
      handleFieldChange(field, text);
    } else if (!current.includes(text)) {
      if (field === 'interventions') {
        const nextNumber = current.split('\n').filter(l => l.trim()).length + 1;
        handleFieldChange(field, `${current}\n${nextNumber}. ${text}`);
      } else {
        handleFieldChange(field, `${current}\n• ${text}`);
      }
    }
  };

  const isPlan1 = planNumber === 1;

  return (
    <div
      className={`bg-white/95 backdrop-blur-xs rounded-2xl border shadow-sm overflow-hidden flex flex-col ${
        isPlan1 ? 'border-sky-200/90' : 'border-violet-200/90'
      }`}
    >
      {/* Header Bar */}
      <div
        className={`px-6 py-4 border-b flex flex-wrap items-center justify-between gap-3 ${
          isPlan1
            ? 'bg-gradient-to-r from-sky-50 via-blue-50/90 to-cyan-50/75 border-sky-100'
            : 'bg-gradient-to-r from-violet-50 via-purple-50/90 to-fuchsia-50/75 border-violet-100'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-white shadow-sm ${
              isPlan1
                ? 'bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600'
                : 'bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600'
            }`}
          >
            #{planNumber}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Nursing Care Plan #{planNumber}
              </h3>
              <span
                className={`text-xs font-bold ${
                  isPlan1 ? 'text-sky-700' : 'text-violet-700'
                }`}
              >
                · {isPlan1 ? 'Priority Diagnosis 1' : 'Secondary Priority 2'}
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Formulated according to standard NANDA-I, NOC, and NIC inpatient nursing documentation
            </p>
          </div>
        </div>

        {/* Quick Actions Toolbar */}
        <div className="flex items-center gap-2">
          {onClearPlan && (
            <button
              id={`clear-plan-${planNumber}-btn`}
              type="button"
              onClick={onClearPlan}
              className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 transition-all text-xs flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
              title={`Clear all fields in Care Plan #${planNumber}`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear Plan</span>
            </button>
          )}

          {onSwapWithOtherPlan && (
            <button
              id={`swap-plan-${planNumber}-btn`}
              type="button"
              onClick={onSwapWithOtherPlan}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-indigo-50 text-indigo-800 font-bold text-xs border border-indigo-200 transition-all flex items-center gap-1.5 shadow-xs whitespace-nowrap"
              title="Swap priority order between Plan 1 and Plan 2"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Swap Priority (1 ⇄ 2)</span>
            </button>
          )}

          <button
            id={`open-nanda-modal-btn-${planNumber}`}
            type="button"
            onClick={onOpenNandaSearch}
            className={`px-3.5 py-2 rounded-xl text-white font-bold text-xs shadow-sm hover:shadow transition-all flex items-center gap-1.5 whitespace-nowrap ${
              isPlan1
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-700 hover:to-sky-700'
                : 'bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search NANDA List</span>
          </button>
        </div>
      </div>

      {/* Editor Body Form */}
      <div className="p-6 space-y-6">
        {/* Row 1: Nursing Diagnosis & Date of Onset */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Diagnosis (8 Cols) */}
          <div className="md:col-span-8">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-extrabold text-sky-950 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                2. Nursing Diagnosis (NANDA-I) *
              </label>
              <button
                type="button"
                onClick={onOpenNandaSearch}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Search className="w-3 h-3" /> Browse NANDA catalog
              </button>
            </div>

            <div className="relative flex items-center">
              <input
                id={`plan-${planNumber}-diagnosis-input`}
                type="text"
                placeholder="Click 'Search NANDA List' or type diagnosis (e.g., Acute Pain, Impaired Gas Exchange)..."
                value={plan.diagnosis}
                onChange={(e) => handleFieldChange('diagnosis', e.target.value)}
                className="w-full pl-3.5 pr-28 py-2.5 bg-sky-50/35 hover:bg-white focus:bg-white border border-sky-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition-all placeholder:text-slate-400 font-sans"
              />
              <button
                type="button"
                onClick={onOpenNandaSearch}
                className="absolute right-2 px-2.5 py-1 bg-gradient-to-r from-sky-100 to-indigo-100 hover:from-sky-200 hover:to-indigo-200 text-indigo-800 text-xs font-bold rounded-lg border border-indigo-200 transition-all"
              >
                Pick NANDA
              </button>
            </div>

            {plan.domain && (
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                <span className="font-semibold text-indigo-700">{plan.domain}</span>
                {plan.nandaCode && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span className="font-mono tabular-nums text-slate-500 font-semibold">
                      NANDA #{plan.nandaCode}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Date of Onset (4 Cols) */}
          <div className="md:col-span-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-extrabold text-teal-950 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                3. Date of Onset *
              </label>
              <button
                type="button"
                onClick={setTodayOnset}
                className="text-[11px] text-teal-700 hover:text-teal-900 font-bold underline"
              >
                Set Today
              </button>
            </div>
            <input
              id={`plan-${planNumber}-onset-date-input`}
              type="date"
              value={plan.dateOfOnset}
              onChange={(e) => handleFieldChange('dateOfOnset', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-teal-50/30 hover:bg-white focus:bg-white border border-teal-200 rounded-xl text-sm font-semibold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 transition-all"
            />
          </div>
        </div>

        {/* Section 4: Related Factors (Etiology) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/55 via-orange-50/25 to-white border border-amber-200/80 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              4. Related Factors (Etiology / Pathophysiology / "Related to...") *
            </label>
            <span className="text-[11px] text-amber-800/80 font-medium">
              Underlying biological, surgical, or mechanical causes
            </span>
          </div>

          <textarea
            id={`plan-${planNumber}-related-factors-input`}
            rows={3}
            placeholder="e.g., Biological injury agent secondary to laparoscopic surgery; localized tissue inflammation and abdominal distention..."
            value={plan.relatedFactors}
            onChange={(e) => handleFieldChange('relatedFactors', e.target.value)}
            className="w-full p-3.5 bg-white border border-amber-200/90 rounded-xl text-xs md:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500 transition-all leading-relaxed placeholder:text-slate-400"
          />

          {/* Quick Suggestions for Related Factors if NANDA is matched */}
          {matchedNanda && matchedNanda.suggestedRelatedFactors.length > 0 && (
            <div className="pt-1 text-xs space-y-1.5">
              <span className="font-bold text-amber-900 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Suggested Etiologies for {matchedNanda.diagnosis}:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {matchedNanda.suggestedRelatedFactors.map((factor, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => appendSuggestion('relatedFactors', factor)}
                    className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-950 rounded-lg border border-amber-200 font-semibold text-[11px] text-left transition-all shadow-2xs"
                  >
                    + {factor}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section 5: Expected Outcome (NOC) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/55 via-teal-50/25 to-white border border-emerald-200/80 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-emerald-600" />
              5. Expected Outcome (NOC / Measurable Goals & Timeframe) *
            </label>
            <span className="text-[11px] text-emerald-800/80 font-medium">
              SMART patient goals (Measurable, Achievable, Time-bound)
            </span>
          </div>

          <textarea
            id={`plan-${planNumber}-expected-outcome-input`}
            rows={3}
            placeholder="e.g., Patient will report pain reduction to ≤3/10 on NRS within 45 minutes of medication and demonstrate relaxed posture..."
            value={plan.expectedOutcome}
            onChange={(e) => handleFieldChange('expectedOutcome', e.target.value)}
            className="w-full p-3.5 bg-white border border-emerald-200/90 rounded-xl text-xs md:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition-all leading-relaxed placeholder:text-slate-400"
          />

          {/* Quick Suggestions for Expected Outcome if NANDA is matched */}
          {matchedNanda && matchedNanda.suggestedExpectedOutcomes.length > 0 && (
            <div className="pt-1 text-xs space-y-1.5">
              <span className="font-bold text-emerald-900 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Suggested Expected Outcomes for {matchedNanda.diagnosis}:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {matchedNanda.suggestedExpectedOutcomes.map((outcome, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => appendSuggestion('expectedOutcome', outcome)}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-950 rounded-lg border border-emerald-200 font-semibold text-[11px] text-left transition-all shadow-2xs"
                  >
                    + {outcome}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section 6: Nursing Interventions (NIC) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50/55 via-indigo-50/25 to-white border border-sky-200/80 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-extrabold text-sky-950 flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-blue-600" />
              6. Nursing Interventions & Rationales (NIC) *
            </label>
            <span className="text-[11px] text-sky-800/80 font-medium">
              Specific independent & collaborative nursing actions with frequencies
            </span>
          </div>

          <textarea
            id={`plan-${planNumber}-interventions-input`}
            rows={5}
            placeholder="1. Assess vital signs and pain intensity every 2-4 hours...&#10;2. Administer prescribed analgesics and monitor response...&#10;3. Reposition patient every 2 hours with pillow support..."
            value={plan.interventions}
            onChange={(e) => handleFieldChange('interventions', e.target.value)}
            className="w-full p-3.5 bg-white border border-sky-200/90 rounded-xl text-xs md:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition-all leading-relaxed font-mono placeholder:text-slate-400"
          />

          {/* Quick Suggestions for Interventions if NANDA is matched */}
          {matchedNanda && matchedNanda.suggestedInterventions.length > 0 && (
            <div className="pt-1 text-xs space-y-1.5">
              <span className="font-bold text-blue-900 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Suggested Interventions for {matchedNanda.diagnosis}:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {matchedNanda.suggestedInterventions.map((intervention, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => appendSuggestion('interventions', intervention)}
                    className="px-2.5 py-1 bg-white hover:bg-sky-100 text-blue-950 rounded-lg border border-sky-200 font-semibold text-[11px] text-left transition-all shadow-2xs"
                  >
                    + {intervention}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section 7: Evaluation & Clinical Notes */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-50/50 via-purple-50/20 to-white border border-violet-200/80 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-extrabold text-violet-950 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-violet-600" />
              7. Evaluation / Nursing Progress Notes
            </label>
            <span className="text-[11px] text-violet-800/80 font-medium">
              Shift assessment & response to interventions
            </span>
          </div>

          <textarea
            id={`plan-${planNumber}-evaluation-input`}
            rows={2}
            placeholder="e.g., Goal met: Patient reports pain score 2/10 after 30 min of analgesia. Vital signs stable, ambulating safely."
            value={plan.evaluation || ''}
            onChange={(e) => handleFieldChange('evaluation', e.target.value)}
            className="w-full p-3.5 bg-white border border-violet-200/90 rounded-xl text-xs md:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Section 8: Clinical Sign-Off Audit Trail (Dates Reviewed & Date Achieved) */}
        <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Box 1: Dates Reviewed with Staff Signatures */}
          <div className="bg-gradient-to-br from-indigo-50/65 to-sky-50/40 p-4 rounded-2xl border border-indigo-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                Dates Reviewed with Staff Signatures
              </label>
              <span className="text-[11px] text-indigo-700 font-semibold">Routine Reviews</span>
            </div>

            {/* Review 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-indigo-900 mb-1">Date Reviewed #1</label>
                <input
                  id={`plan-${planNumber}-date-reviewed-1`}
                  type="date"
                  value={plan.dateReviewed || ''}
                  onChange={(e) => handleFieldChange('dateReviewed', e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-semibold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-indigo-900 mb-1">Staff Signature #1</label>
                <input
                  id={`plan-${planNumber}-staff-signature-1`}
                  type="text"
                  placeholder="e.g., S. Jenkins, RN"
                  value={plan.dateReviewedStaffSignature || ''}
                  onChange={(e) => handleFieldChange('dateReviewedStaffSignature', e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-indigo-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Review 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-indigo-200/70">
              <div>
                <label className="block text-[11px] font-semibold text-indigo-900 mb-1">Date Reviewed #2 (Follow-up)</label>
                <input
                  id={`plan-${planNumber}-date-reviewed-2`}
                  type="date"
                  value={plan.dateReviewed2 || ''}
                  onChange={(e) => handleFieldChange('dateReviewed2', e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-semibold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-indigo-900 mb-1">Staff Signature #2</label>
                <input
                  id={`plan-${planNumber}-staff-signature-2`}
                  type="text"
                  placeholder="e.g., M. Chen, MD"
                  value={plan.dateReviewedStaffSignature2 || ''}
                  onChange={(e) => handleFieldChange('dateReviewedStaffSignature2', e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-indigo-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Box 2: Date Achieved with Staff Signature */}
          <div className="bg-gradient-to-br from-emerald-50/75 to-teal-50/50 p-4 rounded-2xl border border-emerald-200/90 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-600" />
                  Date Achieved with Staff Signature
                </label>
                <span className="text-[11px] text-emerald-700 font-semibold">Goal Completion</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-emerald-900 mb-1">Date Achieved</label>
                  <input
                    id={`plan-${planNumber}-date-achieved`}
                    type="date"
                    value={plan.dateAchieved || ''}
                    onChange={(e) => handleFieldChange('dateAchieved', e.target.value)}
                    className="w-full px-2.5 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-semibold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-emerald-900 mb-1">Achieved Staff Signature</label>
                  <input
                    id={`plan-${planNumber}-achieved-signature`}
                    type="text"
                    placeholder="e.g., Staff Nurse Signature / RN"
                    value={plan.dateAchievedStaffSignature || ''}
                    onChange={(e) => handleFieldChange('dateAchievedStaffSignature', e.target.value)}
                    className="w-full px-2.5 py-2 bg-white border border-emerald-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="text-[11px] text-emerald-900 bg-white/85 p-2.5 rounded-xl border border-emerald-200/80">
              <span className="font-bold block">Print Footer Output</span>
              <span>Automatically updates the standard bottom sign-off table on the A4 printable care plan sheet.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
