/**
 * Real Estate Commission Calculator WebApp (v2.0)
 * Robust, Reactive, and Defensive Implementation
 */

// Application State
const DEFAULTS = {
  companyRate: 3.0,
  salesRate: 7.0,
  tier1Rate: 7.5,
  tier2Rate: 10.0,
  tier3Rate: 15.0
};

let activeTab = 'tier'; // 'tier' | 'single'
let deals = []; // [{ id: string, price: number }]
let singleChart = null;
let tierSummaryChart = null;

// Initialize on DOM Ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

function initApp() {
  try {
    loadSettingsFromStorage();
    loadDealsFromStorage();
    loadActiveTabFromStorage();

    setupGlobalEventListeners();
    setupTabNavigation();
    setupSettingsToggle();

    renderDeals();
    calculateAll();
    
    // Safely initialize charts after DOM is fully painted
    setTimeout(() => {
      initChartsSafely();
      calculateAll();
    }, 50);

    // Refresh icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  } catch (err) {
    console.error('Error during initApp:', err);
  }
}

// --- Number Formatting Helpers ---
function formatNumber(num) {
  if (num === null || num === undefined || num === '' || isNaN(num)) return '';
  const n = Number(num);
  return n.toLocaleString('en-US');
}

function parseNumber(str) {
  if (!str) return 0;
  const clean = String(str).replace(/,/g, '').replace(/[^0-9.]/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}

function formatCurrency(num) {
  if (num === null || num === undefined || isNaN(num)) return '0.00';
  return Number(num).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatInputFieldWithCommas(input) {
  if (!input) return;
  const cursorPosition = input.selectionStart;
  const originalLength = input.value.length;
  
  const rawValue = input.value.replace(/[^0-9.]/g, '');
  if (!rawValue) {
    input.value = '';
    return;
  }
  const parts = rawValue.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  if (parts.length > 2) {
    input.value = parts[0] + '.' + parts.slice(1).join('');
  } else {
    input.value = parts.join('.');
  }
}

// --- Settings Management ---
function getSettings() {
  const companyInput = document.getElementById('companyRate');
  const salesInput = document.getElementById('salesRate');
  const tier1Input = document.getElementById('tier1Rate');
  const tier2Input = document.getElementById('tier2Rate');
  const tier3Input = document.getElementById('tier3Rate');

  return {
    companyRate: companyInput ? (parseFloat(companyInput.value) || 0) : DEFAULTS.companyRate,
    salesRate: salesInput ? (parseFloat(salesInput.value) || 0) : DEFAULTS.salesRate,
    tier1Rate: tier1Input ? (parseFloat(tier1Input.value) || 0) : DEFAULTS.tier1Rate,
    tier2Input: tier2Input ? (parseFloat(tier2Input.value) || 0) : DEFAULTS.tier2Rate,
    tier3Rate: tier3Input ? (parseFloat(tier3Input.value) || 0) : DEFAULTS.tier3Rate,
    tier2Rate: tier2Input ? (parseFloat(tier2Input.value) || 0) : DEFAULTS.tier2Rate
  };
}

function saveSettingsToStorage() {
  try {
    const s = getSettings();
    localStorage.setItem('comm_companyRate', s.companyRate);
    localStorage.setItem('comm_salesRate', s.salesRate);
    localStorage.setItem('comm_tier1Rate', s.tier1Rate);
    localStorage.setItem('comm_tier2Rate', s.tier2Rate);
    localStorage.setItem('comm_tier3Rate', s.tier3Rate);
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }
}

function loadSettingsFromStorage() {
  try {
    const setVal = (id, key, defaultVal) => {
      const el = document.getElementById(id);
      if (el) {
        const stored = localStorage.getItem(key);
        el.value = (stored !== null && stored !== '') ? stored : defaultVal;
      }
    };

    setVal('companyRate', 'comm_companyRate', DEFAULTS.companyRate);
    setVal('salesRate', 'comm_salesRate', DEFAULTS.salesRate);
    setVal('tier1Rate', 'comm_tier1Rate', DEFAULTS.tier1Rate);
    setVal('tier2Rate', 'comm_tier2Rate', DEFAULTS.tier2Rate);
    setVal('tier3Rate', 'comm_tier3Rate', DEFAULTS.tier3Rate);
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }
}

function saveDealsToStorage() {
  try {
    localStorage.setItem('comm_deals', JSON.stringify(deals));
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }
}

function loadDealsFromStorage() {
  try {
    const stored = localStorage.getItem('comm_deals');
    if (stored) {
      deals = JSON.parse(stored) || [];
    } else {
      // Default 3 sample deals for first-time visitors
      deals = [
        { id: 'deal_' + Date.now() + '_1', price: 2000000 },
        { id: 'deal_' + Date.now() + '_2', price: 2500000 },
        { id: 'deal_' + Date.now() + '_3', price: 3000000 }
      ];
    }
  } catch (e) {
    deals = [];
  }
}

function loadActiveTabFromStorage() {
  try {
    const storedTab = localStorage.getItem('comm_activeTab');
    if (storedTab === 'single' || storedTab === 'tier') {
      activeTab = storedTab;
    }
  } catch (e) {
    activeTab = 'tier';
  }
}

// --- Tab Navigation ---
function setupTabNavigation() {
  const tabBtnTier = document.getElementById('tabBtnTier');
  const tabBtnSingle = document.getElementById('tabBtnSingle');

  if (tabBtnTier) {
    tabBtnTier.addEventListener('click', () => switchTab('tier'));
  }
  if (tabBtnSingle) {
    tabBtnSingle.addEventListener('click', () => switchTab('single'));
  }

  // Initial tab view apply
  switchTab(activeTab);
}

function switchTab(tabName) {
  activeTab = tabName;
  const tabBtnTier = document.getElementById('tabBtnTier');
  const tabBtnSingle = document.getElementById('tabBtnSingle');
  const tabContentTier = document.getElementById('tabContentTier');
  const tabContentSingle = document.getElementById('tabContentSingle');

  if (tabName === 'tier') {
    if (tabBtnTier) tabBtnTier.classList.add('active');
    if (tabBtnSingle) tabBtnSingle.classList.remove('active');
    if (tabContentTier) tabContentTier.classList.remove('hidden');
    if (tabContentSingle) tabContentSingle.classList.add('hidden');
  } else {
    if (tabBtnSingle) tabBtnSingle.classList.add('active');
    if (tabBtnTier) tabBtnTier.classList.remove('active');
    if (tabContentSingle) tabContentSingle.classList.remove('hidden');
    if (tabContentTier) tabContentTier.classList.add('hidden');
  }

  try {
    localStorage.setItem('comm_activeTab', activeTab);
  } catch (e) {}

  calculateAll();
}

// --- Settings Collapsible ---
function setupSettingsToggle() {
  const header = document.getElementById('settingsToggleHeader');
  const body = document.getElementById('settingsBody');
  const icon = document.getElementById('settingsChevronIcon');

  let isOpen = true;
  if (header && body) {
    header.addEventListener('click', (e) => {
      if (e.target.closest('#resetSettingsBtn')) return;
      isOpen = !isOpen;
      body.classList.toggle('hidden', !isOpen);
      if (icon) {
        icon.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(-90deg)';
      }
    });
  }
}

// --- Global Event Listeners (Event Delegation) ---
function setupGlobalEventListeners() {
  // Settings Inputs
  ['companyRate', 'salesRate', 'tier1Rate', 'tier2Rate', 'tier3Rate'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        saveSettingsToStorage();
        calculateAll();
      });
    }
  });

  // Reset Settings Button
  const resetBtn = document.getElementById('resetSettingsBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('companyRate').value = DEFAULTS.companyRate;
      document.getElementById('salesRate').value = DEFAULTS.salesRate;
      document.getElementById('tier1Rate').value = DEFAULTS.tier1Rate;
      document.getElementById('tier2Rate').value = DEFAULTS.tier2Rate;
      document.getElementById('tier3Rate').value = DEFAULTS.tier3Rate;
      saveSettingsToStorage();
      calculateAll();
      showToast('รีเซ็ตอัตราค่าคอมเริ่มต้นเรียบร้อยแล้ว');
    });
  }

  // New Deal Input (Tier Mode)
  const newDealInput = document.getElementById('newDealPriceInput');
  if (newDealInput) {
    newDealInput.addEventListener('input', (e) => {
      formatInputFieldWithCommas(e.target);
    });
    newDealInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddNewDeal();
      }
    });
  }

  // Add New Deal Button
  const addBtn = document.getElementById('addNewDealBtn');
  if (addBtn) {
    addBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleAddNewDeal();
    });
  }

  // Sample Data Button
  const sampleBtn = document.getElementById('sampleDataBtn');
  if (sampleBtn) {
    sampleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      deals = [
        { id: 'deal_' + Date.now() + '_1', price: 2000000 },
        { id: 'deal_' + Date.now() + '_2', price: 2500000 },
        { id: 'deal_' + Date.now() + '_3', price: 1800000 },
        { id: 'deal_' + Date.now() + '_4', price: 3200000 },
        { id: 'deal_' + Date.now() + '_5', price: 4000000 },
        { id: 'deal_' + Date.now() + '_6', price: 5000000 }
      ];
      saveDealsToStorage();
      renderDeals();
      calculateTierMode();
      showToast('โหลดตัวอย่างข้อมูล 6 หลังครบทุก Tier แล้ว');
    });
  }

  // Clear All Deals Button
  const clearAllBtn = document.getElementById('clearAllDealsBtn');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (deals.length === 0) return;
      if (confirm('คุณต้องการล้างรายการบ้านทั้งหมดใช่หรือไม่?')) {
        deals = [];
        saveDealsToStorage();
        renderDeals();
        calculateTierMode();
        showToast('ล้างรายการบ้านทั้งหมดเรียบร้อย');
      }
    });
  }

  // Single Mode Inputs
  const housePriceInput = document.getElementById('housePriceInput');
  if (housePriceInput) {
    housePriceInput.addEventListener('input', (e) => {
      formatInputFieldWithCommas(e.target);
      calculateSingleForward();
    });
  }

  const clearHousePriceBtn = document.getElementById('clearHousePriceBtn');
  if (clearHousePriceBtn) {
    clearHousePriceBtn.addEventListener('click', () => {
      if (housePriceInput) {
        housePriceInput.value = '';
        calculateSingleForward();
        housePriceInput.focus();
      }
    });
  }

  const targetCommInput = document.getElementById('targetCommInput');
  if (targetCommInput) {
    targetCommInput.addEventListener('input', (e) => {
      formatInputFieldWithCommas(e.target);
      calculateSingleReverse();
    });
  }

  const clearTargetCommBtn = document.getElementById('clearTargetCommBtn');
  if (clearTargetCommBtn) {
    clearTargetCommBtn.addEventListener('click', () => {
      if (targetCommInput) {
        targetCommInput.value = '';
        calculateSingleReverse();
        targetCommInput.focus();
      }
    });
  }

  // Copy & Print Actions
  const copyBtn = document.getElementById('copySummaryBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', copyCalculationSummary);
  }

  const printBtn = document.getElementById('printPageBtn');
  if (printBtn) {
    printBtn.addEventListener('click', () => window.print());
  }

  // Unified Click Handler via Event Delegation for Quick Chips & Dynamic Buttons
  document.addEventListener('click', (e) => {
    // 1. Quick Add Chips (.chip-quick-add)
    const quickAddChip = e.target.closest('.chip-quick-add');
    if (quickAddChip) {
      e.preventDefault();
      const val = quickAddChip.getAttribute('data-value');
      const input = document.getElementById('newDealPriceInput');
      if (input && val) {
        input.value = formatNumber(val);
        input.focus();
        showToast(`เลือกราคา ${formatNumber(val)} บาท กดปุ่ม "+ เพิ่มรายการ" เพื่อเพิ่ม`);
      }
      return;
    }

    // 2. Single Mode House Price Chips (.chip-house-price)
    const houseChip = e.target.closest('.chip-house-price');
    if (houseChip) {
      e.preventDefault();
      const val = houseChip.getAttribute('data-value');
      const input = document.getElementById('housePriceInput');
      if (input && val) {
        input.value = formatNumber(val);
        calculateSingleForward();
        input.focus();
      }
      return;
    }

    // 3. Single Mode Target Commission Chips (.chip-target-comm)
    const targetChip = e.target.closest('.chip-target-comm');
    if (targetChip) {
      e.preventDefault();
      const val = targetChip.getAttribute('data-value');
      const input = document.getElementById('targetCommInput');
      if (input && val) {
        input.value = formatNumber(val);
        calculateSingleReverse();
        input.focus();
      }
      return;
    }

    // 4. Dynamic Deal Delete Button (.delete-deal-btn)
    const deleteBtn = e.target.closest('.delete-deal-btn');
    if (deleteBtn) {
      e.preventDefault();
      const dealId = deleteBtn.getAttribute('data-id');
      if (dealId) {
        deals = deals.filter(d => d.id !== dealId);
        saveDealsToStorage();
        renderDeals();
        calculateTierMode();
        showToast('ลบรายการบ้านเรียบร้อยแล้ว');
      }
      return;
    }
  });

  // Unified Input Handler for Dynamic Table Deal Inputs
  document.addEventListener('input', (e) => {
    if (e.target && e.target.classList.contains('deal-price-input')) {
      formatInputFieldWithCommas(e.target);
      const dealId = e.target.getAttribute('data-id');
      const deal = deals.find(d => d.id === dealId);
      if (deal) {
        deal.price = parseNumber(e.target.value);
        saveDealsToStorage();
        calculateTierMode();
      }
    }
  });
}

