import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { COMPANIES } from '../types';
import { client } from '../lib/api';
import {
  Plus, Edit2, Trash2, X, Save, FileText, CheckCircle,
  AlertCircle, ClipboardList, Award, BarChart3, Eye,
  ChevronDown, ChevronUp, Clock, Users, Target, Building2, RefreshCw
} from 'lucide-react';

// Types
interface TestQuestion {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
}

interface Test {
  id: any; // number from DB
  title: string;
  description: string;
  questions: TestQuestion[];
  createdBy: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  duration: number; // minutes
  company?: string;
  department?: string; // 'GSF' | 'LBT' | 'travelo' | 'all'
}

interface TestResult {
  id: any; // number from DB
  testId: any;
  testTitle: string;
  userId: number;
  userName: string;
  userRole: string;
  answers: Record<string, string>; // questionId -> selected option
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  percentage: number;
  submittedAt: string;
  company?: string;
}

// API helpers for tests
async function fetchTestsFromAPI(): Promise<Test[]> {
  try {
    const res = await client.api.fetch('/api/public/tests');
    const json = await res.json() as any;
    const data = json.data || [];
    return data.map((t: any) => ({
      ...t,
      questions: typeof t.questions === 'string' ? JSON.parse(t.questions || '[]') : (t.questions || []),
      isActive: t.isActive === 1 || t.isActive === true,
      createdAt: t.created || t.createdAt || '',
      updatedAt: t.modified || t.updatedAt || '',
    }));
  } catch (err) {
    console.error('[TESTS] Fetch error:', err);
    return [];
  }
}

