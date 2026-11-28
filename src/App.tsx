import React, { useState, useEffect } from 'react';
import { PatientDemographics, NursingCarePlan, InpatientRecord, NandaItem } from './types';
import { SAMPLE_PATIENTS } from './data/samplePatients';
import { PatientDemographicsForm } from './components/PatientDemographicsForm';
import { CarePlanEditor } from './components/CarePlanEditor';
import { NandaSearchModal } from './components/NandaSearchModal';
import { PrintableCarePlan } from './components/PrintableCarePlan';
import { PrintableBedsideCardSheet } from './components/PrintableBedsideCardSheet';
import { ResponsiveBedsideSheetView } from './components/ResponsiveBedsideSheetView';
import { PrintPreviewModal, PrintDocumentType, PrintCarePlanScope } from './components/PrintPreviewModal';
import { SavedRecordsModal } from './components/SavedRecordsModal';
import governmentHospitalsLogo from './assets/images/bahrain_gov_hospitals_logo_1787046319692.jpg';
import {
  FileSpreadsheet,
  Printer,
  Eye,
  Plus,
  Save,
  RotateCcw,
  BookOpen,
  CheckCircle,
  FolderOpen,
  Sparkles,
  Download,
  Upload,
  ArrowRightLeft,
  Columns,
  Layers,
  Heart,
  Stethoscope,
  Info,
  AlertTriangle,
  ShieldCheck,
  Tag,
  FileText,
} from 'lucide-react';

const STORAGE_KEY = 'inpatient_nursing_care_plans_records';

const BLANK_INITIAL_PATIENT: PatientDemographics = {
  fullName: '',
  idNumber: '',
  age: '',
  sex: '',
  nationality: '',
  dateOfAdmission: '',
  wardNumber: '',
  bedNumber: '',
  wardAndBedNumber: '',
  caringDoctor: '',
  hospitalName: 'Salmaniya Medical Complex',
  departmentUnit: '',
  allergies: 'Unknown Drug Allergy',
};

type ActiveTab = 'demographics' | 'bedside-sheet' | 'split' | `plan-${number}`;

const createBlankCarePlan = (planNumber: number): NursingCarePlan => ({
  id: `cp-${planNumber}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  planNumber,
  title:
    planNumber === 1
      ? 'Priority Nursing Care Plan #1'
      : planNumber === 2
      ? 'Secondary Nursing Care Plan #2'
      : `Additional Nursing Care Plan #${planNumber}`,
  nandaCode: '',
  diagnosis: '',
  domain: '',
  dateOfOnset: '',
  relatedFactors: '',
  expectedOutcome: '',
  interventions: '',
  evaluation: '',
  status: 'Active',
});

const getInitialCarePlans = (): NursingCarePlan[] => [
  createBlankCarePlan(1),
  createBlankCarePlan(2),
];

const PLAN_TAB_STYLES = [
  {
    active: 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-sm',
    inactiveHover: 'hover:text-sky-700',
    activeIcon: 'text-sky-100',
    inactiveIcon: 'text-sky-600',
  },
  {
    active: 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm',
    inactiveHover: 'hover:text-violet-700',
    activeIcon: 'text-violet-100',
    inactiveIcon: 'text-violet-600',
  },
  {
    active: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm',
    inactiveHover: 'hover:text-emerald-700',
    activeIcon: 'text-emerald-100',
    inactiveIcon: 'text-emerald-600',
  },
  {
    active: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm',
    inactiveHover: 'hover:text-amber-700',
    activeIcon: 'text-amber-100',
    inactiveIcon: 'text-amber-600',
  },
  {
    active: 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-sm',
    inactiveHover: 'hover:text-rose-700',
    activeIcon: 'text-rose-100',
    inactiveIcon: 'text-rose-600',
  },
];