// --- Add Deal Handler ---
function handleAddNewDeal() {
  const input = document.getElementById('newDealPriceInput');
  if (!input) return;

  const price = parseNumber(input.value);
  if (price <= 0) {
    showToast('⚠️ กรุณากรอกราคาบ้าน เช่น 2,000,000 หรือคลิกปุ่มลัด');
    input.focus();
    return;
  }

  const newDeal = {
    id: 'deal_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
    price: price
  };

  deals.push(newDeal);
  input.value = '';
  saveDealsToStorage();
  renderDeals();
  calculateTierMode();

  showToast(`✅ เพิ่มรายการหลังที่ ${deals.length} (${formatCurrency(price)} บ.) เรียบร้อย`);
  input.focus();
}

// --- Tier Calculator Helper ---
function getTierForIndex(dealNumber) {
  // dealNumber is 1-based (#1, #2, #3...)
  const s = getSettings();
  if (dealNumber <= 3) {
    return {
      tier: 1,
      name: 'Tier 1 (หลังที่ 1-3)',
      rate: s.tier1Rate,
      badgeClass: 'badge-tier-1'
    };
  } else if (dealNumber <= 5) {
    return {
      tier: 2,
      name: 'Tier 2 (หลังที่ 4-5)',
      rate: s.tier2Rate,
      badgeClass: 'badge-tier-2'
    };
  } else {
    return {
      tier: 3,
      name: 'Tier 3 (หลังที่ 6 ขึ้นไป)',
      rate: s.tier3Rate,
      badgeClass: 'badge-tier-3'
    };
  }
}