async function fetchResultsFromAPI(): Promise<TestResult[]> {
  try {
    const res = await client.api.fetch('/api/public/test-results');
    const json = await res.json() as any;
    const data = json.data || [];
    return data.map((r: any) => ({
      ...r,
      answers: typeof r.answers === 'string' ? JSON.parse(r.answers || '{}') : (r.answers || {}),
    }));
  } catch (err) {
    console.error('[TESTS] Fetch results error:', err);
    return [];
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

// Admin/Manager roles that can create tests and view results
const CREATOR_ROLES = ['admin', 'super admin', 'superuser', 'hr (human resource)', 'hr', 'it (information tech)', 'it', 'manager', 'operation manager', 'supervisor'];

// Roles that can view results but not create
const VIEWER_ROLES = ['admin', 'super admin', 'superuser', 'hr (human resource)', 'hr', 'it (information tech)', 'it', 'manager', 'operation manager', 'supervisor'];

export default function Tests() {
  const { currentUser } = useAuthStore();
  const roleLower = (currentUser?.role || '').toLowerCase();
  const isCreator = CREATOR_ROLES.includes(roleLower);
  const isViewer = VIEWER_ROLES.includes(roleLower);

  const [tests, setTests] = useState<Test[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [activeTab, setActiveTab] = useState<'tests' | 'results' | 'create'>('tests');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [takingTest, setTakingTest] = useState<Test | null>(null);
  const [showResult, setShowResult] = useState<TestResult | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch data from backend API
  const loadData = useCallback(async (showLoader = false) => {
    if (showLoader) setIsLoading(true);
    try {
      const [testsData, resultsData] = await Promise.all([
        fetchTestsFromAPI(),
        fetchResultsFromAPI(),
      ]);
      setTests(testsData);
      setResults(resultsData);
    } catch (err) {
      console.error('[TESTS] Load data error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load + polling every 15 seconds for live updates
  useEffect(() => {
    loadData(true);
    pollingRef.current = setInterval(() => loadData(false), 15000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [loadData]);

  // Also refresh when tab changes
  useEffect(() => {
    loadData(false);
  }, [activeTab, loadData]);

  const handleDeleteTest = async (testId: string) => {
    try {
      await client.api.fetch(`/api/public/tests/${testId}`, { method: 'DELETE' });
      await loadData(false);
    } catch (err) {
      console.error('[TESTS] Delete error:', err);
    }
    setDeleteConfirm(null);
  };

  const handleTestCreated = async (test: Test) => {
    try {
      if (editingTest) {
        // Update existing test
        await client.api.fetch(`/api/public/tests/${test.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: test.title,
            description: test.description,
            questions: test.questions,
            isActive: test.isActive,
            duration: test.duration,
            company: test.company,
            department: test.department,
            createdBy: test.createdBy,
            createdByRole: test.createdByRole,
          }),
        });
      } else {
        // Create new test
        await client.api.fetch('/api/public/tests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: test.title,
            description: test.description,
            questions: test.questions,
            isActive: test.isActive,
            duration: test.duration,
            company: test.company,
            department: test.department,
            createdBy: test.createdBy,
            createdByRole: test.createdByRole,
          }),
        });
      }
      await loadData(false);
    } catch (err) {
      console.error('[TESTS] Save error:', err);
    }
    setShowCreateModal(false);
    setEditingTest(null);
  };

  const handleTestSubmitted = async (result: TestResult) => {
    try {
      await client.api.fetch('/api/public/test-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: result.testId,
          testTitle: result.testTitle,
          userId: result.userId,
          userName: result.userName,
          userRole: result.userRole,
          answers: result.answers,
          score: result.score,
          totalQuestions: result.totalQuestions,
          correctAnswers: result.correctAnswers,
          wrongAnswers: result.wrongAnswers,
          unanswered: result.unanswered,
          percentage: result.percentage,
          company: result.company,
          submittedAt: result.submittedAt,
        }),
      });
      await loadData(false);
    } catch (err) {
      console.error('[TESTS] Submit result error:', err);
    }
    setTakingTest(null);
    setShowResult(result);
  };

  // Check if agent already took a test
  const hasAlreadyTaken = (testId: any) => {
    return results.some(r => String(r.testId) === String(testId) && r.userId === currentUser?.id);
  };

  const getMyResult = (testId: any) => {
    return results.find(r => String(r.testId) === String(testId) && r.userId === currentUser?.id);
  };

  // Filter tests for agents based on department
  const getFilteredTests = () => {
    if (isCreator) return tests;
    const userCompany = (currentUser?.company || '').toLowerCase();
    let companyId = 'GSF';
    if (userCompany.includes('explore') || userCompany.includes('LBT')) companyId = 'LBT';
    else if (userCompany.includes('travelo')) companyId = 'travelo';
    
    return tests.filter(t => {
      if (!t.department || t.department === 'all') return true;
      return t.department === companyId;
    });
  };

  const filteredTests = getFilteredTests();

  // Loading state
  if (isLoading && tests.length === 0) {
    return (
      <div className="p-4 md:p-6 animate-fadeIn">
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <RefreshCw className="w-8 h-8 animate-spin mb-4" />
          <p className="text-sm">Loading tests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Tests & Assessments</h1>
            <p className="text-sm text-gray-500">
              {isCreator ? 'Create and manage assessments for your team' : 'Take assessments and view your results'}
            </p>
          </div>
        </div>

        {isCreator && (
          <button
            onClick={() => { setEditingTest(null); setShowCreateModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-purple-200 hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Create Test
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 max-w-fit">
        <button
          onClick={() => setActiveTab('tests')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === 'tests' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {isCreator ? 'All Tests' : 'Available Tests'}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === 'results' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <span className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            {isViewer ? 'All Results' : 'My Results'}
          </span>
        </button>
      </div>

      {/* Tests List */}
      {activeTab === 'tests' && (
        <TestsList
          tests={filteredTests}
          isCreator={isCreator}
          hasAlreadyTaken={hasAlreadyTaken}
          getMyResult={getMyResult}
          onTakeTest={setTakingTest}
          onEditTest={(test) => { setEditingTest(test); setShowCreateModal(true); }}
          onDeleteTest={(id) => setDeleteConfirm(id)}
          onViewResult={setShowResult}
          onRefresh={() => loadData(false)}
        />
      )}

      {/* Results */}
      {activeTab === 'results' && (
        <ResultsList
          results={isViewer ? results : results.filter(r => r.userId === currentUser?.id)}
          isViewer={isViewer}
          tests={tests}
          onRefresh={() => loadData(false)}
        />
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <CreateTestModal
          test={editingTest}
          currentUser={currentUser}
          onSave={handleTestCreated}
          onClose={() => { setShowCreateModal(false); setEditingTest(null); }}
        />
      )}

      {/* Take Test Modal */}
      {takingTest && (
        <TakeTestModal
          test={takingTest}
          currentUser={currentUser}
          onSubmit={handleTestSubmitted}
          onClose={() => setTakingTest(null)}
        />
      )}

      {/* Result Modal */}
      {showResult && (
        <ResultModal
          result={showResult}
          test={tests.find(t => String(t.id) === String(showResult.testId))}
          onClose={() => setShowResult(null)}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl animate-scaleIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Delete Test?</h3>
            </div>
            <p className="text-gray-600 mb-6">This will permanently delete this test and all associated results. This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTest(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== TESTS LIST ====================
function TestsList({
  tests, isCreator, hasAlreadyTaken, getMyResult, onTakeTest, onEditTest, onDeleteTest, onViewResult, onRefresh
}: {
  tests: Test[];
  isCreator: boolean;
  hasAlreadyTaken: (id: any) => boolean;
  getMyResult: (id: any) => TestResult | undefined;
  onTakeTest: (test: Test) => void;
  onEditTest: (test: Test) => void;
  onDeleteTest: (id: string) => void;
  onViewResult: (result: TestResult) => void;
  onRefresh: () => void;
}) {
  if (tests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <ClipboardList className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg font-medium">No tests available</p>
        <p className="text-sm">{isCreator ? 'Create your first test to get started' : 'Check back later for new assessments'}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tests.filter(t => isCreator || t.isActive).map((test, idx) => {
        const taken = hasAlreadyTaken(test.id);
        const myResult = getMyResult(test.id);
        return (
          <div
            key={test.id}
            className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-purple-200 transition-all duration-300 overflow-hidden"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            {/* Card header */}
            <div className="p-5 pb-3">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 text-lg leading-tight group-hover:text-purple-700 transition-colors">
                    {test.title}
                  </h3>
                  {test.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{test.description}</p>
                  )}
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${test.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {test.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Target className="w-3.5 h-3.5" />
                  {test.questions.length} Questions
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {test.duration} min
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {test.createdBy}
                </span>
                {test.department && test.department !== 'all' && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-medium">
                    <Building2 className="w-3 h-3" />
                    {COMPANIES.find(c => c.id === test.department)?.short || test.department}
                  </span>
                )}
              </div>
            </div>

            {/* Card footer */}
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {new Date(test.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
              <div className="flex gap-2">
                {isCreator && (
                  <>
                    <button
                      onClick={() => onEditTest(test)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteTest(test.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
                {!isCreator && taken && myResult && (
                  <button
                    onClick={() => onViewResult(myResult)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    View Result ({myResult.score}/{myResult.totalQuestions})
                  </button>
                )}
                {!isCreator && !taken && test.isActive && (
                  <button
                    onClick={() => onTakeTest(test)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:shadow-md transition-all"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Take Test
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ==================== CREATE/EDIT TEST MODAL ====================
function CreateTestModal({
  test, currentUser, onSave, onClose
}: {
  test: Test | null;
  currentUser: any;
  onSave: (test: Test) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(test?.title || '');
  const [description, setDescription] = useState(test?.description || '');
  const [duration, setDuration] = useState(test?.duration || 30);
  const [isActive, setIsActive] = useState(test?.isActive ?? true);
  const [department, setDepartment] = useState(test?.department || 'all');
  const [questions, setQuestions] = useState<TestQuestion[]>(
    test?.questions || [createEmptyQuestion()]
  );
  const [errors, setErrors] = useState<string[]>([]);

  function createEmptyQuestion(): TestQuestion {
    return {
      id: generateId(),
      question: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
    };
  }

  const addQuestion = () => {
    setQuestions([...questions, createEmptyQuestion()]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, field: keyof TestQuestion, value: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const moveQuestion = (idx: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= questions.length) return;
    const updated = [...questions];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    setQuestions(updated);
  };

  const validateAndSave = () => {
    const errs: string[] = [];
    if (!title.trim()) errs.push('Test title is required');
    if (questions.length === 0) errs.push('Add at least one question');
    questions.forEach((q, i) => {
      if (!q.question.trim()) errs.push(`Question ${i + 1}: Question text is required`);
      if (!q.optionA.trim()) errs.push(`Question ${i + 1}: Option A is required`);
      if (!q.optionB.trim()) errs.push(`Question ${i + 1}: Option B is required`);
      if (!q.optionC.trim()) errs.push(`Question ${i + 1}: Option C is required`);
      if (!q.optionD.trim()) errs.push(`Question ${i + 1}: Option D is required`);
    });

    if (errs.length > 0) {
      setErrors(errs);
      return;
    }

    const now = new Date().toISOString();
    const savedTest: Test = {
      id: test?.id || generateId(),
      title: title.trim(),
      description: description.trim(),
      questions,
      createdBy: test?.createdBy || currentUser?.name || 'Admin',
      createdByRole: test?.createdByRole || currentUser?.role || 'Admin',
      createdAt: test?.createdAt || now,
      updatedAt: now,
      isActive,
      duration,
      company: currentUser?.company || 'Get Set Flight',
      department,
    };

    onSave(savedTest);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8 animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-3xl mx-4 shadow-2xl animate-slideUp">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 rounded-t-2xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              {test ? 'Edit Test' : 'Create New Test'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Errors */}
          {errors.length > 0 && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl animate-shake">
              {errors.map((e, i) => (
                <p key={i} className="text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {e}
                </p>
              ))}
            </div>
          )}

          {/* Test Info */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Test Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Travel Knowledge Assessment"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the test..."
                rows={2}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
                    min={1}
                    max={180}
                    className="w-24 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {[1, 2, 3, 5, 10, 15, 30, 60].map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setDuration(m)}
                        className={`px-2 py-1 text-xs font-medium rounded-lg transition-all ${
                          duration === m
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer px-4 py-3">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department / Company</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              >
                <option value="all">All Departments</option>
                {COMPANIES.map(c => (
                  <option key={c.id} value={c.id}>{c.short} — {c.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">Choose which department/company this test is for</p>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">Questions ({questions.length})</h3>
              <button
                onClick={addQuestion}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Question
              </button>
            </div>

            {questions.map((q, idx) => (
              <div key={q.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50 hover:bg-white transition-colors group">
                <div className="flex items-start justify-between mb-3">
                  <span className="flex items-center gap-2">
                    <span className="w-7 h-7 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-500">Question {idx + 1} (1 Mark)</span>
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {idx > 0 && (
                      <button onClick={() => moveQuestion(idx, 'up')} className="p-1 hover:bg-gray-200 rounded" title="Move up">
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                      </button>
                    )}
                    {idx < questions.length - 1 && (
                      <button onClick={() => moveQuestion(idx, 'down')} className="p-1 hover:bg-gray-200 rounded" title="Move down">
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      </button>
                    )}
                    {questions.length > 1 && (
                      <button onClick={() => removeQuestion(q.id)} className="p-1 hover:bg-red-100 rounded" title="Remove">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    )}
                  </div>
                </div>

                <input
                  type="text"
                  value={q.question}
                  onChange={(e) => updateQuestion(q.id, 'question', e.target.value)}
                  placeholder="Enter your question..."
                  className="w-full px-4 py-2.5 mb-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                  {(['A', 'B', 'C', 'D'] as const).map(opt => (
                    <div key={opt} className="flex items-center gap-2">
                      <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${
                        q.correctAnswer === opt
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {opt}
                      </span>
                      <input
                        type="text"
                        value={q[`option${opt}` as keyof TestQuestion] as string}
                        onChange={(e) => updateQuestion(q.id, `option${opt}` as keyof TestQuestion, e.target.value)}
                        placeholder={`Option ${opt}`}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-sm"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 font-medium">Correct Answer:</span>
                  <div className="flex gap-1.5">
                    {(['A', 'B', 'C', 'D'] as const).map(opt => (
                      <button
                        key={opt}
                        onClick={() => updateQuestion(q.id, 'correctAnswer', opt)}
                        className={`w-8 h-8 rounded-full text-xs font-bold transition-all duration-200 ${
                          q.correctAnswer === opt
                            ? 'bg-green-500 text-white scale-110 shadow-lg shadow-green-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 rounded-b-2xl px-6 py-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Total: {questions.length} question{questions.length !== 1 ? 's' : ''} • {questions.length} mark{questions.length !== 1 ? 's' : ''}
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={validateAndSave}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
            >
              <Save className="w-4 h-4" />
              {test ? 'Update Test' : 'Save Test'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== TAKE TEST MODAL ====================
function TakeTestModal({
  test, currentUser, onSubmit, onClose
}: {
  test: Test;
  currentUser: any;
  onSubmit: (result: TestResult) => void;
  onClose: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(test.duration * 60); // in seconds
  const [showConfirm, setShowConfirm] = useState(false);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          // Auto-submit on time up
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectAnswer = (questionId: string, option: string) => {
    setAnswers({ ...answers, [questionId]: option });
  };

  const handleSubmit = useCallback(() => {
    let correct = 0;
    let wrong = 0;
    let unanswered = 0;

    test.questions.forEach(q => {
      const userAnswer = answers[q.id];
      if (!userAnswer) {
        unanswered++;
      } else if (userAnswer === q.correctAnswer) {
        correct++;
      } else {
        wrong++;
      }
    });

    // Score: +1 for correct, -1 for wrong, 0 for unanswered
    const score = Math.max(0, correct - wrong);
    const percentage = Math.round((score / test.questions.length) * 100);

    const result: TestResult = {
      id: generateId(),
      testId: test.id,
      testTitle: test.title,
      userId: currentUser?.id || 0,
      userName: currentUser?.name || 'Unknown',
      userRole: currentUser?.role || 'Agent',
      answers,
      score,
      totalQuestions: test.questions.length,
      correctAnswers: correct,
      wrongAnswers: wrong,
      unanswered,
      percentage,
      submittedAt: new Date().toISOString(),
      company: currentUser?.company || 'Get Set Flight',
    };

    onSubmit(result);
  }, [answers, test, currentUser, onSubmit]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(answers).length;
  const currentQuestion = test.questions[currentQ];
  const isTimeWarning = timeLeft < 60 && test.duration > 1 ? true : timeLeft < 30;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 shadow-2xl animate-scaleIn max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-2xl">
          <div>
            <h2 className="font-bold text-gray-800 text-lg">{test.title}</h2>
            <p className="text-xs text-gray-500">Question {currentQ + 1} of {test.questions.length}</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-mono font-bold text-sm ${
            isTimeWarning ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-white text-gray-700 shadow-sm'
          }`}>
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Question Navigation */}
        <div className="px-6 py-3 border-b border-gray-50 bg-white">
          <div className="flex flex-wrap gap-1.5">
            {test.questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentQ(i)}
                className={`w-8 h-8 rounded-full text-xs font-bold transition-all duration-200 ${
                  i === currentQ
                    ? 'bg-purple-600 text-white scale-110 shadow-md'
                    : answers[q.id]
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Question Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {currentQuestion && (
            <div className="animate-fadeIn" key={currentQuestion.id}>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {currentQ + 1}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">1 Mark • Negative marking: -1 for wrong answer</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 ml-10">{currentQuestion.question}</h3>
              </div>

              <div className="space-y-3 ml-10">
                {(['A', 'B', 'C', 'D'] as const).map(opt => {
                  const isSelected = answers[currentQuestion.id] === opt;
                  const optionText = currentQuestion[`option${opt}` as keyof TestQuestion] as string;
                  return (
                    <button
                      key={opt}
                      onClick={() => handleSelectAnswer(currentQuestion.id, opt)}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                        isSelected
                          ? 'border-purple-500 bg-purple-50 shadow-md shadow-purple-100'
                          : 'border-gray-200 hover:border-purple-300 hover:bg-purple-25'
                      }`}
                    >
                      <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-all ${
                        isSelected
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {opt}
                      </span>
                      <span className={`flex-1 font-medium ${isSelected ? 'text-purple-800' : 'text-gray-700'}`}>
                        {optionText}
                      </span>
                      {isSelected && (
                        <CheckCircle className="w-5 h-5 text-purple-600 animate-scaleIn" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50 rounded-b-2xl">
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
              disabled={currentQ === 0}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentQ(Math.min(test.questions.length - 1, currentQ + 1))}
              disabled={currentQ === test.questions.length - 1}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">
              {answeredCount}/{test.questions.length} answered
            </span>
            <button
              onClick={() => setShowConfirm(true)}
              className="px-5 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all"
            >
              Submit Test
            </button>
          </div>
        </div>

        {/* Submit Confirmation */}
        {showConfirm && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 rounded-2xl">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl animate-scaleIn">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Submit Test?</h3>
              <div className="text-sm text-gray-600 space-y-1 mb-4">
                <p>Answered: <span className="font-bold text-green-600">{answeredCount}</span></p>
                <p>Unanswered: <span className="font-bold text-orange-600">{test.questions.length - answeredCount}</span></p>
                <p className="text-xs text-red-500 mt-2">⚠️ Wrong answers will get -1 mark (negative marking)</p>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Review
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Confirm Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== RESULT MODAL ====================
function ResultModal({
  result, test, onClose
}: {
  result: TestResult;
  test: Test | undefined;
  onClose: () => void;
}) {
  const isPassed = result.percentage >= 40;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl animate-scaleIn overflow-hidden">
        {/* Result Header */}
        <div className={`p-6 text-center ${isPassed ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-orange-600'}`}>
          <div className="w-16 h-16 mx-auto mb-3 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            {isPassed ? (
              <Award className="w-8 h-8 text-white" />
            ) : (
              <AlertCircle className="w-8 h-8 text-white" />
            )}
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">
            {isPassed ? 'Congratulations!' : 'Better Luck Next Time'}
          </h3>
          <p className="text-white/80 text-sm">{result.testTitle}</p>
        </div>

        {/* Score Details */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="text-5xl font-bold text-gray-800 mb-1">{result.score}<span className="text-xl text-gray-400">/{result.totalQuestions}</span></div>
            <p className="text-sm text-gray-500">Score ({result.percentage}%)</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="text-center p-3 bg-green-50 rounded-xl">
              <div className="text-lg font-bold text-green-700">{result.correctAnswers}</div>
              <div className="text-xs text-green-600">Correct</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-xl">
              <div className="text-lg font-bold text-red-700">{result.wrongAnswers}</div>
              <div className="text-xs text-red-600">Wrong (-{result.wrongAnswers})</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <div className="text-lg font-bold text-gray-700">{result.unanswered}</div>
              <div className="text-xs text-gray-600">Skipped</div>
            </div>
          </div>

          {/* Answer breakdown */}
          {test && (
            <div className="max-h-48 overflow-y-auto space-y-2 mb-4">
              {test.questions.map((q, idx) => {
                const userAns = result.answers[q.id];
                const isCorrect = userAns === q.correctAnswer;
                const isSkipped = !userAns;
                return (
                  <div key={q.id} className={`flex items-center gap-3 p-2 rounded-lg text-sm ${
                    isSkipped ? 'bg-gray-50' : isCorrect ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    <span className="font-bold text-gray-500 w-6">Q{idx + 1}</span>
                    <span className="flex-1 text-gray-700 truncate">{q.question}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      isSkipped ? 'bg-gray-200 text-gray-600' : isCorrect ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'
                    }`}>
                      {isSkipped ? '—' : userAns} {!isSkipped && !isCorrect && `→ ${q.correctAnswer}`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="text-xs text-gray-400 text-center mb-4">
            Submitted: {new Date(result.submittedAt).toLocaleString('en-IN')}
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== RESULTS LIST ====================
function ResultsList({
  results, isViewer, tests, onRefresh
}: {
  results: TestResult[];
  isViewer: boolean;
  tests: Test[];
  onRefresh: () => void;
}) {
  const [filterTest, setFilterTest] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [expandedResult, setExpandedResult] = useState<string | null>(null);

  const filteredResults = results.filter(r => {
    if (filterTest && String(r.testId) !== String(filterTest)) return false;
    if (filterCompany && r.company !== filterCompany) return false;
    return true;
  });

  const sortedResults = [...filteredResults].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <BarChart3 className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg font-medium">No results yet</p>
        <p className="text-sm">{isViewer ? 'No one has taken any test yet' : 'Take a test to see your results here'}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filter */}
      {isViewer && tests.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-gray-600">Filter by Test:</label>
          <select
            value={filterTest}
            onChange={(e) => setFilterTest(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All Tests</option>
            {tests.map(t => (
              <option key={t.id} value={String(t.id)}>{t.title}</option>
            ))}
          </select>
          <label className="text-sm font-medium text-gray-600 ml-2">Department:</label>
          <select
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All</option>
            {COMPANIES.map(c => (
              <option key={c.id} value={c.name}>{c.short}</option>
            ))}
          </select>
          <span className="text-xs text-gray-400">{sortedResults.length} result{sortedResults.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Results Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-purple-50 to-indigo-50">
                <th className="px-4 py-3 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">#</th>
                {isViewer && <th className="px-4 py-3 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">User</th>}
                <th className="px-4 py-3 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">Test</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-purple-700 uppercase tracking-wider">Score</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-purple-700 uppercase tracking-wider">Correct</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-purple-700 uppercase tracking-wider">Wrong</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-purple-700 uppercase tracking-wider">%</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-purple-700 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sortedResults.map((r, idx) => (
                <tr key={r.id} className="hover:bg-purple-25 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                  {isViewer && (
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-800">{r.userName}</div>
                      <div className="text-xs text-gray-400">{r.userRole}{r.company ? ` • ${r.company}` : ''}</div>
                    </td>
                  )}
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">{r.testTitle}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold text-gray-800">{r.score}</span>
                    <span className="text-xs text-gray-400">/{r.totalQuestions}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-green-600 font-medium">{r.correctAnswers}</td>
                  <td className="px-4 py-3 text-center text-sm text-red-600 font-medium">{r.wrongAnswers}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      r.percentage >= 70 ? 'bg-green-100 text-green-700' :
                      r.percentage >= 40 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {r.percentage}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(r.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setExpandedResult(expandedResult === r.id ? null : r.id)}
                      className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expanded Result Detail */}
      {expandedResult && (() => {
        const r = sortedResults.find(r => r.id === expandedResult);
        const t = r ? tests.find(t => String(t.id) === String(r.testId)) : null;
        if (!r || !t) return null;
        return (
          <div className="mt-4 bg-white rounded-2xl border border-purple-100 p-5 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-gray-800">{r.userName} — {r.testTitle}</h4>
              <button onClick={() => setExpandedResult(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {t.questions.map((q, idx) => {
                const userAns = r.answers[q.id];
                const isCorrect = userAns === q.correctAnswer;
                const isSkipped = !userAns;
                return (
                  <div key={q.id} className={`p-3 rounded-lg border ${
                    isSkipped ? 'border-gray-200 bg-gray-50' : isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}>
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-bold text-gray-500 mt-0.5">Q{idx + 1}.</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{q.question}</p>
                        <p className="text-xs mt-1">
                          {isSkipped ? (
                            <span className="text-gray-500">Not answered • Correct: <strong>{q.correctAnswer}</strong></span>
                          ) : isCorrect ? (
                            <span className="text-green-700">✓ Answered: <strong>{userAns}</strong> (+1 mark)</span>
                          ) : (
                            <span className="text-red-700">✗ Answered: <strong>{userAns}</strong> • Correct: <strong>{q.correctAnswer}</strong> (-1 mark)</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