export default function App() {
  // Current active patient demographics (starts completely empty)
  const [patient, setPatient] = useState<PatientDemographics>(BLANK_INITIAL_PATIENT);

  // Dynamic list of Nursing Care Plans (starts with 2 plans, users can add more)
  const [carePlans, setCarePlans] = useState<NursingCarePlan[]>(() => getInitialCarePlans());

  // Active Tab for editing: 'demographics' | 'bedside-sheet' | 'plan-1' | 'plan-2' | ... | 'split'
  const [activeTab, setActiveTab] = useState<ActiveTab>('demographics');

  // NANDA Search Modal State (1-based plan number)
  const [nandaModalOpen, setNandaModalOpen] = useState(false);
  const [nandaTargetPlanIndex, setNandaTargetPlanIndex] = useState<number>(0);

  // Print Preview Modal, print scope, and document type
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false);
  const [printScope, setPrintScope] = useState<PrintCarePlanScope>('all');
  const [printDocType, setPrintDocType] = useState<PrintDocumentType>('bedside');
  const [showBedsideDimensions, setShowBedsideDimensions] = useState<boolean>(true);

  // Saved Inpatients List
  const [savedRecords, setSavedRecords] = useState<InpatientRecord[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: InpatientRecord[] = JSON.parse(stored);
        // Ensure hospital name and separate ward & bed numbers are initialized
        return parsed.map((r) => {
          let wardNumber = r.patient.wardNumber || '';
          let bedNumber = r.patient.bedNumber || '';
          if (!wardNumber && !bedNumber && r.patient.wardAndBedNumber) {
            const parts = r.patient.wardAndBedNumber.split(',');
            wardNumber = parts[0]?.trim() || '';
            bedNumber = parts[1]?.replace(/^Bed\s*/i, '').trim() || '';
          }
          return {
            ...r,
            patient: {
              ...r.patient,
              wardNumber,
              bedNumber,
              wardAndBedNumber: r.patient.wardAndBedNumber || (wardNumber && bedNumber ? `${wardNumber}, Bed ${bedNumber}` : wardNumber || bedNumber),
              hospitalName: r.patient.hospitalName || 'Salmaniya Medical Complex',
              allergies: r.patient.allergies !== undefined ? r.patient.allergies : 'Unknown Drug Allergy',
            },
          };
        });
      }
    } catch (e) {
      console.error('Failed to load records from localStorage', e);
    }
    return SAMPLE_PATIENTS;
  });

  const [recordsModalOpen, setRecordsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Save to localStorage whenever savedRecords change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedRecords));
    } catch (e) {
      console.error('Failed to persist to localStorage', e);
    }
  }, [savedRecords]);

  // Toast notification helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load a record from saved records (supports both legacy 2-plan and multi-plan records)
  const handleLoadRecord = (record: InpatientRecord) => {
    const loadedPlans =
      record.carePlans && record.carePlans.length > 0
        ? record.carePlans.map((p, idx) => ({ ...p, planNumber: idx + 1 }))
        : [record.carePlan1, record.carePlan2]
            .filter(Boolean)
            .map((p, idx) => ({ ...p, planNumber: idx + 1 }));

    setPatient(record.patient);
    setCarePlans(loadedPlans.length > 0 ? loadedPlans : getInitialCarePlans());
    setPrintScope('all');
    if (activeTab.startsWith('plan-')) {
      setActiveTab('plan-1');
    }
    showToast(`Loaded care plan: ${record.patient.fullName}`);
  };

  // Delete a record from saved records
  const handleDeleteRecord = (id: string) => {
    setSavedRecords((prev) => prev.filter((r) => r.id !== id));
    showToast('Record deleted from saved list');
  };

  // Import records
  const handleImportRecords = (newRecords: InpatientRecord[]) => {
    setSavedRecords((prev) => {
      const existingIds = new Set(prev.map((r) => r.id));
      const filteredNew = newRecords.filter((r) => !existingIds.has(r.id));
      return [...filteredNew, ...prev];
    });
    showToast(`Imported ${newRecords.length} care plan records`);
  };

  // Reset presets
  const handleResetPresets = () => {
    setSavedRecords(SAMPLE_PATIENTS);
    showToast('Sample inpatient presets restored');
  };

  // Open NANDA search modal for a specific plan index (0-based)
  const handleOpenNandaSearch = (planIndex: number) => {
    setNandaTargetPlanIndex(planIndex);
    setNandaModalOpen(true);
  };

  // Update a single care plan by index
  const handleUpdateCarePlan = (index: number, updated: NursingCarePlan) => {
    setCarePlans((prev) => prev.map((plan, idx) => (idx === index ? { ...updated, planNumber: idx + 1 } : plan)));
  };

  // Add a new blank care plan
  const handleAddCarePlan = () => {
    const newNumber = carePlans.length + 1;
    const newPlan = createBlankCarePlan(newNumber);
    setCarePlans((prev) => [...prev, newPlan]);
    if (activeTab !== 'split') {
      setActiveTab(`plan-${newNumber}`);
    }
    showToast(`Added Nursing Care Plan #${newNumber}`);
  };

  // Remove a care plan by index (at least 1 plan must remain)
  const handleRemoveCarePlan = (index: number) => {
    if (carePlans.length <= 1) return;
    const removedNum = index + 1;
    const nextPlans = carePlans
      .filter((_, idx) => idx !== index)
      .map((plan, idx) => ({ ...plan, planNumber: idx + 1 }));

    setCarePlans(nextPlans);
    setPrintScope('all');

    if (activeTab.startsWith('plan-')) {
      const currentNum = Number(activeTab.replace('plan-', ''));
      if (currentNum === removedNum) {
        const fallbackNum = Math.min(removedNum, nextPlans.length);
        setActiveTab(`plan-${fallbackNum}`);
      } else if (currentNum > removedNum) {
        setActiveTab(`plan-${currentNum - 1}`);
      }
    }
    showToast(`Removed Care Plan #${removedNum}`);
  };

  // Move a care plan up (-1) or down (+1) in priority order
  const handleMoveCarePlan = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= carePlans.length) return;

    setCarePlans((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy.map((plan, idx) => ({ ...plan, planNumber: idx + 1 }));
    });

    if (activeTab === `plan-${index + 1}`) {
      setActiveTab(`plan-${targetIndex + 1}`);
    }
    showToast(`Moved Care Plan #${index + 1} to Position #${targetIndex + 1}`);
  };

  // When NANDA is selected from modal
  const handleApplyNanda = (
    item: NandaItem,
    selectedRelatedFactors: string[],
    selectedOutcomes: string[],
    selectedInterventions: string[]
  ) => {
    const formattedFactors = selectedRelatedFactors.join('\n• ');
    const formattedOutcomes = selectedOutcomes.join('\n• ');
    const formattedInterventions = selectedInterventions
      .map((text, idx) => `${idx + 1}. ${text}`)
      .join('\n');

    setCarePlans((prev) =>
      prev.map((plan, idx) =>
        idx === nandaTargetPlanIndex
          ? {
              ...plan,
              diagnosis: item.diagnosis,
              nandaCode: item.code || '',
              domain: item.domain,
              relatedFactors: `• ${formattedFactors}`,
              expectedOutcome: `• ${formattedOutcomes}`,
              interventions: formattedInterventions,
              dateOfOnset: plan.dateOfOnset || patient.dateOfAdmission || new Date().toISOString().split('T')[0],
            }
          : plan
      )
    );
    showToast(`Applied "${item.diagnosis}" to Care Plan #${nandaTargetPlanIndex + 1}`);
  };

  // Clear Demographics only
  const handleClearDemographics = () => {
    setPatient(BLANK_INITIAL_PATIENT);
    showToast('Inpatient demographic fields cleared');
  };

  // Clear a single care plan by index
  const handleClearPlan = (index: number) => {
    setCarePlans((prev) =>
      prev.map((plan, idx) => (idx === index ? { ...createBlankCarePlan(idx + 1), id: plan.id } : plan))
    );
    showToast(`Care Plan #${index + 1} fields cleared`);
  };

  // Clear all fields (Demographics and all Care Plans)
  const handleClearAllFields = () => {
    setPatient(BLANK_INITIAL_PATIENT);
    setCarePlans(getInitialCarePlans());
    setPrintScope('all');
    if (activeTab.startsWith('plan-')) {
      setActiveTab('plan-1');
    }
    showToast('All fields cleared');
  };

  // Create new blank inpatient record
  const handleNewRecord = () => {
    setPatient(BLANK_INITIAL_PATIENT);
    setCarePlans(getInitialCarePlans());
    setPrintScope('all');
    setActiveTab('demographics');
    showToast('New blank inpatient care plan initialized');
  };

  // Save current inpatient record to local records
  const handleSaveCurrentRecord = () => {
    if (!patient.fullName.trim()) {
      showToast('Please enter Patient Full Name before saving');
      setActiveTab('demographics');
      return;
    }

    const currentId = `rec-${Date.now()}`;
    const newRecord: InpatientRecord = {
      id: currentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      patient,
      carePlan1: carePlans[0] || createBlankCarePlan(1),
      carePlan2: carePlans[1] || createBlankCarePlan(2),
      carePlans,
    };

    setSavedRecords((prev) => [newRecord, ...prev.filter((r) => r.patient.idNumber !== patient.idNumber)]);
    showToast(`Saved ${carePlans.length} care plans for ${patient.fullName}`);
  };

  // Unified Print & Preview modal opener (context-aware based on current tab)
  const handleOpenPrintPreview = (forcedDocType?: PrintDocumentType) => {
    if (forcedDocType) {
      setPrintDocType(forcedDocType);
    } else if (activeTab.startsWith('plan-') || activeTab === 'split') {
      setPrintDocType('careplans');
    } else if (activeTab === 'bedside-sheet') {
      setPrintDocType('bedside');
    }
    setPrintPreviewOpen(true);
  };

  // Direct print trigger for Bedside Sheet
  const handleDirectPrintBedside = () => {
    setPrintDocType('bedside');
    setTimeout(() => {
      window.print();
    }, 60);
  };

  // Determine active care plan index if a single care plan tab is active
  const activePlanIndex = activeTab.startsWith('plan-') ? Number(activeTab.replace('plan-', '')) - 1 : -1;
  const activeCarePlan = activePlanIndex >= 0 && activePlanIndex < carePlans.length ? carePlans[activePlanIndex] : null;

  // Selected care plans for browser print container
  const selectedPlansForPrint =
    printScope === 'all'
      ? carePlans.map((plan, idx) => ({ plan, planNumber: idx + 1 }))
      : carePlans
          .map((plan, idx) => ({ plan, planNumber: idx + 1 }))
          .filter((item) => item.planNumber === printScope);

  return (
    <div className="min-h-screen app-vibrant-canvas text-slate-900 font-sans flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="toast-notification"
          className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-gradient-to-r from-indigo-900 via-blue-900 to-teal-800 text-white rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2.5 border border-cyan-400/30 animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <CheckCircle className="w-4 h-4 text-emerald-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Application Navigation Bar (Hidden on Print) */}
      <header className="no-print sticky top-0 z-30 bg-gradient-to-r from-indigo-900 via-blue-800 to-teal-700 text-white shadow-md border-b border-white/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={governmentHospitalsLogo}
              alt="Government Hospitals Logo"
              className="w-10 h-10 object-contain shrink-0 rounded-xl bg-white p-1 shadow-sm ring-2 ring-white/25"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight leading-tight whitespace-nowrap truncate">
                  Inpatient Care Plan Suite
                </h1>
                <span className="text-[11px] font-semibold text-cyan-100/90 hidden md:inline whitespace-nowrap">
                  · Government Hospitals, SMC
                </span>
              </div>
              <p className="text-xs text-sky-100/80 truncate hidden sm:block">
                NANDA-I nursing care plans · Upper-right inpatient label · A4 bedside & ID cards
              </p>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="saved-records-btn"
              type="button"
              onClick={() => setRecordsModalOpen(true)}
              className="px-3 py-2 rounded-lg bg-white/12 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap shrink-0 backdrop-blur-xs"
              title="View and manage saved inpatient care plans"
            >
              <FolderOpen className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">Saved Drafts</span>
              <span className="font-mono tabular-nums text-cyan-200 font-bold">
                ({savedRecords.length})
              </span>
            </button>

            <button
              id="new-care-plan-btn"
              type="button"
              onClick={handleNewRecord}
              className="px-3 py-2 rounded-lg bg-white/12 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap shrink-0 backdrop-blur-xs"
              title="Create New Blank Care Plan"
            >
              <Plus className="w-4 h-4 text-sky-200" />
              <span className="hidden md:inline">New Patient</span>
            </button>

            <button
              id="clear-all-fields-btn"
              type="button"
              onClick={handleClearAllFields}
              className="px-3 py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/35 text-rose-100 font-semibold text-xs border border-rose-300/35 transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap shrink-0"
              title="Clear all demographic and care plan fields"
            >
              <RotateCcw className="w-4 h-4 text-rose-200" />
              <span className="hidden md:inline">Clear All</span>
            </button>

            <button
              id="save-care-plan-btn"
              type="button"
              onClick={handleSaveCurrentRecord}
              className="px-3 py-2 rounded-lg bg-white/12 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap shrink-0 backdrop-blur-xs"
              title="Save to local patient records"
            >
              <Save className="w-4 h-4 text-emerald-300" />
              <span className="hidden md:inline">Save Draft</span>
            </button>

            <button
              id="preview-print-modal-btn"
              type="button"
              onClick={() => handleOpenPrintPreview()}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-extrabold text-xs shadow-sm hover:shadow-md transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap shrink-0"
              title="Open unified A4 Print Preview & Printing for Bedside Sheet and Care Plans"
            >
              <Printer className="w-4 h-4" />
              <span>Print & Preview</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area (Hidden on Print) */}
      <main className="no-print flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Active Patient Summary Banner & View Mode Switcher */}
        <div className="bg-white/95 backdrop-blur-xs rounded-2xl border border-indigo-100/90 shadow-sm overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-sky-500 via-indigo-500 via-teal-500 to-emerald-500" />
          <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-teal-500 text-white flex items-center justify-center font-extrabold text-sm shadow-sm shrink-0">
                {patient.fullName ? patient.fullName.trim().slice(0, 2).toUpperCase() : 'Pt'}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-base text-slate-900 tracking-tight">
                    {patient.fullName || 'Unnamed Inpatient'}
                  </span>
                  {patient.idNumber && (
                    <>
                      <span className="text-slate-300" aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums text-xs text-indigo-700 font-bold">
                        {patient.idNumber}
                      </span>
                    </>
                  )}
                  {patient.wardAndBedNumber && (
                    <>
                      <span className="text-slate-300" aria-hidden="true">·</span>
                      <span className="text-xs text-teal-700 font-bold">
                        {patient.wardAndBedNumber}
                      </span>
                    </>
                  )}
                  {patient.allergies && (
                    <>
                      <span className="text-slate-300" aria-hidden="true">·</span>
                      {patient.allergies.toLowerCase().includes('nkda') || patient.allergies.toLowerCase().includes('no known') ? (
                        <span className="text-xs text-emerald-700 font-bold inline-flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          NKDA
                        </span>
                      ) : patient.allergies.toLowerCase().includes('unknown') ? (
                        <span className="text-xs text-amber-700 font-bold inline-flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          {patient.allergies}
                        </span>
                      ) : (
                        <span
                          className="text-xs text-rose-700 font-extrabold inline-flex items-center gap-1"
                          title={patient.allergies}
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          Allergies: {patient.allergies.length > 28 ? `${patient.allergies.slice(0, 28)}...` : patient.allergies}
                        </span>
                      )}
                    </>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                  Admitted: <span className="font-semibold text-slate-700">{patient.dateOfAdmission || 'Not set'}</span>
                  <span className="mx-1.5 text-slate-300">·</span>
                  Caring DR: <span className="font-semibold text-indigo-700">{patient.caringDoctor || 'Not set'}</span>
                </p>
              </div>
            </div>

            {/* Navigation View Mode Tabs */}
            <div className="flex items-center bg-gradient-to-r from-sky-50 via-indigo-50/80 to-teal-50 p-1.5 rounded-xl border border-indigo-100 text-xs flex-wrap gap-1.5">
              <button
                id="nav-tab-demographics"
                type="button"
                onClick={() => setActiveTab('demographics')}
                className={`px-3.5 py-2 rounded-lg font-bold transition-all duration-150 whitespace-nowrap shrink-0 ${
                  activeTab === 'demographics'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-white/80 hover:text-indigo-700'
                }`}
              >
                1. Inpatient Details & Label
              </button>

              <button
                id="nav-tab-bedside-sheet"
                type="button"
                onClick={() => setActiveTab('bedside-sheet')}
                className={`px-3.5 py-2 rounded-lg font-bold transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeTab === 'bedside-sheet'
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-white/80 hover:text-teal-700'
                }`}
                title="Bedside & Door Label Printout (Exact Attached Layout)"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>2. Bedside & Door Sheet (A4)</span>
              </button>

              {carePlans.map((plan, idx) => {
                const planNum = idx + 1;
                const tabKey: ActiveTab = `plan-${planNum}`;
                const isActive = activeTab === tabKey;
                const tabStyle = PLAN_TAB_STYLES[idx % PLAN_TAB_STYLES.length];
                return (
                  <button
                    key={plan.id}
                    id={`nav-tab-plan-${planNum}`}
                    type="button"
                    onClick={() => setActiveTab(tabKey)}
                    className={`px-3.5 py-2 rounded-lg font-bold transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                      isActive
                        ? tabStyle.active
                        : `text-slate-700 hover:bg-white/80 ${tabStyle.inactiveHover}`
                    }`}
                  >
                    <span>Care Plan #{planNum}</span>
                    {plan.diagnosis && (
                      <CheckCircle
                        className={`w-3.5 h-3.5 ${isActive ? tabStyle.activeIcon : tabStyle.inactiveIcon}`}
                      />
                    )}
                  </button>
                );
              })}

              <button
                id="add-care-plan-tab-btn"
                type="button"
                onClick={handleAddCarePlan}
                className="px-3 py-2 rounded-lg font-bold transition-all duration-150 flex items-center gap-1 whitespace-nowrap shrink-0 bg-white hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-dashed border-emerald-400 hover:border-emerald-500 shadow-2xs"
                title="Add another nursing care plan for this inpatient"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Care Plan</span>
              </button>

              <button
                id="nav-tab-split"
                type="button"
                onClick={() => setActiveTab('split')}
                className={`hidden lg:flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition-all duration-150 whitespace-nowrap shrink-0 ${
                  activeTab === 'split'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-white/80 hover:text-amber-700'
                }`}
                title="View all Care Plans side-by-side"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>All Plans ({carePlans.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* View Section 1: Demographics */}
        {activeTab === 'demographics' && (
          <div className="space-y-6">
            <PatientDemographicsForm
              patient={patient}
              onChange={setPatient}
              onReset={handleClearDemographics}
            />

            <div className="flex justify-end items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('plan-1')}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2 whitespace-nowrap"
              >
                <span>Proceed to Care Plan #1 Editor</span>
                <span className="font-mono">→</span>
              </button>
            </div>
          </div>
        )}

        {/* View Section 1.5: Bedside & Door Card Sheet (A4 Landscape Layout) */}
        {activeTab === 'bedside-sheet' && (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="bg-gradient-to-r from-teal-700 via-emerald-700 to-cyan-700 text-white p-5 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-base font-extrabold text-white tracking-tight">
                    A4 Landscape Bedside, Door & Kardex Identification Sheet
                  </span>
                  <span className="text-xs text-emerald-100 font-medium tabular-nums">
                    · Exact hospital sizes (9×7 cm & 1.8×6.7 cm)
                  </span>
                </div>
                <p className="text-xs text-teal-100/90 mt-1">
                  Single A4 landscape sheet (27×14 cm grid) containing 4 card types ready to cut: Bedside Cards, Doctor Door Signs, File Attached Kardex Cards, and Vertical Specimen/Wristband ID Tags.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDirectPrintBedside}
                  className="px-4 py-2.5 bg-white hover:bg-emerald-50 text-teal-800 font-extrabold text-xs rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  <Printer className="w-4 h-4 text-teal-600" />
                  <span>Print Bedside Sheet</span>
                </button>
              </div>
            </div>

            {/* Specifications Summary Strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-gradient-to-br from-sky-50 to-white p-4 rounded-xl border border-sky-200/80 shadow-xs">
                <div className="flex items-center justify-between font-extrabold text-sky-950 mb-1.5">
                  <span>1. Bedside Cards</span>
                  <span className="text-sky-700 font-mono tabular-nums font-bold text-xs">9 × 7 cm</span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  <strong className="text-sky-900">Name & Caring Dr:</strong> Top-left patient bedhead card and top-middle / bottom-left doctor door cards.
                </p>
              </div>

              <div className="bg-gradient-to-br from-violet-50 to-white p-4 rounded-xl border border-violet-200/80 shadow-xs">
                <div className="flex items-center justify-between font-extrabold text-violet-950 mb-1.5">
                  <span>2. File Attached Cards</span>
                  <span className="text-violet-700 font-mono tabular-nums font-bold text-xs">9 × 7 cm</span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  <strong className="text-violet-900">Full 9-Field Kardex:</strong> Top-right & bottom-right inpatient file cards with admission, ward, bed, CPR & allergy.
                </p>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-white p-4 rounded-xl border border-emerald-200/80 shadow-xs">
                <div className="flex items-center justify-between font-extrabold text-emerald-950 mb-1.5">
                  <span>3. Vertical ID Tags</span>
                  <span className="text-emerald-700 font-mono tabular-nums font-bold text-xs">1.8 × 6.7 cm</span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  <strong className="text-emerald-900">Tube & Wristband Strips:</strong> 2 rotated vertical tags (Tag #1 with bed no., Tag #2 with blank bed space).
                </p>
              </div>
            </div>

            {/* Rendered Bedside Sheet */}
            <div className="w-full flex flex-col items-center">
              <ResponsiveBedsideSheetView
                patient={patient}
                showDimensionBadges={showBedsideDimensions}
                onToggleDimensions={() => setShowBedsideDimensions(!showBedsideDimensions)}
              />
            </div>

            {/* Bottom Nav */}
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => setActiveTab('demographics')}
                className="px-4 py-2.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-xl shadow-xs transition-all whitespace-nowrap"
              >
                ← Edit Inpatient Demographic Fields
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('plan-1')}
                className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 whitespace-nowrap"
              >
                <span>Go to Care Plan #1</span>
                <span className="font-mono">→</span>
              </button>
            </div>
          </div>
        )}

        {/* View Section 2+: Dynamic Individual Care Plan Editor */}
        {activeCarePlan && (
          <div className="space-y-6">
            <CarePlanEditor
              plan={activeCarePlan}
              planNumber={activePlanIndex + 1}
              totalPlans={carePlans.length}
              onChange={(updated) => handleUpdateCarePlan(activePlanIndex, updated)}
              onOpenNandaSearch={() => handleOpenNandaSearch(activePlanIndex)}
              onMoveUp={activePlanIndex > 0 ? () => handleMoveCarePlan(activePlanIndex, -1) : undefined}
              onMoveDown={
                activePlanIndex < carePlans.length - 1
                  ? () => handleMoveCarePlan(activePlanIndex, 1)
                  : undefined
              }
              onClearPlan={() => handleClearPlan(activePlanIndex)}
              onRemovePlan={carePlans.length > 1 ? () => handleRemoveCarePlan(activePlanIndex) : undefined}
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              {activePlanIndex === 0 ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('demographics')}
                  className="px-4 py-2.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-xl shadow-xs transition-all whitespace-nowrap"
                >
                  ← Edit Inpatient Label Details
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab(`plan-${activePlanIndex}`)}
                  className="px-4 py-2.5 text-xs font-bold text-sky-700 hover:text-sky-900 bg-white hover:bg-sky-50 border border-sky-200 rounded-xl shadow-xs transition-all whitespace-nowrap"
                >
                  ← Back to Care Plan #{activePlanIndex}
                </button>
              )}

              <div className="flex flex-wrap items-center gap-2.5">
                {activePlanIndex < carePlans.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab(`plan-${activePlanIndex + 2}`)}
                    className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 whitespace-nowrap"
                  >
                    <span>Proceed to Care Plan #{activePlanIndex + 2}</span>
                    <span className="font-mono">→</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleAddCarePlan}
                      className="px-4 py-2.5 bg-white hover:bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl border-2 border-dashed border-emerald-400 hover:border-emerald-500 shadow-xs transition-all flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Care Plan #{carePlans.length + 1}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPrintDocType('careplans');
                        setPrintPreviewOpen(true);
                      }}
                      className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 whitespace-nowrap"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Open Printable Care Plans ({carePlans.length})</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* View Section: All Care Plans Grid View (Large screens) */}
        {activeTab === 'split' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-700 via-blue-700 to-teal-600 text-white px-5 py-4 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm sm:text-base font-extrabold tracking-tight">
                  All Active Nursing Care Plans ({carePlans.length})
                </h2>
                <p className="text-xs text-sky-100/85">
                  Compare, reorder, edit, or add unlimited NANDA-I care plans side-by-side
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddCarePlan}
                className="px-4 py-2 bg-white hover:bg-emerald-50 text-teal-800 font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap"
              >
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>Add Care Plan #{carePlans.length + 1}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {carePlans.map((plan, idx) => (
                <CarePlanEditor
                  key={plan.id}
                  plan={plan}
                  planNumber={idx + 1}
                  totalPlans={carePlans.length}
                  onChange={(updated) => handleUpdateCarePlan(idx, updated)}
                  onOpenNandaSearch={() => handleOpenNandaSearch(idx)}
                  onMoveUp={idx > 0 ? () => handleMoveCarePlan(idx, -1) : undefined}
                  onMoveDown={idx < carePlans.length - 1 ? () => handleMoveCarePlan(idx, 1) : undefined}
                  onClearPlan={() => handleClearPlan(idx)}
                  onRemovePlan={carePlans.length > 1 ? () => handleRemoveCarePlan(idx) : undefined}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <NandaSearchModal
        isOpen={nandaModalOpen}
        onClose={() => setNandaModalOpen(false)}
        onSelectNanda={handleApplyNanda}
        currentDiagnosis={carePlans[nandaTargetPlanIndex]?.diagnosis || ''}
      />

      <PrintPreviewModal
        isOpen={printPreviewOpen}
        onClose={() => setPrintPreviewOpen(false)}
        patient={patient}
        carePlans={carePlans}
        printScope={printScope}
        onPrintScopeChange={setPrintScope}
        activeDocType={printDocType}
        onDocTypeChange={setPrintDocType}
      />

      <SavedRecordsModal
        isOpen={recordsModalOpen}
        onClose={() => setRecordsModalOpen(false)}
        savedRecords={savedRecords}
        currentPatientIdNumber={patient.idNumber}
        onLoadRecord={handleLoadRecord}
        onDeleteRecord={handleDeleteRecord}
        onImportRecords={handleImportRecords}
        onResetPresets={handleResetPresets}
        onNewPatient={handleNewRecord}
      />

      {/* DEDICATED PRINT-ONLY CONTAINER */}
      {/* This is permanently rendered for browser print (@media print) to ensure crisp printout matching exact layouts and sizes */}
      <div className="hidden print:block print-only-container">
        {(printDocType === 'bedside' || printDocType === 'both_types') && (
          <div className={printDocType === 'both_types' ? 'printable-sheet page-break-after' : 'printable-landscape-sheet'}>
            <PrintableBedsideCardSheet patient={patient} isPrintOnly={true} />
          </div>
        )}
        {(printDocType === 'careplans' || printDocType === 'both_types') &&
          selectedPlansForPrint.map(({ plan, planNumber }, idx) => (
            <PrintableCarePlan
              key={plan.id}
              patient={patient}
              carePlan={plan}
              planNumber={planNumber}
              totalPlans={carePlans.length}
              pageNumber={idx + 1}
              totalPages={selectedPlansForPrint.length}
            />
          ))}
      </div>
    </div>
  );
}