// --- Main Calculation Coordinator ---
function calculateAll() {
  updateVisualBanners();
  calculateSingleMode();
  calculateTierMode();
}

function updateVisualBanners() {
  const s = getSettings();

  // Single mode rate banner
  const combinedRate = (s.companyRate * s.salesRate) / 100;
  const formattedCombined = Number(combinedRate.toFixed(4));
  
  const combinedEl = document.getElementById('combinedRateText');
  const formulaEl = document.getElementById('formulaExplanation');
  if (combinedEl) combinedEl.textContent = `${formattedCombined}%`;
  if (formulaEl) formulaEl.textContent = `พนักงานขายได้ค่าคอม จากราคาบ้านคือ ${s.companyRate}% × ${s.salesRate}% = ${formattedCombined}%`;

  // Tier badges & effective text
  const t1Badge = document.getElementById('tier1BadgePercent');
  const t2Badge = document.getElementById('tier2BadgePercent');
  const t3Badge = document.getElementById('tier3BadgePercent');
  if (t1Badge) t1Badge.textContent = `${s.tier1Rate}%`;
  if (t2Badge) t2Badge.textContent = `${s.tier2Rate}%`;
  if (t3Badge) t3Badge.textContent = `${s.tier3Rate}%`;

  const sT1Rate = document.getElementById('summaryTier1RateText');
  const sT2Rate = document.getElementById('summaryTier2RateText');
  const sT3Rate = document.getElementById('summaryTier3RateText');
  if (sT1Rate) sT1Rate.textContent = `${s.tier1Rate}%`;
  if (sT2Rate) sT2Rate.textContent = `${s.tier2Rate}%`;
  if (sT3Rate) sT3Rate.textContent = `${s.tier3Rate}%`;

  const t1Eff = Number(((s.companyRate * s.tier1Rate) / 100).toFixed(4));
  const t2Eff = Number(((s.companyRate * s.tier2Rate) / 100).toFixed(4));
  const t3Eff = Number(((s.companyRate * s.tier3Rate) / 100).toFixed(4));

  const t1EffEl = document.getElementById('tier1EffectiveText');
  const t2EffEl = document.getElementById('tier2EffectiveText');
  const t3EffEl = document.getElementById('tier3EffectiveText');
  if (t1EffEl) t1EffEl.textContent = `คิดเป็น ${t1Eff}% จากราคาขายบ้าน`;
  if (t2EffEl) t2EffEl.textContent = `คิดเป็น ${t2Eff}% จากราคาขายบ้าน`;
  if (t3EffEl) t3EffEl.textContent = `คิดเป็น ${t3Eff}% จากราคาขายบ้าน`;

  updateSingleChartSafely(s.companyRate, s.salesRate);
}

