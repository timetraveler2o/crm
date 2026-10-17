import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { useCrmStore } from '../store/crmStore';
import { COMPANIES, ROLE_NAMES } from '../types';
import { client } from '../lib/api';
import { jsPDF } from 'jspdf';
import {
  FileText, Plus, Download, Mail, RefreshCw, Users, Calendar,
  ChevronDown, Search, Bell, BarChart3, Clock, CheckCircle2,
  XCircle, Eye, Trash2, Send, Filter, Building2, ArrowLeft,
  Edit3, Save, Volume2, Award, Briefcase, X
} from 'lucide-react';

// ===== TYPES =====
interface EarningItem { label: string; amount: number; }
interface DeductionItem { label: string; amount: number; }
interface PayslipData {
  id: string;
  company: string;
  companyLogo: string;
  employeeName: string;
  employeeId: string;
  designation: string;
  department: string;
  bankName: string;
  bankAccountNo: string;
  joiningDate: string;
  payPeriod: string;
  payDate: string;
  totalWorkingDays: number;
  paidDays: number;
  lopDays: number;
  leaves: number;
  paidLeaves: number;
  earnings: EarningItem[];
  deductions: DeductionItem[];
  grossEarnings: number;
  totalDeductions: number;
  netPayable: number;
  status: 'Generated' | 'Emailed' | 'Downloaded' | 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
  createdBy: string;
  requestedBy?: string;
  requestMonth?: string;
}

interface PayslipRequest {
  id: string;
  employeeName: string;
  employeeId: string;
  company: string;
  requestedMonth: string;
  requestDate: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Generated';
  note?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

interface SalaryTemplate {
  id: string;
  name: string;
  position: string;
  earnings: EarningItem[];
  deductions: DeductionItem[];
}

interface ExperienceLetter {
  id: string;
  employeeName: string;
  employeeId: string;
  designation: string;
  department: string;
  joiningDate: string;
  lastWorkingDate: string;
  company: string;
  createdAt: string;
  createdBy: string;
  content: string;
}

// ===== CONSTANTS =====
const rawCompanyData: Record<string, { name: string; logo: string; short: string; address: string; fullName: string }> = {
  fdi: {
    name: 'Get Set Flight',
    fullName: 'Get Set Flight PRIVATE LIMITED',
    logo: '/gsf-logo.png',
    short: 'GSF',
    address: 'Plot No. 130, Sector 82, JLPL Industrial Area, Sahibzada Ajit Singh Nagar, Punjab 140306'
  },
  GSF: {
    name: 'Get Set Flight',
    fullName: 'Get Set Flight PRIVATE LIMITED',
    logo: '/gsf-logo.png',
    short: 'GSF',
    address: 'Plot No. 130, Sector 82, JLPL Industrial Area, Sahibzada Ajit Singh Nagar, Punjab 140306'
  },
  'Get Set Flight': {
    name: 'Get Set Flight',
    fullName: 'Get Set Flight PRIVATE LIMITED',
    logo: '/gsf-logo.png',
    short: 'GSF',
    address: 'Plot No. 130, Sector 82, JLPL Industrial Area, Sahibzada Ajit Singh Nagar, Punjab 140306'
  },
  emt: {
    name: 'Look Book Ticket',
    fullName: 'Look Book Ticket PRIVATE LIMITED',
    logo: '/lbt-logo.png',
    short: 'LBT',
    address: 'Plot No. 130, Sector 82, JLPL Industrial Area, Sahibzada Ajit Singh Nagar, Punjab 140306'
  },
  LBT: {
    name: 'Look Book Ticket',
    fullName: 'Look Book Ticket PRIVATE LIMITED',
    logo: '/lbt-logo.png',
    short: 'LBT',
    address: 'Plot No. 130, Sector 82, JLPL Industrial Area, Sahibzada Ajit Singh Nagar, Punjab 140306'
  },
  'Look Book Ticket': {
    name: 'Look Book Ticket',
    fullName: 'Look Book Ticket PRIVATE LIMITED',
    logo: '/lbt-logo.png',
    short: 'LBT',
    address: 'Plot No. 130, Sector 82, JLPL Industrial Area, Sahibzada Ajit Singh Nagar, Punjab 140306'
  },
  travelo: {
    name: 'Traveloboom',
    fullName: 'Traveloboom PRIVATE LIMITED',
    logo: '/tbm-logo.png',
    short: 'Travelo',
    address: 'Plot No. 130, Sector 82, JLPL Industrial Area, Sahibzada Ajit Singh Nagar, Punjab 140306'
  },
  Traveloboom: {
    name: 'Traveloboom',
    fullName: 'Traveloboom PRIVATE LIMITED',
    logo: '/tbm-logo.png',
    short: 'Travelo',
    address: 'Plot No. 130, Sector 82, JLPL Industrial Area, Sahibzada Ajit Singh Nagar, Punjab 140306'
  },
  TBM: {
    name: 'Traveloboom',
    fullName: 'Traveloboom PRIVATE LIMITED',
    logo: '/tbm-logo.png',
    short: 'Travelo',
    address: 'Plot No. 130, Sector 82, JLPL Industrial Area, Sahibzada Ajit Singh Nagar, Punjab 140306'
  }
};

const COMPANY_DATA: Record<string, { name: string; logo: string; short: string; address: string; fullName: string }> = new Proxy(rawCompanyData, {
  get: (target: any, prop: string) => {
    if (typeof prop === 'string') {
      const lower = prop.toLowerCase();
      if (lower.includes('look') || lower.includes('lbt') || lower.includes('emt')) return target.LBT;
      if (lower.includes('travelo') || lower.includes('tbm')) return target.Traveloboom;
      if (target[prop]) return target[prop];
    }
    return target.GSF;
  }
});

const POSITIONS = ['IT', 'HR', 'Admin', 'Sales Executive', 'Sr. Sales Executive', 'Supervisor', 'Operation Manager', 'Ticketing', 'Accountant', 'Manager', 'Sr. Manager', 'Team Lead'];

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const DEFAULT_EARNINGS: EarningItem[] = [
  { label: 'Basic', amount: 0 },
  { label: 'HRA', amount: 0 },
  { label: 'Special Allowance', amount: 0 },
  { label: 'Medical Allowance', amount: 0 },
  { label: 'Leave Encashment', amount: 0 },
  { label: 'Incentives', amount: 0 },
  { label: 'Reimbursements', amount: 0 },
];

const DEFAULT_DEDUCTIONS: DeductionItem[] = [
  { label: 'TDS', amount: 0 },
  { label: 'EPF', amount: 0 },
  { label: 'Professional Tax', amount: 200 },
  { label: 'Conveyance Charges', amount: 0 },
  { label: 'Advance', amount: 0 },
  { label: 'Loan', amount: 0 },
  { label: 'Recovery', amount: 0 },
];

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatINRShort(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function numberToWords(num: number): string {
  if (num === 0) return 'Zero';
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  function convert(n: number): string {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' ' + ones[n%10] : '');
    if (n < 1000) return ones[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' and ' + convert(n%100) : '');
    if (n < 100000) return convert(Math.floor(n/1000)) + ' Thousand' + (n%1000 ? ' ' + convert(n%1000) : '');
    if (n < 10000000) return convert(Math.floor(n/100000)) + ' Lakh' + (n%100000 ? ' ' + convert(n%100000) : '');
    return convert(Math.floor(n/10000000)) + ' Crore' + (n%10000000 ? ' ' + convert(n%10000000) : '');
  }
  return 'Rupees ' + convert(Math.round(num)) + ' Only';
}

function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function playNotificationSound(type: 'send' | 'download' | 'request') {
  try {
    const audio = new Audio(type === 'send' ? '/sounds/qc-send.wav' : type === 'download' ? '/sounds/qc-accepted.wav' : '/sounds/alert-ascending.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch {}
}

function getCompanyFromUserField(company?: string): string {
  if (!company) return 'GSF';
  const c = company.toLowerCase();
  if (c.includes('explore') || c.includes('LBT')) return 'LBT';
  if (c.includes('travelo')) return 'travelo';
  return 'GSF';
}

// ===== MAIN COMPONENT =====
export default function Payslip() {
  const { users, attendanceSheet, fetchData } = useCrmStore();
  useEffect(() => { fetchData?.(); }, []);
  const { currentUser, addNotification } = useAuthStore();
  const roleLower = (currentUser?.role || '').toLowerCase();
  const isAdmin = ['admin','super admin','operation manager','manager','hr (human resource)','hr','it (information tech)','it'].includes(roleLower);
  const isSupervisor = roleLower === 'supervisor';

  // ===== STATE =====
  const [activeTab, setActiveTab] = useState<'dashboard'|'generate'|'preview'|'requests'|'templates'|'reports'|'bulk'|'experience'>(isAdmin ? 'dashboard' : 'requests');
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [newRequestPopup, setNewRequestPopup] = useState<PayslipRequest|null>(null);
  const prevRequestCountRef = useRef(0);
  const [payslips, setPayslips] = useState<PayslipData[]>(() => {
    try { return JSON.parse(localStorage.getItem('crm_payslips') || '[]'); } catch { return []; }
  });
  const [requests, setRequests] = useState<PayslipRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [templates, setTemplates] = useState<SalaryTemplate[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('crm_salary_templates') || '[]');
      return saved.length ? saved : [
        { id: '1', name: 'Sales Executive Basic', position: 'Sales Executive', earnings: [{label:'Basic',amount:12000},{label:'HRA',amount:4800},{label:'Special Allowance',amount:3000},{label:'Medical Allowance',amount:1250},{label:'Leave Encashment',amount:0},{label:'Incentives',amount:0},{label:'Reimbursements',amount:0}], deductions: [{label:'TDS',amount:0},{label:'EPF',amount:1440},{label:'Professional Tax',amount:200},{label:'Conveyance Charges',amount:0},{label:'Advance',amount:0},{label:'Loan',amount:0},{label:'Recovery',amount:0}] },
        { id: '2', name: 'Sr. Sales Executive', position: 'Sr. Sales Executive', earnings: [{label:'Basic',amount:18000},{label:'HRA',amount:7200},{label:'Special Allowance',amount:5000},{label:'Medical Allowance',amount:1500},{label:'Leave Encashment',amount:0},{label:'Incentives',amount:2000},{label:'Reimbursements',amount:0}], deductions: [{label:'TDS',amount:0},{label:'EPF',amount:2160},{label:'Professional Tax',amount:200},{label:'Conveyance Charges',amount:0},{label:'Advance',amount:0},{label:'Loan',amount:0},{label:'Recovery',amount:0}] },
        { id: '3', name: 'Manager Salary', position: 'Manager', earnings: [{label:'Basic',amount:35000},{label:'HRA',amount:14000},{label:'Special Allowance',amount:8000},{label:'Medical Allowance',amount:3000},{label:'Leave Encashment',amount:0},{label:'Incentives',amount:5000},{label:'Reimbursements',amount:2000}], deductions: [{label:'TDS',amount:2500},{label:'EPF',amount:4200},{label:'Professional Tax',amount:200},{label:'Conveyance Charges',amount:0},{label:'Advance',amount:0},{label:'Loan',amount:0},{label:'Recovery',amount:0}] },
        { id: '4', name: 'IT Staff', position: 'IT', earnings: [{label:'Basic',amount:30000},{label:'HRA',amount:12000},{label:'Special Allowance',amount:6000},{label:'Medical Allowance',amount:2500},{label:'Leave Encashment',amount:0},{label:'Incentives',amount:3000},{label:'Reimbursements',amount:1500}], deductions: [{label:'TDS',amount:1800},{label:'EPF',amount:3600},{label:'Professional Tax',amount:200},{label:'Conveyance Charges',amount:0},{label:'Advance',amount:0},{label:'Loan',amount:0},{label:'Recovery',amount:0}] },
        { id: '5', name: 'HR Staff', position: 'HR', earnings: [{label:'Basic',amount:25000},{label:'HRA',amount:10000},{label:'Special Allowance',amount:5000},{label:'Medical Allowance',amount:2000},{label:'Leave Encashment',amount:0},{label:'Incentives',amount:2000},{label:'Reimbursements',amount:1000}], deductions: [{label:'TDS',amount:1000},{label:'EPF',amount:3000},{label:'Professional Tax',amount:200},{label:'Conveyance Charges',amount:0},{label:'Advance',amount:0},{label:'Loan',amount:0},{label:'Recovery',amount:0}] },
      ];
    } catch { return []; }
  });
  const [experienceLetters, setExperienceLetters] = useState<ExperienceLetter[]>(() => {
    try { return JSON.parse(localStorage.getItem('crm_experience_letters') || '[]'); } catch { return []; }
  });