// --- Single Mode Logic ---
function calculateSingleMode() {
  calculateSingleForward();
  calculateSingleReverse();
}

function calculateSingleForward() {
  const s = getSettings();
  const housePriceEl = document.getElementById('housePriceInput');
  const price = parseNumber(housePriceEl ? housePriceEl.value : 0);

  const compCommEl = document.getElementById('resultCompanyComm');
  const salesCommEl = document.getElementById('resultSalesComm');
  const compNetEl = document.getElementById('resultCompanyNet');
  const summaryBox = document.getElementById('forwardCalcSummary');

  if (price > 0 && s.companyRate > 0) {
    const compComm = (price * s.companyRate) / 100;
    const salesComm = (compComm * s.salesRate) / 100;
    const compNet = compComm - salesComm;

    if (compCommEl) compCommEl.textContent = `${formatCurrency(compComm)} บาท`;
    if (salesCommEl) salesCommEl.textContent = `${formatCurrency(salesComm)} บาท`;
    if (compNetEl) compNetEl.textContent = `${formatCurrency(compNet)} บาท`;
    if (summaryBox) summaryBox.classList.remove('opacity-50');
  } else {
    if (compCommEl) compCommEl.textContent = '- บาท';
    if (salesCommEl) salesCommEl.textContent = '- บาท';
    if (compNetEl) compNetEl.textContent = '- บาท';
    if (summaryBox) summaryBox.classList.add('opacity-50');
  }
}

function calculateSingleReverse() {
  const s = getSettings();
  const targetInput = document.getElementById('targetCommInput');
  const targetComm = parseNumber(targetInput ? targetInput.value : 0);
  const combinedRate = (s.companyRate * s.salesRate) / 100;

  const reqPriceEl = document.getElementById('resultReqHousePrice');
  const reqCompEl = document.getElementById('resultReqCompanyComm');
  const reqNetEl = document.getElementById('resultReqCompanyNet');

  if (targetComm > 0 && combinedRate > 0 && s.salesRate > 0 && s.companyRate > 0) {
    const reqHousePrice = targetComm / (combinedRate / 100);
    const reqCompanyComm = (reqHousePrice * s.companyRate) / 100;
    const reqCompanyNet = reqCompanyComm - targetComm;

    if (reqPriceEl) reqPriceEl.textContent = `${formatCurrency(reqHousePrice)} บาท`;
    if (reqCompEl) reqCompEl.textContent = `${formatCurrency(reqCompanyComm)} บาท`;
    if (reqNetEl) reqNetEl.textContent = `${formatCurrency(reqCompanyNet)} บาท`;
  } else {
    if (reqPriceEl) reqPriceEl.textContent = '- บาท';
    if (reqCompEl) reqCompEl.textContent = '- บาท';
    if (reqNetEl) reqNetEl.textContent = '- บาท';
  }
}