  // Form state
  const [selectedCompany, setSelectedCompany] = useState('GSF');
  const [employeeName, setEmployeeName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNo, setBankAccountNo] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [payPeriodMonth, setPayPeriodMonth] = useState(MONTHS[new Date().getMonth()]);
  const [payPeriodYear, setPayPeriodYear] = useState(new Date().getFullYear().toString());
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalWorkingDays, setTotalWorkingDays] = useState(0);
  const [paidDays, setPaidDays] = useState(0);
  const [lopDays, setLopDays] = useState(0);
  const [leaves, setLeaves] = useState(0);
  const [paidLeaves, setPaidLeaves] = useState(0);
  const [earnings, setEarnings] = useState<EarningItem[]>([...DEFAULT_EARNINGS]);
  const [deductions, setDeductions] = useState<DeductionItem[]>([...DEFAULT_DEDUCTIONS]);
  const [previewData, setPreviewData] = useState<PayslipData|null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [searchEmployee, setSearchEmployee] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [editingSlip, setEditingSlip] = useState<PayslipData|null>(null);
  const [bulkPreviewList, setBulkPreviewList] = useState<PayslipData[]>([]);
  const [bulkStep, setBulkStep] = useState<'select'|'preview'|'done'>('select');
  const payslipRef = useRef<HTMLDivElement>(null);

  // Experience letter state
  const [expEmployeeName, setExpEmployeeName] = useState('');
  const [expDesignation, setExpDesignation] = useState('');
  const [expDepartment, setExpDepartment] = useState('');
  const [expJoiningDate, setExpJoiningDate] = useState('');
  const [expLastWorkingDate, setExpLastWorkingDate] = useState('');
  const [expContent, setExpContent] = useState('');
  const [expPreview, setExpPreview] = useState<ExperienceLetter|null>(null);
  const [editingExp, setEditingExp] = useState(false);

  // Persist
  useEffect(() => { localStorage.setItem('crm_payslips', JSON.stringify(payslips)); }, [payslips]);
  // Fetch payslip requests from database on mount and every 10s
  const fetchRequests = useCallback(async () => {
    try {
      setLoadingRequests(true);
      const res = await client.api.fetch('/api/public/payslip-requests');
      const data = await res.json() as any;
      if (Array.isArray(data)) {
        const mapped = data.map((r: any) => ({
          id: String(r.id),
          employeeName: r.employeeName || '',
          employeeId: r.employeeId || '',
          company: r.company || 'GSF',
          requestedMonth: r.requestedMonth || '',
          requestDate: r.requestDate || r.created || '',
          status: r.status || 'Pending',
          note: r.note || '',
          reviewedBy: r.reviewedBy || '',
          reviewedAt: r.reviewedAt || '',
        }));
        // Check for new pending requests (notification for admins)
        const pendingCount = mapped.filter((r: PayslipRequest) => r.status === 'Pending').length;
        if (isAdmin && pendingCount > prevRequestCountRef.current && prevRequestCountRef.current > 0) {
          // New request arrived - show popup notification
          const newest = mapped.find((r: PayslipRequest) => r.status === 'Pending');
          if (newest) {
            setNewRequestPopup(newest);
            playNotificationSound('request');
            addNotification({ title: '🔔 New Payslip Request', message: `${newest.employeeName} requested payslip for ${newest.requestedMonth}`, type: 'info' });
            setTimeout(() => setNewRequestPopup(null), 8000);
          }
        }
        prevRequestCountRef.current = pendingCount;
        setRequests(mapped);
      }
    } catch (e) { console.error('[Payslip] fetch requests error:', e); }
    finally { setLoadingRequests(false); }
  }, [isAdmin, addNotification]);
  useEffect(() => { fetchRequests(); const iv = setInterval(fetchRequests, 10000); return () => clearInterval(iv); }, [fetchRequests]);
  useEffect(() => { localStorage.setItem('crm_salary_templates', JSON.stringify(templates)); }, [templates]);
  useEffect(() => { localStorage.setItem('crm_experience_letters', JSON.stringify(experienceLetters)); }, [experienceLetters]);

  // Update total working days when month/year changes
  useEffect(() => {
    const monthIdx = MONTHS.indexOf(payPeriodMonth);
    const year = parseInt(payPeriodYear);
    if (monthIdx >= 0 && !isNaN(year)) {
      const days = getDaysInMonth(monthIdx, year);
      // Subtract Sundays
      let sundays = 0;
      for (let d = 1; d <= days; d++) {
        if (new Date(year, monthIdx, d).getDay() === 0) sundays++;
      }
      setTotalWorkingDays(days - sundays);
    }
  }, [payPeriodMonth, payPeriodYear]);

  // Auto-fill attendance when employee selected
  useEffect(() => {
    if (!selectedEmployee) return;
    const monthIdx = MONTHS.indexOf(payPeriodMonth);
    const year = parseInt(payPeriodYear);
    if (monthIdx < 0 || isNaN(year)) return;
    const sheetList = Array.isArray(attendanceSheet) ? attendanceSheet : [];
    const userEntries = sheetList.filter((e: any) => {
      if (!e || e.userId !== selectedEmployee.id) return false;
      const d = new Date(e.date);
      return d.getMonth() === monthIdx && d.getFullYear() === year;
    });
    const presentFull = userEntries.filter((e: any) => e.status === 'Present').length;
    const halfDays = userEntries.filter((e: any) => e.status === 'Half Day').length;
    const paidLeaveCount = userEntries.filter((e: any) => e.status === 'Paid Leave').length;
    const compOff = userEntries.filter((e: any) => e.status === 'Comp Off').length;
    const absentCount = userEntries.filter((e: any) => e.status === 'Absent').length;
    const nonPaidLeave = userEntries.filter((e: any) => e.status === 'Non-Paid Leave').length;
    const totalLeaves = absentCount + nonPaidLeave + halfDays;
    const totalPaid = presentFull + Math.ceil(halfDays * 0.5) + paidLeaveCount + compOff;
    const lopCount = absentCount + nonPaidLeave;
    setPaidDays(totalPaid);
    setLopDays(lopCount);
    setLeaves(totalLeaves);
    setPaidLeaves(paidLeaveCount);
  }, [selectedEmployee, payPeriodMonth, payPeriodYear, attendanceSheet]);

  // Computed values
  const grossEarnings = earnings.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalDeductions = deductions.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const netPayable = grossEarnings - totalDeductions;

  // Filter employees by company
  const filteredEmployees = useMemo(() => {
    let list = (Array.isArray(users) ? users : []).filter((u: any) => u && u.status === 'Active');
    // Filter by selected company
    list = list.filter((u: any) => {
      const userComp = getCompanyFromUserField(u.company);
      return userComp === selectedCompany;
    });
    if (searchEmployee) {
      list = list.filter((u: any) => (u.name || '').toLowerCase().includes(searchEmployee.toLowerCase()));
    }
    return list;
  }, [users, searchEmployee, selectedCompany]);

  // Select employee
  const handleSelectEmployee = (user: any) => {
    setSelectedEmployee(user);
    setEmployeeName(user.name);
    setEmployeeId(String(user.id).padStart(5, '0'));
    setDesignation(user.role || '');
    setDepartment(user.role?.includes('Sales') ? 'Sales' : user.role?.includes('IT') ? 'Information Technology' : user.role?.includes('HR') ? 'Human Resources' : 'Operations');
    setSearchEmployee(user.name);
    setShowEmployeeDropdown(false);
    try { const jd = user.created ? new Date(user.created) : null; setJoiningDate(jd && !isNaN(jd.getTime()) ? jd.toISOString().split('T')[0] : ''); } catch { setJoiningDate(''); }
  };

  // Apply template
  const applyTemplate = (template: SalaryTemplate) => {
    setEarnings([...template.earnings]);
    setDeductions([...template.deductions]);
    setDesignation(template.position);
  };

  // Generate payslip
  const handleGenerate = () => {
    const compData = COMPANY_DATA[selectedCompany];
    const data: PayslipData = {
      id: Date.now().toString(36),
      company: selectedCompany,
      companyLogo: compData.logo,
      employeeName,
      employeeId,
      designation,
      department,
      bankName,
      bankAccountNo,
      joiningDate,
      payPeriod: `${payPeriodMonth} ${payPeriodYear}`,
      payDate,
      totalWorkingDays,
      paidDays,
      lopDays,
      leaves,
      paidLeaves,
      earnings: [...earnings],
      deductions: [...deductions],
      grossEarnings,
      totalDeductions,
      netPayable,
      status: 'Generated',
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.name || 'System',
    };
    setPayslips(prev => [data, ...prev]);
    setPreviewData(data);
    setActiveTab('preview');
    playNotificationSound('send');
    addNotification({ title: 'Payslip Generated', message: `Payslip for ${employeeName} - ${payPeriodMonth} ${payPeriodYear} generated successfully.`, type: 'success' });
  };

  // Save edited slip
  const handleSaveEdit = (edited: PayslipData) => {
    setPayslips(prev => prev.map(p => p.id === edited.id ? edited : p));
    setPreviewData(edited);
    setEditingSlip(null);
    addNotification({ title: 'Payslip Updated', message: `Payslip for ${edited.employeeName} updated.`, type: 'success' });
  };


  // Download PDF - Professional layout matching reference image
  const handleDownloadPDF = async (data: PayslipData) => {
    const doc = new jsPDF();
    const comp = COMPANY_DATA[data.company];
    const pageW = 210;
    const margin = 14;
    
    // Load company logo and add to PDF
    try {
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        logoImg.onload = () => resolve();
        logoImg.onerror = () => reject(new Error('Logo load failed'));
        logoImg.src = comp.logo;
      });
      // Draw logo on the right side of the header
      const canvas = document.createElement('canvas');
      canvas.width = logoImg.naturalWidth;
      canvas.height = logoImg.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(logoImg, 0, 0);
        const logoDataUrl = canvas.toDataURL('image/png');
        // Place logo at top-right corner
        const logoHeight = 16;
        const logoWidth = (logoImg.naturalWidth / logoImg.naturalHeight) * logoHeight;
        doc.addImage(logoDataUrl, 'PNG', pageW - margin - logoWidth, 10, logoWidth, logoHeight);
      }
    } catch (e) {
      // If logo fails to load, continue without it
      console.warn('Logo could not be added to PDF:', e);
    }
    
    // Header bar
    doc.setFillColor(55, 65, 81);
    doc.rect(0, 0, pageW, 8, 'F');
    
    // Company name and logo
    doc.setFontSize(11);
    doc.setFont('helvetica','bold');
    doc.setTextColor(55, 65, 81);
    doc.text('PAYSLIP', margin, 18);
    doc.setFontSize(14);
    doc.text(data.payPeriod.toUpperCase(), 50, 18);
    
    doc.setFontSize(9);
    doc.setFont('helvetica','bold');
    doc.text(comp.fullName, margin, 28);
    doc.setFont('helvetica','normal');
    doc.setFontSize(8);
    doc.setTextColor(100);
    const addrLines = comp.address.split(',');
    doc.text(addrLines.slice(0,3).join(',').trim(), margin, 33);
    doc.text(addrLines.slice(3).join(',').trim() || 'India', margin, 37);
    
    // Line separator
    doc.setDrawColor(200);
    doc.line(margin, 42, pageW - margin, 42);
    
    // Employee Details Section - Row 1
    let y = 48;
    doc.setFontSize(7);
    doc.setTextColor(130);
    doc.text('Emp No', margin, y);
    doc.text('Date Joined', 60, y);
    doc.text('Department', 110, y);
    doc.text('Designation', 155, y);
    y += 5;
    doc.setFontSize(9);
    doc.setTextColor(30);
    doc.setFont('helvetica','normal');
    doc.text(data.employeeId, margin, y);
    doc.text(data.joiningDate || 'N/A', 60, y);
    doc.text(data.department || 'N/A', 110, y);
    doc.text(data.designation, 155, y);
    
    // Row 2
    y += 10;
    doc.setFontSize(7);
    doc.setTextColor(130);
    doc.text('Employee Name', margin, y);
    doc.text('Payment Mode', 60, y);
    doc.text('Bank', 110, y);
    doc.text('Bank A/C No', 155, y);
    y += 5;
    doc.setFontSize(9);
    doc.setTextColor(30);
    doc.text(data.employeeName, margin, y);
    doc.text('Bank Transfer', 60, y);
    doc.text(data.bankName || 'N/A', 110, y);
    doc.text(data.bankAccountNo || 'N/A', 155, y);
    
    // Line
    y += 8;
    doc.setDrawColor(200);
    doc.line(margin, y, pageW - margin, y);
    
    // SALARY DETAILS heading
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica','bold');
    doc.setTextColor(30);
    doc.text('SALARY DETAILS', margin, y);
    
    // Working days row
    y += 8;
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y - 4, pageW - 2*margin, 10, 'F');
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text('Total Working Days', margin + 2, y);
    doc.text('Paid Days', 55, y);
    doc.text('Loss Of Pay Days', 100, y);
    doc.text('Leaves', 145, y);
    doc.text('Paid Leaves', 170, y);
    y += 5;
    doc.setFontSize(9);
    doc.setTextColor(30);
    doc.setFont('helvetica','bold');
    doc.text(String(data.totalWorkingDays), margin + 2, y);
    doc.text(String(data.paidDays), 55, y);
    doc.text(String(data.lopDays), 100, y);
    doc.text(String(data.leaves || 0), 145, y);
    doc.text(String(data.paidLeaves || 0), 170, y);
    
    // Earnings & Deductions table
    y += 12;
    const colMid = pageW / 2;
    
    // Earnings header
    doc.setFillColor(55, 65, 81);
    doc.rect(margin, y, colMid - margin - 2, 8, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica','bold');
    doc.setTextColor(255);
    doc.text('EARNINGS', margin + 3, y + 5.5);
    doc.text('AMOUNT', colMid - 25, y + 5.5);
    
    // Deductions header
    doc.setFillColor(55, 65, 81);
    doc.rect(colMid + 2, y, colMid - margin - 2, 8, 'F');
    doc.text('DEDUCTIONS', colMid + 5, y + 5.5);
    doc.text('AMOUNT', pageW - margin - 22, y + 5.5);
    
    y += 10;
    doc.setFont('helvetica','normal');
    doc.setTextColor(50);
    doc.setFontSize(8);
    const maxRows = Math.max(data.earnings.length, data.deductions.length);
    for (let i = 0; i < maxRows; i++) {
      if (i % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, y - 3, colMid - margin - 2, 7, 'F');
        doc.rect(colMid + 2, y - 3, colMid - margin - 2, 7, 'F');
      }
      if (data.earnings[i]) {
        doc.text(data.earnings[i].label, margin + 3, y);
        doc.text(formatINRShort(data.earnings[i].amount), colMid - 25, y);
      }
      if (data.deductions[i]) {
        doc.text(data.deductions[i].label, colMid + 5, y);
        doc.text(formatINRShort(data.deductions[i].amount), pageW - margin - 22, y);
      }
      y += 7;
    }
    
    // Totals
    doc.setFillColor(235, 235, 235);
    doc.rect(margin, y - 3, colMid - margin - 2, 8, 'F');
    doc.rect(colMid + 2, y - 3, colMid - margin - 2, 8, 'F');
    doc.setFont('helvetica','bold');
    doc.setFontSize(8);
    doc.setTextColor(30);
    doc.text('Total Earnings (A)', margin + 3, y + 2);
    doc.text(formatINRShort(data.grossEarnings), colMid - 25, y + 2);
    doc.text('Total Deductions (B)', colMid + 5, y + 2);
    doc.text(formatINRShort(data.totalDeductions), pageW - margin - 22, y + 2);
    
    // Net Salary box
    y += 14;
    doc.setFillColor(220, 252, 231);
    doc.roundedRect(margin, y - 4, pageW - 2*margin, 14, 2, 2, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica','bold');
    doc.setTextColor(20, 100, 50);
    doc.text('Net Salary Payable (A - B)', margin + 4, y + 4);
    doc.text(formatINR(data.netPayable), pageW - margin - 50, y + 4);
    
    // Net salary in words
    y += 14;
    doc.setFontSize(8);
    doc.setFont('helvetica','normal');
    doc.setTextColor(80);
    doc.text('Net Salary in words: ' + numberToWords(data.netPayable), margin, y);
    
    // Footer note
    y += 12;
    doc.setFontSize(7);
    doc.setTextColor(200, 0, 0);
    doc.text('**Note:  All amounts displayed in this payslip are in INR', margin, y);
    y += 8;
    doc.setTextColor(120);
    doc.setFontSize(7);
    doc.text('*This is a system generated salary slip and does not require signature.', margin, y);
    
    doc.save(`Payslip_${data.employeeName.replace(/\s+/g,'_')}_${data.payPeriod.replace(/\s+/g,'_')}.pdf`);
    setPayslips(prev => prev.map(p => p.id === data.id ? {...p, status:'Downloaded'} : p));
    playNotificationSound('download');
    addNotification({ title: 'Payslip Downloaded', message: `PDF for ${data.employeeName} downloaded.`, type: 'success' });
  };

  // Email payslip with Brevo (via backend)
  const handleEmailPayslip = async (data: PayslipData) => {
    const emp = users.find((u: any) => u.name === data.employeeName);
    if (!emp?.email) { alert('Employee email not found'); return; }
    try {
      const comp = COMPANY_DATA[data.company];
      const emailHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head><body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
<div style="max-width:640px;margin:20px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#374151,#1f2937);padding:24px 32px;text-align:center;">
    <img src="${comp.logo.startsWith('/') ? window.location.origin + comp.logo : comp.logo}" alt="${comp.name}" style="height:40px;margin-bottom:8px;" />
    <h2 style="color:#ffffff;margin:0;font-size:20px;font-weight:700;">${comp.fullName}</h2>
    <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:12px;">${comp.address}</p>
  </div>
  <div style="padding:28px 32px;">
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;margin-bottom:20px;text-align:center;">
      <p style="margin:0;font-size:16px;font-weight:700;color:#166534;">SALARY SLIP — ${data.payPeriod.toUpperCase()}</p>
    </div>
    <p style="font-size:15px;color:#374151;margin:0 0 16px;">Dear <strong>${data.employeeName}</strong>,</p>
    <p style="font-size:14px;color:#4b5563;margin:0 0 20px;line-height:1.6;">Please find your salary slip details for <strong>${data.payPeriod}</strong> below:</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #e5e7eb;border-radius:8px;">
      <tr style="background:#f9fafb;"><td style="padding:10px 14px;border:1px solid #e5e7eb;font-size:13px;color:#6b7280;font-weight:600;">Employee ID</td><td style="padding:10px 14px;border:1px solid #e5e7eb;font-size:13px;font-weight:700;">${data.employeeId}</td></tr>
      <tr><td style="padding:10px 14px;border:1px solid #e5e7eb;font-size:13px;color:#6b7280;font-weight:600;">Designation</td><td style="padding:10px 14px;border:1px solid #e5e7eb;font-size:13px;">${data.designation}</td></tr>
      <tr style="background:#f9fafb;"><td style="padding:10px 14px;border:1px solid #e5e7eb;font-size:13px;color:#6b7280;font-weight:600;">Department</td><td style="padding:10px 14px;border:1px solid #e5e7eb;font-size:13px;">${data.department}</td></tr>
      <tr><td style="padding:10px 14px;border:1px solid #e5e7eb;font-size:13px;color:#6b7280;font-weight:600;">Pay Period</td><td style="padding:10px 14px;border:1px solid #e5e7eb;font-size:13px;font-weight:600;">${data.payPeriod}</td></tr>
      <tr style="background:#f9fafb;"><td style="padding:10px 14px;border:1px solid #e5e7eb;font-size:13px;color:#6b7280;font-weight:600;">Working Days</td><td style="padding:10px 14px;border:1px solid #e5e7eb;font-size:13px;">${data.totalWorkingDays} (Paid: ${data.paidDays}, LOP: ${data.lopDays})</td></tr>
    </table>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #e5e7eb;">
      <tr style="background:#374151;"><td style="padding:10px 14px;color:#fff;font-size:13px;font-weight:700;border:1px solid #374151;">EARNINGS</td><td style="padding:10px 14px;color:#fff;font-size:13px;font-weight:700;border:1px solid #374151;text-align:right;">AMOUNT (₹)</td></tr>
      ${data.earnings.filter(e => e.amount > 0).map((e, i) => `<tr style="background:${i % 2 === 0 ? '#f9fafb' : '#fff'}"><td style="padding:8px 14px;border:1px solid #e5e7eb;font-size:13px;">${e.label}</td><td style="padding:8px 14px;border:1px solid #e5e7eb;font-size:13px;text-align:right;">${formatINRShort(e.amount)}</td></tr>`).join('')}
      <tr style="background:#ecfdf5;"><td style="padding:10px 14px;border:1px solid #e5e7eb;font-size:13px;font-weight:700;color:#166534;">Total Earnings</td><td style="padding:10px 14px;border:1px solid #e5e7eb;font-size:13px;font-weight:700;color:#166534;text-align:right;">${formatINRShort(data.grossEarnings)}</td></tr>
    </table>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #e5e7eb;">
      <tr style="background:#374151;"><td style="padding:10px 14px;color:#fff;font-size:13px;font-weight:700;border:1px solid #374151;">DEDUCTIONS</td><td style="padding:10px 14px;color:#fff;font-size:13px;font-weight:700;border:1px solid #374151;text-align:right;">AMOUNT (₹)</td></tr>
      ${data.deductions.filter(d => d.amount > 0).map((d, i) => `<tr style="background:${i % 2 === 0 ? '#f9fafb' : '#fff'}"><td style="padding:8px 14px;border:1px solid #e5e7eb;font-size:13px;">${d.label}</td><td style="padding:8px 14px;border:1px solid #e5e7eb;font-size:13px;text-align:right;">${formatINRShort(d.amount)}</td></tr>`).join('')}
      <tr style="background:#fef2f2;"><td style="padding:10px 14px;border:1px solid #e5e7eb;font-size:13px;font-weight:700;color:#dc2626;">Total Deductions</td><td style="padding:10px 14px;border:1px solid #e5e7eb;font-size:13px;font-weight:700;color:#dc2626;text-align:right;">${formatINRShort(data.totalDeductions)}</td></tr>
    </table>
    <div style="background:linear-gradient(135deg,#ecfdf5,#d1fae5);border:2px solid #10b981;border-radius:10px;padding:16px 20px;text-align:center;margin:20px 0;">
      <p style="margin:0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Net Salary Payable</p>
      <p style="margin:4px 0 0;font-size:24px;font-weight:800;color:#065f46;">${formatINR(data.netPayable)}</p>
      <p style="margin:4px 0 0;font-size:11px;color:#6b7280;font-style:italic;">${numberToWords(data.netPayable)}</p>
    </div>
    <p style="font-size:12px;color:#9ca3af;margin:16px 0 0;text-align:center;">This is a system-generated salary slip and does not require signature.</p>
  </div>
  <div style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center;">
    <p style="font-size:12px;color:#6b7280;margin:0;">${comp.fullName} | ${comp.address}</p>
    <p style="font-size:11px;color:#9ca3af;margin:4px 0 0;">This is an automated email. Please do not reply directly. For queries, contact HR.</p>
  </div>
</div>
</body></html>`;

      const response = await client.api.fetch('/api/public/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emp.email,
          subject: `Salary Slip - ${data.payPeriod} | ${comp.name}`,
          html: emailHtml,
        }),
      });
      const result = await response.json() as any;
      if (response.ok && result.success !== false) {
        playNotificationSound('send');
        addNotification({ title: 'Payslip Emailed', message: `Payslip for ${data.employeeName} sent to ${emp.email}`, type: 'success' });
        setPayslips(prev => prev.map(p => p.id === data.id ? {...p, status:'Emailed'} : p));
      } else {
        throw new Error(result.error || result.message || 'Email failed');
      }
    } catch (err: any) {
      addNotification({ title: 'Email Failed', message: `Failed to send payslip email: ${err.message || 'Unknown error'}`, type: 'error' });
    }
  };

  // Agent request
  const handleAgentRequest = async (months: number) => {
    if (requestSubmitting) return;
    setRequestSubmitting(true);
    setRequestError('');
    setRequestSuccess(false);
    try {
      const now = new Date();
      let reqMonth = '';
      if (months === 1) {
        const prevM = now.getMonth() - 1 < 0 ? 11 : now.getMonth() - 1;
        reqMonth = `${MONTHS[prevM]} ${prevM === 11 ? now.getFullYear()-1 : now.getFullYear()}`;
      } else {
        const endM = now.getMonth() - 1 < 0 ? 11 : now.getMonth() - 1;
        const startM = now.getMonth() - months < 0 ? 12 + now.getMonth() - months : now.getMonth() - months;
        reqMonth = `${MONTHS[startM]} to ${MONTHS[endM]} ${now.getFullYear()}`;
      }
      const userCompany = getCompanyFromUserField(currentUser?.company);
      // Save to database
      const res = await client.api.fetch('/api/public/payslip-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeName: currentUser?.name || '',
          employeeId: String(currentUser?.id || '').padStart(5,'0'),
          company: userCompany,
          requestedMonth: reqMonth,
          requestDate: new Date().toISOString().split('T')[0],
          createdBy: currentUser?.name || '',
        }),
      });
      const result = await res.json() as any;
      if (!res.ok || result.success === false) {
        throw new Error(result.message || 'Failed to submit request');
      }
      // Success - refresh from DB
      await fetchRequests();
      setRequestSuccess(true);
      playNotificationSound('request');
      addNotification({ title: '✅ Payslip Request Sent', message: `Your payslip request for ${reqMonth} has been submitted to HR/Admin.`, type: 'success' });
      setTimeout(() => setRequestSuccess(false), 5000);
    } catch (err: any) {
      console.error('[Payslip] request error:', err);
      setRequestError(err.message || 'Failed to submit request. Please try again.');
      addNotification({ title: '❌ Request Failed', message: err.message || 'Failed to submit payslip request', type: 'error' });
      setTimeout(() => setRequestError(''), 5000);
    } finally {
      setRequestSubmitting(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setEmployeeName(''); setEmployeeId(''); setDesignation(''); setDepartment('');
    setBankName(''); setBankAccountNo(''); setJoiningDate('');
    setPayPeriodMonth(MONTHS[new Date().getMonth()]);
    setPayPeriodYear(new Date().getFullYear().toString());
    setPayDate(new Date().toISOString().split('T')[0]);
    setTotalWorkingDays(0); setPaidDays(0); setLopDays(0); setLeaves(0); setPaidLeaves(0);
    setEarnings([...DEFAULT_EARNINGS]);
    setDeductions([...DEFAULT_DEDUCTIONS]);
    setSelectedEmployee(null); setSearchEmployee('');
  };

  // Generate Experience Letter
  const generateExpLetter = () => {
    const comp = COMPANY_DATA[selectedCompany];
    const content = expContent || `To Whom It May Concern,

This is to certify that ${expEmployeeName} was employed with ${comp.name} from ${expJoiningDate ? new Date(expJoiningDate).toLocaleDateString('en-IN', {day:'2-digit',month:'long',year:'numeric'}) : '[Joining Date]'} to ${expLastWorkingDate ? new Date(expLastWorkingDate).toLocaleDateString('en-IN', {day:'2-digit',month:'long',year:'numeric'}) : '[Last Working Date]'}.

During the tenure with us, ${expEmployeeName} held the position of ${expDesignation} in the ${expDepartment} department.

We found ${expEmployeeName} to be sincere, hardworking, and dedicated during the entire tenure. ${expEmployeeName} has been an asset to our organization and has demonstrated excellent professional skills, leadership qualities, and a strong work ethic.

Key responsibilities handled:
- Managed day-to-day operations and team coordination
- Contributed significantly to departmental goals and targets
- Maintained professional relationships with clients and stakeholders
- Demonstrated expertise in ${expDepartment} domain

${expEmployeeName} leaves the organization on own accord and has been relieved from all responsibilities. All dues have been settled and there are no outstanding obligations.

We wish ${expEmployeeName} all the best for future endeavors and career growth.

For ${comp.fullName}


________________
Authorized Signatory
HR Department
${comp.name}
${comp.address}`;
    
    const letter: ExperienceLetter = {
      id: Date.now().toString(36),
      employeeName: expEmployeeName,
      employeeId: '',
      designation: expDesignation,
      department: expDepartment,
      joiningDate: expJoiningDate,
      lastWorkingDate: expLastWorkingDate,
      company: selectedCompany,
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.name || 'System',
      content,
    };
    setExperienceLetters(prev => [letter, ...prev]);
    setExpPreview(letter);
    setExpContent(content);
    playNotificationSound('send');
    addNotification({ title: 'Experience Letter Generated', message: `Letter for ${expEmployeeName} created.`, type: 'success' });
  };

  // Download Experience Letter PDF
  const downloadExpLetterPDF = (letter: ExperienceLetter) => {
    const doc = new jsPDF();
    const comp = COMPANY_DATA[letter.company];
    
    // Header
    doc.setFillColor(55, 65, 81);
    doc.rect(0, 0, 210, 6, 'F');
    
    doc.setFontSize(14);
    doc.setFont('helvetica','bold');
    doc.setTextColor(55, 65, 81);
    doc.text(comp.fullName, 105, 20, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica','normal');
    doc.setTextColor(100);
    doc.text(comp.address, 105, 26, { align: 'center' });
    
    doc.setDrawColor(55, 65, 81);
    doc.line(14, 30, 196, 30);
    
    // Title
    doc.setFontSize(14);
    doc.setFont('helvetica','bold');
    doc.setTextColor(30);
    doc.text('EXPERIENCE CERTIFICATE', 105, 42, { align: 'center' });
    
    // Date
    doc.setFontSize(9);
    doc.setFont('helvetica','normal');
    doc.setTextColor(80);
    doc.text(`Date: ${new Date(letter.createdAt).toLocaleDateString('en-IN', {day:'2-digit',month:'long',year:'numeric'})}`, 14, 52);
    doc.text(`Ref: ${comp.short}/EXP/${letter.id.toUpperCase()}`, 14, 58);
    
    // Content
    const lines = doc.splitTextToSize(letter.content, 180);
    doc.setFontSize(10);
    doc.setTextColor(40);
    doc.text(lines, 14, 68);
    
    // Footer line
    const pageH = doc.internal.pageSize.height;
    doc.setFillColor(55, 65, 81);
    doc.rect(0, pageH - 6, 210, 6, 'F');
    
    doc.save(`Experience_Letter_${letter.employeeName.replace(/\s+/g,'_')}.pdf`);
    playNotificationSound('download');
  };


  // ===== RENDER =====
  const tabs = isAdmin && !isSupervisor
    ? [{id:'dashboard',label:'Dashboard',icon:BarChart3},{id:'generate',label:'Generate Payslip',icon:Plus},{id:'requests',label:'Requests',icon:Bell},{id:'templates',label:'Templates',icon:FileText},{id:'bulk',label:'Bulk Generate',icon:Users},{id:'experience',label:'Experience Letter',icon:Award},{id:'reports',label:'Reports',icon:Download}] as const
    : [{id:'requests',label:'My Requests',icon:Bell},{id:'dashboard',label:'My Payslips',icon:FileText}] as const;

  // Pending requests count for badge
  const pendingRequestCount = requests.filter(r => r.status === 'Pending').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* New Request Popup Notification for Admin/HR/IT */}
      {newRequestPopup && (
        <div className="fixed top-4 right-4 z-50 animate-bounce">
          <div className="bg-white border-2 border-amber-400 rounded-xl shadow-2xl p-4 max-w-sm">
            <div className="flex items-start gap-3">
              <div className="bg-amber-100 rounded-full p-2"><Bell size={20} className="text-amber-600"/></div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 text-sm">🔔 New Payslip Request!</p>
                <p className="text-sm text-gray-700 mt-1"><span className="font-semibold">{newRequestPopup.employeeName}</span> requested payslip</p>
                <p className="text-xs text-gray-500 mt-0.5">Period: {newRequestPopup.requestedMonth}</p>
                <p className="text-xs text-gray-400 mt-0.5">Company: {COMPANY_DATA[newRequestPopup.company]?.short || newRequestPopup.company} | {newRequestPopup.requestDate}</p>
              </div>
              <button onClick={() => setNewRequestPopup(null)} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
            </div>
            <button onClick={() => { setActiveTab('requests'); setNewRequestPopup(null); }} className="mt-3 w-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium py-1.5 rounded-lg">View Requests</button>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="bg-white border-b px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Payroll Management</h1>
            <p className="text-sm text-gray-500">Salary Slip, Experience Letters & Payroll Tracker</p>
          </div>
          <div className="flex items-center gap-2">
            <select value={selectedCompany} onChange={e => { setSelectedCompany(e.target.value); setSelectedEmployee(null); setSearchEmployee(''); setEmployeeName(''); }}
              className="border rounded-lg px-3 py-2 text-sm font-medium">
              {Object.entries(COMPANY_DATA).map(([k,v]) => <option key={k} value={k}>{v.name} ({v.short})</option>)}
            </select>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex gap-1 mt-4 overflow-x-auto pb-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === t.id ? 'bg-gray-800 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              <t.icon size={16}/>{t.label}
              {t.id === 'requests' && pendingRequestCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold animate-pulse">{pendingRequestCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {/* DASHBOARD */}
        {activeTab === 'dashboard' && isAdmin && !isSupervisor && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[{label:'Total Employees',value:users.filter((u:any)=>u.status==='Active'&&getCompanyFromUserField(u.company)===selectedCompany).length,icon:Users,color:'bg-blue-50 text-blue-600 border-blue-200'},
                {label:'Pending Requests',value:pendingRequestCount,icon:Clock,color:'bg-amber-50 text-amber-600 border-amber-200'},
                {label:'Generated',value:payslips.filter(p=>p.company===selectedCompany).length,icon:FileText,color:'bg-green-50 text-green-600 border-green-200'},
                {label:'This Month Payroll',value:formatINR(payslips.filter(p=>p.company===selectedCompany&&p.payPeriod.includes(MONTHS[new Date().getMonth()])).reduce((s,p)=>s+p.netPayable,0)),icon:BarChart3,color:'bg-purple-50 text-purple-600 border-purple-200'},
                {label:'Downloaded',value:payslips.filter(p=>p.status==='Downloaded'&&p.company===selectedCompany).length,icon:Download,color:'bg-cyan-50 text-cyan-600 border-cyan-200'},
                {label:'Emailed',value:payslips.filter(p=>p.status==='Emailed'&&p.company===selectedCompany).length,icon:Mail,color:'bg-rose-50 text-rose-600 border-rose-200'},
              ].map((s,i) => (
                <div key={i} className={`${s.color} rounded-xl p-4 border`}>
                  <s.icon size={20} className="mb-2"/>
                  <div className="text-lg font-bold truncate">{s.value}</div>
                  <div className="text-xs opacity-70">{s.label}</div>
                </div>
              ))}
            </div>
            {/* Recent Payslips */}
            <div className="bg-white rounded-xl border shadow-sm">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="font-semibold">Recent Payslips</h3>
                {isAdmin && <button onClick={() => setActiveTab('generate')} className="text-gray-800 text-sm font-medium hover:underline flex items-center gap-1"><Plus size={14}/>Generate New</button>}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50"><tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Employee</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Company</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Period</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Net Pay</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Actions</th>
                  </tr></thead>
                  <tbody>
                    {payslips.filter(p => p.company === selectedCompany).slice(0,10).map(p => (
                      <tr key={p.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{p.employeeName}</td>
                        <td className="px-4 py-3">{COMPANY_DATA[p.company]?.short || p.company}</td>
                        <td className="px-4 py-3">{p.payPeriod}</td>
                        <td className="px-4 py-3 text-right font-semibold text-green-700">{formatINR(p.netPayable)}</td>
                        <td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full text-xs font-medium ${p.status==='Generated'?'bg-green-100 text-green-700':p.status==='Emailed'?'bg-blue-100 text-blue-700':p.status==='Downloaded'?'bg-purple-100 text-purple-700':'bg-gray-100 text-gray-600'}`}>{p.status}</span></td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-1">
                            <button onClick={() => {setPreviewData(p);setActiveTab('preview');}} className="p-1.5 hover:bg-gray-100 rounded" title="View"><Eye size={14}/></button>
                            {isAdmin && <button onClick={() => {setEditingSlip(p);setPreviewData(p);setActiveTab('preview');}} className="p-1.5 hover:bg-blue-50 rounded text-blue-600" title="Edit"><Edit3 size={14}/></button>}
                            {isAdmin && <button onClick={() => handleDownloadPDF(p)} className="p-1.5 hover:bg-green-50 rounded text-green-600" title="Download"><Download size={14}/></button>}
                            {isAdmin && <button onClick={() => handleEmailPayslip(p)} className="p-1.5 hover:bg-rose-50 rounded text-rose-600" title="Email"><Mail size={14}/></button>}
                            {isAdmin && <button onClick={() => { if(confirm('Delete this payslip?')) setPayslips(prev=>prev.filter(x=>x.id!==p.id)); }} className="p-1.5 hover:bg-red-50 rounded text-red-500" title="Delete"><Trash2 size={14}/></button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {payslips.filter(p=>p.company===selectedCompany).length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-400">No payslips generated yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* GENERATE PAYSLIP - Only for admin roles, NOT supervisor */}
        {activeTab === 'generate' && isAdmin && !isSupervisor && (
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              {/* Company Header */}
              <div className="bg-gray-800 text-white p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img src={COMPANY_DATA[selectedCompany].logo} alt="Logo" className="w-12 h-12 object-contain bg-white rounded-lg p-1" onError={e=>{(e.target as any).style.display='none'}}/>
                    <div>
                      <h2 className="text-lg font-bold">{COMPANY_DATA[selectedCompany].fullName}</h2>
                      <p className="text-sm text-gray-300">{COMPANY_DATA[selectedCompany].address}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Payslip For</p>
                    <p className="text-xl font-bold">{payPeriodMonth} {payPeriodYear}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Employee Search */}
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2"><Users size={18}/>Employee Details</h3>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={16}/>
                    <input value={searchEmployee} onChange={e=>{setSearchEmployee(e.target.value);setShowEmployeeDropdown(true);}}
                      onFocus={()=>setShowEmployeeDropdown(true)} placeholder={`Search ${COMPANY_DATA[selectedCompany].short} employees...`}
                      className="w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-gray-300 focus:border-gray-400"/>
                    {showEmployeeDropdown && filteredEmployees.length > 0 && (
                      <div className="absolute z-20 top-full left-0 right-0 bg-white border rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                        {filteredEmployees.slice(0,20).map((u: any) => (
                          <button key={u.id} onClick={()=>handleSelectEmployee(u)} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-sm border-b last:border-b-0">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">{u.name?.charAt(0)}</div>
                            <div><span className="font-medium">{u.name}</span><span className="text-gray-400 ml-2">({u.role})</span></div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Template selector */}
                  <div className="mb-4">
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Apply Salary Template</label>
                    <select onChange={e => { const t = templates.find(t=>t.id===e.target.value); if(t) applyTemplate(t); }} className="border rounded-lg px-3 py-2.5 text-sm w-full" defaultValue="">
                      <option value="">-- Select Template --</option>
                      {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.position}) - Net: {formatINR(t.earnings.reduce((s,e)=>s+e.amount,0) - t.deductions.reduce((s,d)=>s+d.amount,0))}</option>)}
                    </select>
                  </div>
                  {/* Employee info fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div><label className="text-xs font-medium text-gray-500 block mb-1">Employee Name</label>
                      <input value={employeeName} onChange={e=>setEmployeeName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm"/></div>
                    <div><label className="text-xs font-medium text-gray-500 block mb-1">Employee ID</label>
                      <input value={employeeId} onChange={e=>setEmployeeId(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm"/></div>
                    <div><label className="text-xs font-medium text-gray-500 block mb-1">Designation</label>
                      <select value={designation} onChange={e=>setDesignation(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                        <option value="">Select...</option>
                        {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select></div>
                    <div><label className="text-xs font-medium text-gray-500 block mb-1">Department</label>
                      <input value={department} onChange={e=>setDepartment(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm"/></div>
                    <div><label className="text-xs font-medium text-gray-500 block mb-1">Bank Name</label>
                      <input value={bankName} onChange={e=>setBankName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. State Bank of India"/></div>
                    <div><label className="text-xs font-medium text-gray-500 block mb-1">Bank A/C Number</label>
                      <input value={bankAccountNo} onChange={e=>setBankAccountNo(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Account Number"/></div>
                    <div><label className="text-xs font-medium text-gray-500 block mb-1">Joining Date</label>
                      <input type="date" value={joiningDate} onChange={e=>setJoiningDate(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm"/></div>
                    <div><label className="text-xs font-medium text-gray-500 block mb-1">Pay Period</label>
                      <div className="flex gap-2">
                        <select value={payPeriodMonth} onChange={e=>setPayPeriodMonth(e.target.value)} className="flex-1 border rounded-lg px-2 py-2 text-sm">
                          {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <input type="number" value={payPeriodYear} onChange={e=>setPayPeriodYear(e.target.value)} className="w-20 border rounded-lg px-2 py-2 text-sm"/>
                      </div></div>
                    <div><label className="text-xs font-medium text-gray-500 block mb-1">Pay Date</label>
                      <input type="date" value={payDate} onChange={e=>setPayDate(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm"/></div>
                  </div>
                  {/* Attendance Info */}
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3 text-center border">
                      <p className="text-xs text-gray-500">Total Working Days</p>
                      <input type="number" value={totalWorkingDays} onChange={e=>setTotalWorkingDays(Number(e.target.value))} className="w-full text-center text-lg font-bold bg-transparent focus:outline-none"/>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
                      <p className="text-xs text-green-600">Paid Days</p>
                      <input type="number" value={paidDays} onChange={e=>setPaidDays(Number(e.target.value))} className="w-full text-center text-lg font-bold bg-transparent text-green-700 focus:outline-none"/>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 text-center border border-red-200">
                      <p className="text-xs text-red-600">LOP Days</p>
                      <input type="number" value={lopDays} onChange={e=>setLopDays(Number(e.target.value))} className="w-full text-center text-lg font-bold bg-transparent text-red-700 focus:outline-none"/>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3 text-center border border-amber-200">
                      <p className="text-xs text-amber-600">Leaves</p>
                      <input type="number" value={leaves} onChange={e=>setLeaves(Number(e.target.value))} className="w-full text-center text-lg font-bold bg-transparent text-amber-700 focus:outline-none"/>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200">
                      <p className="text-xs text-blue-600">Paid Leaves</p>
                      <input type="number" value={paidLeaves} onChange={e=>setPaidLeaves(Number(e.target.value))} className="w-full text-center text-lg font-bold bg-transparent text-blue-700 focus:outline-none"/>
                    </div>
                  </div>
                </div>

                {/* Earnings & Deductions */}
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2"><Briefcase size={18}/>Salary Breakdown</h3>
                  <div className="border rounded-xl overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2">
                      {/* Earnings */}
                      <div className="md:border-r">
                        <div className="bg-green-700 text-white px-4 py-2.5 flex justify-between text-sm font-semibold"><span>EARNINGS</span><span>AMOUNT (INR)</span></div>
                        {earnings.map((e,i) => (
                          <div key={i} className="flex items-center px-4 py-2 border-b gap-2">
                            <input value={e.label} onChange={ev=>setEarnings(prev=>{const n=[...prev];n[i]={...n[i],label:ev.target.value};return n;})}
                              className="flex-1 text-sm focus:outline-none bg-transparent"/>
                            <input type="number" value={e.amount||''} onChange={ev=>setEarnings(prev=>{const n=[...prev];n[i]={...n[i],amount:Number(ev.target.value)};return n;})}
                              className="w-28 text-right text-sm border rounded px-2 py-1 focus:ring-1 focus:ring-green-200"/>
                            {earnings.length > 1 && <button onClick={()=>setEarnings(prev=>prev.filter((_,idx)=>idx!==i))} className="text-red-400 hover:text-red-600"><X size={14}/></button>}
                          </div>
                        ))}
                        <button onClick={()=>setEarnings(prev=>[...prev,{label:'',amount:0}])} className="text-green-700 text-sm px-4 py-2 hover:bg-green-50 w-full text-left flex items-center gap-1"><Plus size={14}/>Add Earning</button>
                        <div className="bg-green-50 px-4 py-3 flex justify-between font-bold text-sm border-t border-green-200">
                          <span>Gross Earnings (A)</span><span className="text-green-700">{formatINR(grossEarnings)}</span>
                        </div>
                      </div>
                      {/* Deductions */}
                      <div>
                        <div className="bg-red-700 text-white px-4 py-2.5 flex justify-between text-sm font-semibold"><span>DEDUCTIONS</span><span>AMOUNT (INR)</span></div>
                        {deductions.map((d,i) => (
                          <div key={i} className="flex items-center px-4 py-2 border-b gap-2">
                            <input value={d.label} onChange={ev=>setDeductions(prev=>{const n=[...prev];n[i]={...n[i],label:ev.target.value};return n;})}
                              className="flex-1 text-sm focus:outline-none bg-transparent"/>
                            <input type="number" value={d.amount||''} onChange={ev=>setDeductions(prev=>{const n=[...prev];n[i]={...n[i],amount:Number(ev.target.value)};return n;})}
                              className="w-28 text-right text-sm border rounded px-2 py-1 focus:ring-1 focus:ring-red-200"/>
                            {deductions.length > 1 && <button onClick={()=>setDeductions(prev=>prev.filter((_,idx)=>idx!==i))} className="text-red-400 hover:text-red-600"><X size={14}/></button>}
                          </div>
                        ))}
                        <button onClick={()=>setDeductions(prev=>[...prev,{label:'',amount:0}])} className="text-red-700 text-sm px-4 py-2 hover:bg-red-50 w-full text-left flex items-center gap-1"><Plus size={14}/>Add Deduction</button>
                        <div className="bg-red-50 px-4 py-3 flex justify-between font-bold text-sm border-t border-red-200">
                          <span>Total Deductions (B)</span><span className="text-red-700">{formatINR(totalDeductions)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Net Payable */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-center gap-3">
                  <div><p className="font-bold text-lg text-gray-900">Net Salary Payable (A - B)</p>
                    <p className="text-sm text-gray-500">{numberToWords(netPayable)}</p></div>
                  <p className="text-3xl font-bold text-green-700">{formatINR(netPayable)}</p>
                </div>

                {/* Actions */}
                <div className="flex justify-center gap-4 pt-4">
                  <button onClick={handleGenerate} disabled={!employeeName||!employeeId||grossEarnings<=0}
                    className="bg-gray-800 hover:bg-gray-900 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-semibold shadow-lg transition-all flex items-center gap-2"><CheckCircle2 size={18}/>Generate Payslip</button>
                  <button onClick={handleReset} className="border-2 border-gray-300 px-8 py-3 rounded-xl font-semibold hover:bg-gray-50 flex items-center gap-2"><RefreshCw size={16}/>Reset</button>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* PREVIEW */}
        {activeTab === 'preview' && previewData && (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-xl font-bold">Payslip Preview</h2>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => {setActiveTab(isAdmin?'generate':'requests');setEditingSlip(null);}} className="border px-3 py-2 rounded-lg flex items-center gap-1 hover:bg-gray-50 text-sm"><ArrowLeft size={14}/>Back</button>
                {isAdmin && !editingSlip && <button onClick={() => setEditingSlip(previewData)} className="bg-blue-500 text-white px-3 py-2 rounded-lg flex items-center gap-1 text-sm"><Edit3 size={14}/>Edit</button>}
                {isAdmin && editingSlip && <button onClick={() => handleSaveEdit(editingSlip)} className="bg-green-600 text-white px-3 py-2 rounded-lg flex items-center gap-1 text-sm"><Save size={14}/>Save</button>}
                {isAdmin && <button onClick={() => handleDownloadPDF(previewData)} className="bg-gray-800 text-white px-3 py-2 rounded-lg flex items-center gap-1 text-sm"><Download size={14}/>Download PDF</button>}
                {isAdmin && <button onClick={() => handleEmailPayslip(previewData)} className="bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center gap-1 text-sm"><Mail size={14}/>Email</button>}
              </div>
            </div>
            <div ref={payslipRef} className="bg-white rounded-xl shadow-lg border overflow-hidden">
              {/* Header Bar */}
              <div className="h-2 bg-gray-800"></div>
              <div className="p-6">
                {/* Title and Company */}
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-500">PAYSLIP</span>
                      <span className="text-lg font-bold text-gray-900">{previewData.payPeriod.toUpperCase()}</span>
                    </div>
                    <p className="text-sm font-bold text-gray-800">{COMPANY_DATA[previewData.company]?.fullName}</p>
                    <p className="text-xs text-gray-500">{COMPANY_DATA[previewData.company]?.address}</p>
                  </div>
                  <img src={COMPANY_DATA[previewData.company]?.logo} alt="" className="w-14 h-14 object-contain" onError={e=>{(e.target as any).style.display='none'}}/>
                </div>
                <hr className="border-gray-300 my-4"/>
                
                {/* Employee Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 text-sm">
                  <div><p className="text-xs text-gray-400 border-b pb-1">Emp No</p><p className="font-medium mt-1">{editingSlip ? <input className="w-full border-b bg-transparent" value={editingSlip.employeeId} onChange={e=>setEditingSlip({...editingSlip,employeeId:e.target.value})}/> : previewData.employeeId}</p></div>
                  <div><p className="text-xs text-gray-400 border-b pb-1">Date Joined</p><p className="font-medium mt-1">{previewData.joiningDate || 'N/A'}</p></div>
                  <div><p className="text-xs text-gray-400 border-b pb-1">Department</p><p className="font-medium mt-1">{previewData.department || 'N/A'}</p></div>
                  <div><p className="text-xs text-gray-400 border-b pb-1">Designation</p><p className="font-medium mt-1">{previewData.designation}</p></div>
                  <div><p className="text-xs text-gray-400 border-b pb-1">Employee Name</p><p className="font-medium mt-1">{previewData.employeeName}</p></div>
                  <div><p className="text-xs text-gray-400 border-b pb-1">Payment Mode</p><p className="font-medium mt-1">Bank Transfer</p></div>
                  <div><p className="text-xs text-gray-400 border-b pb-1">Bank</p><p className="font-medium mt-1">{previewData.bankName || 'N/A'}</p></div>
                  <div><p className="text-xs text-gray-400 border-b pb-1">Bank A/C No</p><p className="font-medium mt-1">{previewData.bankAccountNo || 'N/A'}</p></div>
                </div>
                <hr className="border-gray-200 my-4"/>
                
                {/* Salary Details Header */}
                <h4 className="font-bold text-gray-800 mb-3 text-sm tracking-wide">SALARY DETAILS</h4>
                <div className="grid grid-cols-5 gap-2 mb-4">
                  <div className="bg-gray-50 rounded-lg p-2 text-center border">
                    <p className="text-[10px] text-gray-500">Total Working Days</p>
                    <p className="font-bold text-sm">{previewData.totalWorkingDays}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center border">
                    <p className="text-[10px] text-gray-500">Paid Days</p>
                    <p className="font-bold text-sm text-green-700">{previewData.paidDays}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center border">
                    <p className="text-[10px] text-gray-500">LOP Days</p>
                    <p className="font-bold text-sm text-red-600">{previewData.lopDays}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center border">
                    <p className="text-[10px] text-gray-500">Leaves</p>
                    <p className="font-bold text-sm text-amber-600">{previewData.leaves || 0}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center border">
                    <p className="text-[10px] text-gray-500">Paid Leaves</p>
                    <p className="font-bold text-sm text-blue-600">{previewData.paidLeaves || 0}</p>
                  </div>
                </div>
                
                {/* Earnings & Deductions Table */}
                <div className="border rounded-lg overflow-hidden mb-4">
                  <div className="grid grid-cols-2">
                    <div className="border-r">
                      <div className="bg-gray-800 text-white px-4 py-2 flex justify-between text-xs font-semibold"><span>EARNINGS</span><span>AMOUNT</span></div>
                      {previewData.earnings.filter(e=>e.amount>0).map((e,i)=>(
                        <div key={i} className={`px-4 py-2 flex justify-between text-sm ${i%2===0?'bg-white':'bg-gray-50'}`}>
                          <span className="text-gray-700">{e.label}</span>
                          <span className="font-medium">{formatINR(e.amount)}</span>
                        </div>
                      ))}
                      <div className="bg-green-50 px-4 py-2 flex justify-between text-sm font-bold border-t border-green-200">
                        <span>Total Earnings (A)</span><span className="text-green-700">{formatINR(previewData.grossEarnings)}</span>
                      </div>
                    </div>
                    <div>
                      <div className="bg-gray-800 text-white px-4 py-2 flex justify-between text-xs font-semibold"><span>DEDUCTIONS</span><span>AMOUNT</span></div>
                      {previewData.deductions.filter(d=>d.amount>0).map((d,i)=>(
                        <div key={i} className={`px-4 py-2 flex justify-between text-sm ${i%2===0?'bg-white':'bg-gray-50'}`}>
                          <span className="text-gray-700">{d.label}</span>
                          <span className="font-medium">{formatINR(d.amount)}</span>
                        </div>
                      ))}
                      <div className="bg-red-50 px-4 py-2 flex justify-between text-sm font-bold border-t border-red-200">
                        <span>Total Deductions (B)</span><span className="text-red-700">{formatINR(previewData.totalDeductions)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Net Pay */}
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 flex justify-between items-center mb-3">
                  <div><p className="font-bold text-gray-900">Net Salary Payable (A - B)</p></div>
                  <p className="text-2xl font-bold text-green-700">{formatINR(previewData.netPayable)}</p>
                </div>
                <p className="text-sm text-gray-600 mb-2"><span className="text-gray-400">Net Salary in words:</span> <b>{numberToWords(previewData.netPayable)}</b></p>
                <hr className="my-3"/>
                <p className="text-xs text-red-500">**Note: All amounts displayed in this payslip are in <b>INR</b></p>
                <p className="text-xs text-gray-400 mt-2 italic">*This is a system generated salary slip and does not require signature.</p>
              </div>
            </div>
          </div>
        )}

        {/* REQUESTS */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            {(!isAdmin || isSupervisor) && (
              <div className="bg-white rounded-xl border p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-4">Request Payslip</h3>
                <p className="text-sm text-gray-500 mb-4">Select the duration for your payslip request. HR/IT will process it.</p>
                {requestSuccess && (
                  <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-green-600"/>
                    <span className="text-sm text-green-700 font-medium">✅ Request submitted successfully! HR/Admin will review your request.</span>
                  </div>
                )}
                {requestError && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                    <XCircle size={16} className="text-red-600"/>
                    <span className="text-sm text-red-700 font-medium">{requestError}</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  {[1,2,3,6].map(m => (
                    <button key={m} onClick={() => handleAgentRequest(m)}
                      disabled={requestSubmitting}
                      className={`border-2 border-gray-200 hover:border-gray-800 hover:bg-gray-50 rounded-xl px-6 py-3 font-medium transition-all ${requestSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      {requestSubmitting ? <RefreshCw size={14} className="inline animate-spin mr-2"/> : null}
                      {m} Month{m>1?'s':''}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Loading state */}
            {loadingRequests && requests.length === 0 && (
              <div className="text-center py-4"><RefreshCw size={20} className="inline animate-spin text-gray-400 mr-2"/>Loading requests...</div>
            )}
            <div className="bg-white rounded-xl border shadow-sm">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold">{(isAdmin && !isSupervisor) ? 'All Payslip Requests' : 'My Requests'}</h3>
                {(isAdmin && !isSupervisor) && pendingRequestCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2.5 py-1 rounded-full font-bold animate-pulse">{pendingRequestCount} Pending</span>
                )}
                <button onClick={fetchRequests} className="text-gray-500 hover:text-gray-700 p-1.5 rounded hover:bg-gray-100" title="Refresh"><RefreshCw size={14}/></button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50"><tr>
                    <th className="text-left px-4 py-3">Employee</th>
                    <th className="text-left px-4 py-3">Company</th>
                    <th className="text-left px-4 py-3">Requested Period</th>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-center px-4 py-3">Status</th>
                    {(isAdmin && !isSupervisor) && <th className="text-center px-4 py-3">Actions</th>}
                  </tr></thead>
                  <tbody>
                    {((isAdmin && !isSupervisor) ? requests : requests.filter(r => r.employeeName === currentUser?.name)).map(r => (
                      <tr key={r.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{r.employeeName}</td>
                        <td className="px-4 py-3">{COMPANY_DATA[r.company]?.short||r.company}</td>
                        <td className="px-4 py-3">{r.requestedMonth}</td>
                        <td className="px-4 py-3">{r.requestDate}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.status==='Pending'?'bg-amber-100 text-amber-700':r.status==='Approved'?'bg-green-100 text-green-700':r.status==='Rejected'?'bg-red-100 text-red-700':'bg-blue-100 text-blue-700'}`}>{r.status}</span>
                          {(r as any).reviewedBy && <div className="text-[10px] text-gray-500 mt-0.5">by {(r as any).reviewedBy}</div>}
                        </td>
                        {(isAdmin && !isSupervisor) && (
                          <td className="px-4 py-3 text-center">
                            {r.status === 'Pending' && (
                              <div className="flex justify-center gap-1">
                                <button onClick={() => { client.api.fetch(`/api/public/payslip-requests/${r.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({status:'Approved', reviewedBy: currentUser?.name||''}) }).then(()=>fetchRequests()); setRequests(prev=>prev.map(p=>p.id===r.id?{...p,status:'Approved'}:p)); playNotificationSound('send'); }} className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs hover:bg-green-200">Approve</button>
                                <button onClick={() => { client.api.fetch(`/api/public/payslip-requests/${r.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({status:'Rejected', reviewedBy: currentUser?.name||''}) }).then(()=>fetchRequests()); setRequests(prev=>prev.map(p=>p.id===r.id?{...p,status:'Rejected'}:p)); }} className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs hover:bg-red-200">Reject</button>
                              </div>
                            )}
                            {r.status === 'Approved' && (
                              <button onClick={() => {setActiveTab('generate'); const emp = users.find((u:any)=>u.name===r.employeeName); if(emp) handleSelectEmployee(emp);}}
                                className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs hover:bg-blue-200">Generate</button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                    {requests.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-400">No requests yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TEMPLATES */}
        {activeTab === 'templates' && isAdmin && !isSupervisor && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Salary Templates</h3>
              <button onClick={() => {
                const t: SalaryTemplate = { id: Date.now().toString(36), name: 'New Template', position: 'Sales Executive', earnings: [...DEFAULT_EARNINGS], deductions: [...DEFAULT_DEDUCTIONS] };
                setTemplates(prev => [...prev, t]);
              }} className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"><Plus size={16}/>Add Template</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(t => (
                <div key={t.id} className="bg-white rounded-xl border p-5 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-3">
                    <div><h4 className="font-bold text-gray-900">{t.name}</h4><p className="text-xs text-gray-500">{t.position}</p></div>
                    <button onClick={() => setTemplates(prev=>prev.filter(x=>x.id!==t.id))} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                  </div>
                  <div className="text-sm space-y-1 mb-3">
                    <p className="text-green-600 font-medium">Earnings: {formatINR(t.earnings.reduce((s,e)=>s+e.amount,0))}</p>
                    <p className="text-red-600 font-medium">Deductions: {formatINR(t.deductions.reduce((s,d)=>s+d.amount,0))}</p>
                    <p className="font-bold text-gray-900">Net: {formatINR(t.earnings.reduce((s,e)=>s+e.amount,0)-t.deductions.reduce((s,d)=>s+d.amount,0))}</p>
                  </div>
                  <button onClick={() => {applyTemplate(t);setActiveTab('generate');}} className="w-full bg-gray-100 hover:bg-gray-800 hover:text-white py-2 rounded-lg text-sm font-medium transition">Use Template</button>
                </div>
              ))}
            </div>
          </div>
        )}


        {/* BULK GENERATE */}
        {activeTab === 'bulk' && isAdmin && !isSupervisor && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold">Bulk Payslip Generation</h3>
            {bulkStep === 'select' && (
              <div className="bg-white rounded-xl border p-6 shadow-sm">
                <p className="text-sm text-gray-600 mb-4">Select employees and a salary template. You can preview and edit before generating.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium block mb-1">Month</label>
                    <select value={payPeriodMonth} onChange={e=>setPayPeriodMonth(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                      {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Template</label>
                    <select className="w-full border rounded-lg px-3 py-2 text-sm" id="bulk-template">
                      {templates.map(t => <option key={t.id} value={t.id}>{t.name} - Net: {formatINR(t.earnings.reduce((s,e)=>s+e.amount,0)-t.deductions.reduce((s,d)=>s+d.amount,0))}</option>)}
                    </select>
                  </div>
                </div>
                <div className="border rounded-lg max-h-64 overflow-y-auto mb-4">
                  {users.filter((u:any)=>u.status==='Active'&&getCompanyFromUserField(u.company)===selectedCompany).map((u:any) => (
                    <label key={u.id} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 border-b cursor-pointer">
                      <input type="checkbox" className="rounded" data-userid={u.id}/>
                      <span className="text-sm font-medium">{u.name}</span>
                      <span className="text-xs text-gray-400">{u.role}</span>
                    </label>
                  ))}
                </div>
                <button onClick={() => {
                  const tplId = (document.getElementById('bulk-template') as HTMLSelectElement)?.value;
                  const tpl = templates.find(t=>t.id===tplId);
                  if (!tpl) { alert('Select a template'); return; }
                  const checkboxes = document.querySelectorAll<HTMLInputElement>('[data-userid]:checked');
                  if (!checkboxes.length) { alert('Select at least one employee'); return; }
                  const previews: PayslipData[] = [];
                  checkboxes.forEach(cb => {
                    const uid = Number(cb.dataset.userid);
                    const user = users.find((u:any)=>u.id===uid) as any;
                    if (!user) return;
                    const comp = getCompanyFromUserField(user.company);
                    const monthIdx = MONTHS.indexOf(payPeriodMonth);
                    const year = parseInt(payPeriodYear);
                    const days = getDaysInMonth(monthIdx, year);
                    let sundays = 0;
                    for (let d = 1; d <= days; d++) { if (new Date(year, monthIdx, d).getDay() === 0) sundays++; }
                    const workingDays = days - sundays;
                    // Get attendance
                    const userEntries = attendanceSheet.filter((e: any) => e.userId === user.id && new Date(e.date).getMonth() === monthIdx && new Date(e.date).getFullYear() === year);
                    const presentFull = userEntries.filter((e: any) => e.status === 'Present').length;
                    const halfDays = userEntries.filter((e: any) => e.status === 'Half Day').length;
                    const paidLeaveCount = userEntries.filter((e: any) => e.status === 'Paid Leave').length;
                    const compOff = userEntries.filter((e: any) => e.status === 'Comp Off').length;
                    const absentCount = userEntries.filter((e: any) => e.status === 'Absent').length;
                    const nonPaidLeave = userEntries.filter((e: any) => e.status === 'Non-Paid Leave').length;
                    const totalPaid = presentFull + Math.ceil(halfDays * 0.5) + paidLeaveCount + compOff;
                    const lopCount = absentCount + nonPaidLeave;
                    previews.push({
                      id: Date.now().toString(36) + uid,
                      company: comp,
                      companyLogo: COMPANY_DATA[comp].logo,
                      employeeName: user.name,
                      employeeId: String(user.id).padStart(5,'0'),
                      designation: user.role || '',
                      department: user.role?.includes('Sales') ? 'Sales' : 'Operations',
                      bankName: '',
                      bankAccountNo: '',
                      joiningDate: (() => { try { const jd = user.created ? new Date(user.created) : null; return jd && !isNaN(jd.getTime()) ? jd.toISOString().split('T')[0] : ''; } catch { return ''; } })(),
                      payPeriod: `${payPeriodMonth} ${payPeriodYear}`,
                      payDate: new Date().toISOString().split('T')[0],
                      totalWorkingDays: workingDays,
                      paidDays: totalPaid || workingDays,
                      lopDays: lopCount,
                      leaves: absentCount + nonPaidLeave + halfDays,
                      paidLeaves: paidLeaveCount,
                      earnings: [...tpl.earnings],
                      deductions: [...tpl.deductions],
                      grossEarnings: tpl.earnings.reduce((s,e)=>s+e.amount,0),
                      totalDeductions: tpl.deductions.reduce((s,d)=>s+d.amount,0),
                      netPayable: tpl.earnings.reduce((s,e)=>s+e.amount,0) - tpl.deductions.reduce((s,d)=>s+d.amount,0),
                      status: 'Generated',
                      createdAt: new Date().toISOString(),
                      createdBy: currentUser?.name||'System',
                    });
                  });
                  setBulkPreviewList(previews);
                  setBulkStep('preview');
                }} className="bg-gray-800 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-900 flex items-center gap-2"><Eye size={16}/>Preview Selected</button>
              </div>
            )}
            {bulkStep === 'preview' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">{bulkPreviewList.length} payslips ready to generate. Review and edit below.</p>
                  <div className="flex gap-2">
                    <button onClick={() => setBulkStep('select')} className="border px-4 py-2 rounded-lg text-sm">Back</button>
                    <button onClick={() => {
                      setPayslips(prev => [...bulkPreviewList, ...prev]);
                      playNotificationSound('send');
                      addNotification({ title: 'Bulk Generation', message: `${bulkPreviewList.length} payslips generated!`, type: 'success' });
                      setBulkStep('done');
                    }} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1"><CheckCircle2 size={14}/>Confirm & Generate All</button>
                  </div>
                </div>
                {bulkPreviewList.map((bp, idx) => (
                  <div key={bp.id} className="bg-white rounded-xl border p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-3">
                        <span className="bg-gray-800 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold">{idx+1}</span>
                        <div><p className="font-bold text-sm">{bp.employeeName}</p><p className="text-xs text-gray-500">{bp.designation} | ID: {bp.employeeId}</p></div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-green-700 font-bold">{formatINR(bp.netPayable)}</span>
                        <button onClick={() => {setPreviewData(bp);setEditingSlip(bp);setActiveTab('preview');}} className="text-blue-600 text-xs hover:underline flex items-center gap-1"><Edit3 size={12}/>Edit</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <span className="text-gray-500">Working Days: <b>{bp.totalWorkingDays}</b></span>
                      <span className="text-green-600">Paid: <b>{bp.paidDays}</b></span>
                      <span className="text-red-600">LOP: <b>{bp.lopDays}</b></span>
                      <span className="text-gray-600">Gross: <b>{formatINR(bp.grossEarnings)}</b></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {bulkStep === 'done' && (
              <div className="bg-white rounded-xl border p-8 text-center">
                <CheckCircle2 size={48} className="mx-auto mb-4 text-green-500"/>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{bulkPreviewList.length} Payslips Generated Successfully!</h3>
                <p className="text-gray-500 mb-6">All payslips have been saved and are ready for download/email.</p>
                <div className="flex justify-center gap-3">
                  <button onClick={() => {setBulkStep('select');setBulkPreviewList([]);}} className="border px-6 py-2 rounded-lg">Generate More</button>
                  <button onClick={() => setActiveTab('dashboard')} className="bg-gray-800 text-white px-6 py-2 rounded-lg">View Dashboard</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* EXPERIENCE LETTER */}
        {activeTab === 'experience' && isAdmin && !isSupervisor && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form */}
              <div className="bg-white rounded-xl border p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Award size={20}/>Generate Experience Letter</h3>
                <div className="space-y-4">
                  <div><label className="text-xs font-medium text-gray-500 block mb-1">Employee Name</label>
                    <input value={expEmployeeName} onChange={e=>setExpEmployeeName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Full name"/></div>
                  <div><label className="text-xs font-medium text-gray-500 block mb-1">Designation</label>
                    <select value={expDesignation} onChange={e=>setExpDesignation(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                      <option value="">Select...</option>
                      {POSITIONS.map(p=><option key={p} value={p}>{p}</option>)}
                    </select></div>
                  <div><label className="text-xs font-medium text-gray-500 block mb-1">Department</label>
                    <input value={expDepartment} onChange={e=>setExpDepartment(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Sales, IT, HR"/></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs font-medium text-gray-500 block mb-1">Joining Date</label>
                      <input type="date" value={expJoiningDate} onChange={e=>setExpJoiningDate(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm"/></div>
                    <div><label className="text-xs font-medium text-gray-500 block mb-1">Last Working Date</label>
                      <input type="date" value={expLastWorkingDate} onChange={e=>setExpLastWorkingDate(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm"/></div>
                  </div>
                  {editingExp && (
                    <div><label className="text-xs font-medium text-gray-500 block mb-1">Letter Content (Editable)</label>
                      <textarea value={expContent} onChange={e=>setExpContent(e.target.value)} rows={12} className="w-full border rounded-lg px-3 py-2 text-sm font-mono"/></div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={generateExpLetter} disabled={!expEmployeeName||!expDesignation||!expJoiningDate||!expLastWorkingDate}
                      className="bg-gray-800 hover:bg-gray-900 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2"><FileText size={14}/>{expPreview ? 'Regenerate' : 'Generate Letter'}</button>
                    <button onClick={() => setEditingExp(!editingExp)} className="border px-4 py-2.5 rounded-lg text-sm flex items-center gap-2"><Edit3 size={14}/>{editingExp ? 'Hide Editor' : 'Edit Content'}</button>
                  </div>
                </div>
              </div>
              {/* Preview */}
              <div>
                {expPreview ? (
                  <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <div className="h-1.5 bg-gray-800"></div>
                    <div className="p-6">
                      <div className="text-center mb-6">
                        <img src={COMPANY_DATA[selectedCompany].logo} alt="" className="w-12 h-12 object-contain mx-auto mb-2" onError={e=>{(e.target as any).style.display='none'}}/>
                        <h3 className="font-bold text-gray-800">{COMPANY_DATA[selectedCompany].fullName}</h3>
                        <p className="text-xs text-gray-500">{COMPANY_DATA[selectedCompany].address}</p>
                        <hr className="my-3"/>
                        <h2 className="text-lg font-bold text-gray-900 tracking-wide">EXPERIENCE CERTIFICATE</h2>
                        <p className="text-xs text-gray-400 mt-1">Ref: {COMPANY_DATA[selectedCompany].short}/EXP/{expPreview.id.toUpperCase()} | Date: {new Date(expPreview.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'})}</p>
                      </div>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{expPreview.content}</div>
                    </div>
                    <div className="border-t p-4 flex gap-2 justify-end bg-gray-50">
                      <button onClick={() => downloadExpLetterPDF(expPreview)} className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1"><Download size={14}/>Download PDF</button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
                    <Award size={48} className="mx-auto mb-4 text-gray-300"/>
                    <p className="text-gray-400">Fill the form and generate to see preview</p>
                  </div>
                )}
                {/* Previous Letters */}
                {experienceLetters.length > 0 && (
                  <div className="mt-4 bg-white rounded-xl border p-4">
                    <h4 className="font-semibold text-sm mb-3">Previous Letters</h4>
                    {experienceLetters.slice(0,5).map(l => (
                      <div key={l.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div><p className="text-sm font-medium">{l.employeeName}</p><p className="text-xs text-gray-400">{l.designation} | {new Date(l.createdAt).toLocaleDateString()}</p></div>
                        <div className="flex gap-1">
                          <button onClick={() => {setExpPreview(l);setExpContent(l.content);}} className="p-1.5 hover:bg-gray-100 rounded"><Eye size={14}/></button>
                          <button onClick={() => downloadExpLetterPDF(l)} className="p-1.5 hover:bg-gray-100 rounded"><Download size={14}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* REPORTS */}
        {activeTab === 'reports' && isAdmin && !isSupervisor && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold">Payroll Reports</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border p-6 text-center hover:shadow-md transition cursor-pointer" onClick={() => {
                const csv = ['Employee,ID,Company,Period,Designation,Gross,Deductions,Net,Status',...payslips.map(p=>`"${p.employeeName}",${p.employeeId},${COMPANY_DATA[p.company]?.name},"${p.payPeriod}","${p.designation}",${p.grossEarnings},${p.totalDeductions},${p.netPayable},${p.status}`)].join('\n');
                const blob = new Blob([csv],{type:'text/csv'});
                const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='payroll_report.csv'; a.click();
              }}>
                <Download size={32} className="mx-auto mb-3 text-green-600"/>
                <h4 className="font-bold">Export All Payslips</h4>
                <p className="text-xs text-gray-500 mt-1">Download CSV with all payslip data</p>
              </div>
              <div className="bg-white rounded-xl border p-6 text-center hover:shadow-md transition cursor-pointer" onClick={() => {
                const month = MONTHS[new Date().getMonth()];
                const monthData = payslips.filter(p => p.payPeriod.includes(month) && p.company === selectedCompany);
                alert(`${COMPANY_DATA[selectedCompany].short} - ${month}:\n${monthData.length} payslips\nTotal: ${formatINR(monthData.reduce((s,p)=>s+p.netPayable,0))}`);
              }}>
                <BarChart3 size={32} className="mx-auto mb-3 text-blue-600"/>
                <h4 className="font-bold">Monthly Summary</h4>
                <p className="text-xs text-gray-500 mt-1">View current month payroll</p>
              </div>
              <div className="bg-white rounded-xl border p-6 text-center hover:shadow-md transition cursor-pointer" onClick={() => {
                const csv = ['Employee,Company,Requested Period,Date,Status',...requests.map(r=>`"${r.employeeName}",${r.company},"${r.requestedMonth}",${r.requestDate},${r.status}`)].join('\n');
                const blob = new Blob([csv],{type:'text/csv'});
                const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='payslip_requests.csv'; a.click();
              }}>
                <FileText size={32} className="mx-auto mb-3 text-purple-600"/>
                <h4 className="font-bold">Export Requests</h4>
                <p className="text-xs text-gray-500 mt-1">Download all request data</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