// --- Tier Cumulative Mode Logic ---
function calculateTierMode() {
  const s = getSettings();

  let totalSales = 0;
  let totalCompComm = 0;
  let totalSalesComm = 0;

  let t1Count = 0, t1Comm = 0;
  let t2Count = 0, t2Comm = 0;
  let t3Count = 0, t3Comm = 0;

  deals.forEach((deal, index) => {
    const dealNumber = index + 1;
    const tierInfo = getTierForIndex(dealNumber);
    const price = deal.price || 0;

    const compComm = (price * s.companyRate) / 100;
    const empComm = (compComm * tierInfo.rate) / 100;
    const compNet = compComm - empComm;

    totalSales += price;
    totalCompComm += compComm;
    totalSalesComm += empComm;

    if (tierInfo.tier === 1) {
      t1Count++;
      t1Comm += empComm;
    } else if (tierInfo.tier === 2) {
      t2Count++;
      t2Comm += empComm;
    } else {
      t3Count++;
      t3Comm += empComm;
    }

    // Update row DOM if present
    const compEl = document.getElementById(`compComm_${deal.id}`);
    const empEl = document.getElementById(`empComm_${deal.id}`);
    const netEl = document.getElementById(`compNet_${deal.id}`);
    const badgeEl = document.getElementById(`badge_${deal.id}`);

    if (compEl) compEl.textContent = formatCurrency(compComm);
    if (empEl) empEl.textContent = formatCurrency(empComm);
    if (netEl) netEl.textContent = formatCurrency(compNet);
    if (badgeEl) {
      badgeEl.className = `${tierInfo.badgeClass} text-[11px] font-bold px-2 py-0.5 rounded-md`;
      badgeEl.textContent = `Tier ${tierInfo.tier}: ${tierInfo.rate}%`;
    }
  });

  const totalCompNet = totalCompComm - totalSalesComm;

  // Update Summary Dashboard Elements
  const countEl = document.getElementById('totalDealsCountText');
  const salesEl = document.getElementById('totalHouseSalesText');
  const salesCommEl = document.getElementById('totalSalesCommText');
  const compCommEl = document.getElementById('totalCompanyCommText');
  const compNetEl = document.getElementById('totalCompanyNetText');

  if (countEl) countEl.textContent = deals.length;
  if (salesEl) salesEl.textContent = `${formatCurrency(totalSales)} บาท`;
  if (salesCommEl) salesCommEl.textContent = `${formatCurrency(totalSalesComm)} บาท`;
  if (compCommEl) compCommEl.textContent = `${formatCurrency(totalCompComm)} บาท`;
  if (compNetEl) compNetEl.textContent = `${formatCurrency(totalCompNet)} บาท`;

  const sT1Amt = document.getElementById('summaryTier1AmtText');
  const sT2Amt = document.getElementById('summaryTier2AmtText');
  const sT3Amt = document.getElementById('summaryTier3AmtText');
  if (sT1Amt) sT1Amt.textContent = `${t1Count} หลัง (${formatCurrency(t1Comm)} บ.)`;
  if (sT2Amt) sT2Amt.textContent = `${t2Count} หลัง (${formatCurrency(t2Comm)} บ.)`;
  if (sT3Amt) sT3Amt.textContent = `${t3Count} หลัง (${formatCurrency(t3Comm)} บ.)`;

  updateTierChartSafely(totalCompNet, totalSalesComm);
}

// --- Render Deals List UI ---
function renderDeals() {
  const container = document.getElementById('dealsContainer');
  const emptyState = document.getElementById('emptyDealsState');
  if (!container) return;

  if (deals.length === 0) {
    container.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');
  container.innerHTML = '';

  const s = getSettings();

  deals.forEach((deal, idx) => {
    const dealNumber = idx + 1;
    const tierInfo = getTierForIndex(dealNumber);
    const price = deal.price || 0;
    const compComm = (price * s.companyRate) / 100;
    const empComm = (compComm * tierInfo.rate) / 100;
    const compNet = compComm - empComm;

    const row = document.createElement('div');
    row.className = 'deal-row p-4 bg-white/95 border border-slate-200 shadow-sm transition';
    row.id = `row_${deal.id}`;

    row.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="w-7 h-7 rounded-full bg-slate-800 text-white text-xs font-bold flex items-center justify-center">
            #${dealNumber}
          </span>
          <span class="text-sm font-bold text-slate-800">รายการบ้านหลังที่ ${dealNumber}</span>
          <span class="${tierInfo.badgeClass} text-[11px] font-bold px-2 py-0.5 rounded-md" id="badge_${deal.id}">
            Tier ${tierInfo.tier}: ${tierInfo.rate}%
          </span>
        </div>

        <button type="button" class="delete-deal-btn text-xs font-medium text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-lg flex items-center gap-1 transition no-print self-end sm:self-auto cursor-pointer" data-id="${deal.id}">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          <span>ลบรายการ</span>
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 mt-3 items-center">
        <!-- Editable Price Input -->
        <div class="sm:col-span-5">
          <label class="block text-[10px] font-semibold text-slate-500 mb-1">ราคาขายบ้าน (บาท):</label>
          <div class="highlight-input-container flex items-center px-3 py-1.5">
            <input type="text" class="deal-price-input highlight-input text-base font-bold" data-id="${deal.id}" value="${formatNumber(price)}" inputmode="numeric">
            <span class="text-xs font-semibold text-slate-600 ml-1">บาท</span>
          </div>
        </div>

        <!-- Breakdown Columns -->
        <div class="sm:col-span-7 grid grid-cols-3 gap-2 text-center sm:text-right">
          <div class="p-2 rounded-lg bg-sky-50/70 border border-sky-100">
            <span class="text-[10px] text-sky-800 font-medium block">คอมบริษัท (3%)</span>
            <span class="text-xs font-bold text-sky-950 block truncate" id="compComm_${deal.id}">${formatCurrency(compComm)}</span>
          </div>

          <div class="p-2 rounded-lg bg-orange-50/80 border border-orange-100">
            <span class="text-[10px] text-orange-800 font-medium block">คอมพนักงาน</span>
            <span class="text-xs font-extrabold text-orange-950 block truncate" id="empComm_${deal.id}">${formatCurrency(empComm)}</span>
          </div>

          <div class="p-2 rounded-lg bg-emerald-50/70 border border-emerald-100">
            <span class="text-[10px] text-emerald-800 font-medium block">บริษัทสุทธิ</span>
            <span class="text-xs font-bold text-emerald-950 block truncate" id="compNet_${deal.id}">${formatCurrency(compNet)}</span>
          </div>
        </div>
      </div>
    `;

    container.appendChild(row);
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// --- Safe Chart.js Visualizer ---
function initChartsSafely() {
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js library is not available or blocked');
    return;
  }

  try {
    // 1. Single Mode Donut
    const singleCanvas = document.getElementById('commissionPieChart');
    if (singleCanvas) {
      const s = getSettings();
      const compShare = Math.max(0, 100 - s.salesRate);
      singleChart = new Chart(singleCanvas, {
        type: 'doughnut',
        data: {
          labels: ['บริษัทได้รับสุทธิ', 'ส่วนแบ่งพนักงานขาย'],
          datasets: [{
            data: [compShare, s.salesRate],
            backgroundColor: ['#38bdf8', '#fb923c'],
            borderColor: ['#ffffff', '#ffffff'],
            borderWidth: 3,
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { font: { family: "'Prompt', sans-serif", size: 12 }, usePointStyle: true }
            }
          },
          cutout: '62%'
        }
      });
    }

    // 2. Tier Cumulative Mode Donut
    const tierCanvas = document.getElementById('tierSummaryPieChart');
    if (tierCanvas) {
      tierSummaryChart = new Chart(tierCanvas, {
        type: 'doughnut',
        data: {
          labels: ['บริษัทได้รับสุทธิรวม', 'ค่าคอมพนักงานรวมสะสม'],
          datasets: [{
            data: [1, 0],
            backgroundColor: ['#38bdf8', '#fb923c'],
            borderColor: ['#ffffff', '#ffffff'],
            borderWidth: 3,
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { font: { family: "'Prompt', sans-serif", size: 12 }, usePointStyle: true }
            },
            tooltip: {
              callbacks: {
                label: function(ctx) {
                  return ` ${ctx.label}: ${formatCurrency(ctx.raw)} บาท`;
                }
              }
            }
          },
          cutout: '60%'
        }
      });
    }
  } catch (err) {
    console.warn('Error initializing charts:', err);
  }
}

function updateSingleChartSafely(companyRate, salesRate) {
  if (!singleChart) return;
  try {
    const compShare = Math.max(0, 100 - salesRate);
    singleChart.data.datasets[0].data = [compShare, salesRate];
    singleChart.update();

    const compTxt = document.getElementById('chartCompanyPercentText');
    const salesTxt = document.getElementById('chartSalesPercentText');
    if (compTxt) compTxt.textContent = `${compShare}%`;
    if (salesTxt) salesTxt.textContent = `${salesRate}%`;
  } catch (e) {}
}

function updateTierChartSafely(companyNet, salesComm) {
  if (!tierSummaryChart) return;
  try {
    if (companyNet === 0 && salesComm === 0) {
      tierSummaryChart.data.datasets[0].data = [1, 0];
    } else {
      tierSummaryChart.data.datasets[0].data = [companyNet, salesComm];
    }
    tierSummaryChart.update();
  } catch (e) {}
}

// --- Copy Summary ---
function copyCalculationSummary() {
  const s = getSettings();
  let text = '';

  if (activeTab === 'tier') {
    text = `📈 สรุปยอดขายและค่าคอมมิชชั่นสะสมรายเดือน (Tiered Deals)\n`;
    text += `-----------------------------------------\n`;
    text += `⚙️ เกณฑ์ส่วนแบ่งตาม Tier:\n`;
    text += `- อัตราค่าคอมบริษัท: ${s.companyRate}%\n`;
    text += `- Tier 1 (หลังที่ 1-3): ${s.tier1Rate}% ของค่าคอมบริษัท (${Number(((s.companyRate * s.tier1Rate)/100).toFixed(4))}% ราคาบ้าน)\n`;
    text += `- Tier 2 (หลังที่ 4-5): ${s.tier2Rate}% ของค่าคอมบริษัท (${Number(((s.companyRate * s.tier2Rate)/100).toFixed(4))}% ราคาบ้าน)\n`;
    text += `- Tier 3 (หลังที่ 6+): ${s.tier3Rate}% ของค่าคอมบริษัท (${Number(((s.companyRate * s.tier3Rate)/100).toFixed(4))}% ราคาบ้าน)\n\n`;

    let totalSales = 0, totalComp = 0, totalEmp = 0;

    if (deals.length > 0) {
      text += `📝 รายการบ้านที่ปิดได้ (${deals.length} รายการ):\n`;
      deals.forEach((d, i) => {
        const num = i + 1;
        const tier = getTierForIndex(num);
        const cComm = (d.price * s.companyRate) / 100;
        const eComm = (cComm * tier.rate) / 100;
        totalSales += d.price;
        totalComp += cComm;
        totalEmp += eComm;

        text += `  #${num} บ้านราคา ${formatCurrency(d.price)} บ. [Tier ${tier.tier}: ${tier.rate}%] -> คอมพนักงาน: ${formatCurrency(eComm)} บ.\n`;
      });

      text += `\n📊 ยอดรวมสะสมทั้งสิ้น:\n`;
      text += `• ยอดขายบ้านรวม: ${formatCurrency(totalSales)} บาท\n`;
      text += `• ค่าคอมพนักงานรวมสะสม: ${formatCurrency(totalEmp)} บาท\n`;
      text += `• ค่าคอมบริษัทรวม: ${formatCurrency(totalComp)} บาท\n`;
      text += `• บริษัทได้รับสุทธิ: ${formatCurrency(totalComp - totalEmp)} บาท\n`;
    } else {
      text += `(ยังไม่มีรายการบ้านที่บันทึก)\n`;
    }
  } else {
    const housePriceInput = document.getElementById('housePriceInput');
    const targetCommInput = document.getElementById('targetCommInput');
    const housePrice = parseNumber(housePriceInput ? housePriceInput.value : 0);
    const targetComm = parseNumber(targetCommInput ? targetCommInput.value : 0);
    const combinedRate = (s.companyRate * s.salesRate) / 100;

    text = `🏠 สรุปการคำนวณค่าคอมมิชชั่นอสังหาริมทรัพย์ (รายหลัง)\n`;
    text += `-----------------------------------------\n`;
    text += `⚙️ อัตราที่ตั้งไว้: บริษัท ${s.companyRate}% | พนักงาน ${s.salesRate}% (คิดเป็น ${Number(combinedRate.toFixed(4))}% ราคาบ้าน)\n\n`;

    if (housePrice > 0) {
      const compComm = (housePrice * s.companyRate) / 100;
      const empComm = (compComm * s.salesRate) / 100;
      text += `📊 คำนวณจากราคาบ้าน:\n`;
      text += `- ราคาบ้าน: ${formatCurrency(housePrice)} บาท\n`;
      text += `- บริษัทได้ค่าคอม (${s.companyRate}%): ${formatCurrency(compComm)} บาท\n`;
      text += `- พนักงานขายได้ (${s.salesRate}%): ${formatCurrency(empComm)} บาท\n`;
      text += `- บริษัทได้รับสุทธิ: ${formatCurrency(compComm - empComm)} บาท\n\n`;
    }

    if (targetComm > 0) {
      const reqPrice = targetComm / (combinedRate / 100);
      const reqComp = (reqPrice * s.companyRate) / 100;
      text += `🎯 คำนวณกลับจากเป้าหมายค่าคอม:\n`;
      text += `- พนักงานต้องการค่าคอม: ${formatCurrency(targetComm)} บาท\n`;
      text += `- ต้องขายบ้านราคา: ${formatCurrency(reqPrice)} บาท\n`;
      text += `- บริษัทได้ค่าคอม: ${formatCurrency(reqComp)} บาท\n\n`;
    }
  }

  text += `\nสร้างโดย: WebApp คำนวณค่าคอมมิชชั่นอสังหาริมทรัพย์`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('คัดลอกสรุปผลลัพธ์ลง Clipboard เรียบร้อยแล้ว!');
    }).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
    showToast('คัดลอกสรุปผลลัพธ์ลง Clipboard เรียบร้อยแล้ว!');
  } catch (e) {
    showToast('ไม่สามารถคัดลอกอัตโนมัติได้');
  }
  document.body.removeChild(textArea);
}

// --- Toast Notification ---
function showToast(msg) {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');
  if (!toast || !toastMessage) return;

  toastMessage.textContent = msg;
  toast.classList.add('show');
  
  if (window._toastTimer) clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}
