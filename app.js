// Commission Calculator Application Script (v2.0 - Tiered & Cumulative)
document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements - Tabs ---
  const tabBtnTier = document.getElementById('tabBtnTier');
  const tabBtnSingle = document.getElementById('tabBtnSingle');
  const tabContentTier = document.getElementById('tabContentTier');
  const tabContentSingle = document.getElementById('tabContentSingle');

  // --- DOM Elements - Settings ---
  const companyRateInput = document.getElementById('companyRate');
  const salesRateInput = document.getElementById('salesRate');
  const tier1RateInput = document.getElementById('tier1Rate');
  const tier2RateInput = document.getElementById('tier2Rate');
  const tier3RateInput = document.getElementById('tier3Rate');
  const resetSettingsBtn = document.getElementById('resetSettingsBtn');
  const settingsToggleHeader = document.getElementById('settingsToggleHeader');
  const settingsBody = document.getElementById('settingsBody');
  const settingsChevronIcon = document.getElementById('settingsChevronIcon');

  // Tier Visual Badges & Texts
  const tier1BadgePercent = document.getElementById('tier1BadgePercent');
  const tier2BadgePercent = document.getElementById('tier2BadgePercent');
  const tier3BadgePercent = document.getElementById('tier3BadgePercent');
  const tier1EffectiveText = document.getElementById('tier1EffectiveText');
  const tier2EffectiveText = document.getElementById('tier2EffectiveText');
  const tier3EffectiveText = document.getElementById('tier3EffectiveText');

  const summaryTier1RateText = document.getElementById('summaryTier1RateText');
  const summaryTier2RateText = document.getElementById('summaryTier2RateText');
  const summaryTier3RateText = document.getElementById('summaryTier3RateText');
  const summaryTier1AmtText = document.getElementById('summaryTier1AmtText');
  const summaryTier2AmtText = document.getElementById('summaryTier2AmtText');
  const summaryTier3AmtText = document.getElementById('summaryTier3AmtText');

  // --- DOM Elements - Single Mode ---
  const combinedRateText = document.getElementById('combinedRateText');
  const formulaExplanation = document.getElementById('formulaExplanation');
  const housePriceInput = document.getElementById('housePriceInput');
  const clearHousePriceBtn = document.getElementById('clearHousePriceBtn');
  const resultCompanyComm = document.getElementById('resultCompanyComm');
  const resultSalesComm = document.getElementById('resultSalesComm');
  const resultCompanyNet = document.getElementById('resultCompanyNet');
  const forwardCalcSummary = document.getElementById('forwardCalcSummary');

  const targetCommInput = document.getElementById('targetCommInput');
  const clearTargetCommBtn = document.getElementById('clearTargetCommBtn');
  const resultReqHousePrice = document.getElementById('resultReqHousePrice');
  const resultReqCompanyComm = document.getElementById('resultReqCompanyComm');
  const resultReqCompanyNet = document.getElementById('resultReqCompanyNet');

  // --- DOM Elements - Tier Cumulative Mode ---
  const newDealPriceInput = document.getElementById('newDealPriceInput');
  const addNewDealBtn = document.getElementById('addNewDealBtn');
  const sampleDataBtn = document.getElementById('sampleDataBtn');
  const clearAllDealsBtn = document.getElementById('clearAllDealsBtn');
  const dealsContainer = document.getElementById('dealsContainer');
  const emptyDealsState = document.getElementById('emptyDealsState');

  const totalDealsCountText = document.getElementById('totalDealsCountText');
  const totalHouseSalesText = document.getElementById('totalHouseSalesText');
  const totalSalesCommText = document.getElementById('totalSalesCommText');
  const totalCompanyCommText = document.getElementById('totalCompanyCommText');
  const totalCompanyNetText = document.getElementById('totalCompanyNetText');

  // --- DOM Elements - Actions ---
  const copySummaryBtn = document.getElementById('copySummaryBtn');
  const printPageBtn = document.getElementById('printPageBtn');
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');

  // --- Chart Instances ---
  let singleChart = null;
  let tierSummaryChart = null;

  // --- Defaults & App State ---
  const DEFAULTS = {
    companyRate: 3.0,
    salesRate: 7.0,
    tier1Rate: 7.5,
    tier2Rate: 10.0,
    tier3Rate: 15.0
  };

  let activeTab = 'tier'; // 'tier' or 'single'
  let deals = []; // Array of { id: string, price: number }

  // --- Initialize App ---
  loadState();
  initCharts();
  renderDeals();
  calculateAll();

  // --- Tab Switching Logic ---
  tabBtnTier.addEventListener('click', () => switchTab('tier'));
  tabBtnSingle.addEventListener('click', () => switchTab('single'));

  function switchTab(tab) {
    activeTab = tab;
    if (tab === 'tier') {
      tabBtnTier.classList.add('active');
      tabBtnSingle.classList.remove('active');
      tabContentTier.classList.remove('hidden');
      tabContentSingle.classList.add('hidden');
      calculateTierMode();
    } else {
      tabBtnSingle.classList.add('active');
      tabBtnTier.classList.remove('active');
      tabContentSingle.classList.remove('hidden');
      tabContentTier.classList.add('hidden');
      calculateSingleMode();
    }
    localStorage.setItem('comm_activeTab', activeTab);
  }

  // --- Settings Toggle ---
  let isSettingsOpen = true;
  settingsToggleHeader.addEventListener('click', (e) => {
    if (e.target.closest('#resetSettingsBtn')) return;
    isSettingsOpen = !isSettingsOpen;
    settingsBody.classList.toggle('hidden', !isSettingsOpen);
    settingsChevronIcon.style.transform = isSettingsOpen ? 'rotate(0deg)' : 'rotate(-90deg)';
  });

  // Settings Input Listeners
  [companyRateInput, salesRateInput, tier1RateInput, tier2RateInput, tier3RateInput].forEach(input => {
    input.addEventListener('input', () => {
      saveSettings();
      calculateAll();
    });
  });

  resetSettingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    companyRateInput.value = DEFAULTS.companyRate;
    salesRateInput.value = DEFAULTS.salesRate;
    tier1RateInput.value = DEFAULTS.tier1Rate;
    tier2RateInput.value = DEFAULTS.tier2Rate;
    tier3RateInput.value = DEFAULTS.tier3Rate;
    saveSettings();
    calculateAll();
    showToast('รีเซ็ตอัตราค่าคอมเริ่มต้นเรียบร้อยแล้ว');
  });

  // --- Single Mode Event Listeners ---
  housePriceInput.addEventListener('input', (e) => {
    formatInputWithCommas(e.target);
    calculateSingleForward();
  });

  clearHousePriceBtn.addEventListener('click', () => {
    housePriceInput.value = '';
    calculateSingleForward();
    housePriceInput.focus();
  });

  document.querySelectorAll('.chip-house-price').forEach((chip) => {
    chip.addEventListener('click', () => {
      const val = chip.getAttribute('data-value');
      housePriceInput.value = formatNumber(val);
      calculateSingleForward();
    });
  });

  targetCommInput.addEventListener('input', (e) => {
    formatInputWithCommas(e.target);
    calculateSingleReverse();
  });

  clearTargetCommBtn.addEventListener('click', () => {
    targetCommInput.value = '';
    calculateSingleReverse();
    targetCommInput.focus();
  });

  document.querySelectorAll('.chip-target-comm').forEach((chip) => {
    chip.addEventListener('click', () => {
      const val = chip.getAttribute('data-value');
      targetCommInput.value = formatNumber(val);
      calculateSingleReverse();
    });
  });

  // --- Tier Cumulative Mode Event Listeners ---
  newDealPriceInput.addEventListener('input', (e) => {
    formatInputWithCommas(e.target);
  });

  newDealPriceInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleAddDeal();
    }
  });

  addNewDealBtn.addEventListener('click', handleAddDeal);

  function handleAddDeal() {
    const price = parseNumber(newDealPriceInput.value);
    if (price <= 0) {
      showToast('กรุณากรอกราคาบ้านที่ถูกต้อง');
      newDealPriceInput.focus();
      return;
    }
    deals.push({
      id: 'deal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      price: price
    });
    newDealPriceInput.value = '';
    saveDeals();
    renderDeals();
    calculateTierMode();
    showToast(`เพิ่มรายการบ้านหลังที่ ${deals.length} เรียบร้อยแล้ว`);
  }

  // Quick Chips for New Deal Price
  document.querySelectorAll('.chip-quick-add').forEach((chip) => {
    chip.addEventListener('click', () => {
      const val = chip.getAttribute('data-value');
      newDealPriceInput.value = formatNumber(val);
      newDealPriceInput.focus();
    });
  });

  sampleDataBtn.addEventListener('click', () => {
    deals = [
      { id: 'deal_1', price: 2000000 },
      { id: 'deal_2', price: 2500000 },
      { id: 'deal_3', price: 1800000 },
      { id: 'deal_4', price: 3200000 },
      { id: 'deal_5', price: 4000000 },
      { id: 'deal_6', price: 5000000 }
    ];
    saveDeals();
    renderDeals();
    calculateTierMode();
    showToast('โหลดตัวอย่างข้อมูล 6 หลังเรียบร้อยแล้ว');
  });

  clearAllDealsBtn.addEventListener('click', () => {
    if (deals.length === 0) return;
    if (confirm('คุณต้องการล้างรายการบ้านทั้งหมดใช่หรือไม่?')) {
      deals = [];
      saveDeals();
      renderDeals();
      calculateTierMode();
      showToast('ล้างรายการทั้งหมดแล้ว');
    }
  });

  // Action Buttons
  copySummaryBtn.addEventListener('click', copyCalculationSummary);
  printPageBtn.addEventListener('click', () => window.print());

  // --- Calculations & Rates Helpers ---

  function getSettings() {
    return {
      companyRate: parseFloat(companyRateInput.value) || 0,
      salesRate: parseFloat(salesRateInput.value) || 0,
      tier1Rate: parseFloat(tier1RateInput.value) || 0,
      tier2Rate: parseFloat(tier2RateInput.value) || 0,
      tier3Rate: parseFloat(tier3RateInput.value) || 0
    };
  }

  function getTierForIndex(index) {
    // index is 1-based (Deal #1, #2, ...)
    const { tier1Rate, tier2Rate, tier3Rate } = getSettings();
    if (index <= 3) {
      return { tier: 1, name: 'Tier 1 (หลังที่ 1-3)', rate: tier1Rate, badgeClass: 'badge-tier-1' };
    } else if (index <= 5) {
      return { tier: 2, name: 'Tier 2 (หลังที่ 4-5)', rate: tier2Rate, badgeClass: 'badge-tier-2' };
    } else {
      return { tier: 3, name: 'Tier 3 (หลังที่ 6 ขึ้นไป)', rate: tier3Rate, badgeClass: 'badge-tier-3' };
    }
  }

  function calculateAll() {
    updateVisualHeaders();
    calculateSingleMode();
    calculateTierMode();
  }

  function updateVisualHeaders() {
    const { companyRate, salesRate, tier1Rate, tier2Rate, tier3Rate } = getSettings();

    // Single mode header
    const combinedRate = (companyRate * salesRate) / 100;
    const formattedCombined = Number(combinedRate.toFixed(4));
    combinedRateText.textContent = `${formattedCombined}%`;
    formulaExplanation.textContent = `พนักงานขายได้ค่าคอม จากราคาบ้านคือ ${companyRate}% × ${salesRate}% = ${formattedCombined}%`;

    // Tier Badges & Effective rates
    tier1BadgePercent.textContent = `${tier1Rate}%`;
    tier2BadgePercent.textContent = `${tier2Rate}%`;
    tier3BadgePercent.textContent = `${tier3Rate}%`;

    summaryTier1RateText.textContent = `${tier1Rate}%`;
    summaryTier2RateText.textContent = `${tier2Rate}%`;
    summaryTier3RateText.textContent = `${tier3Rate}%`;

    const t1Effective = Number(((companyRate * tier1Rate) / 100).toFixed(4));
    const t2Effective = Number(((companyRate * tier2Rate) / 100).toFixed(4));
    const t3Effective = Number(((companyRate * tier3Rate) / 100).toFixed(4));

    tier1EffectiveText.textContent = `คิดเป็น ${t1Effective}% จากราคาขายบ้าน`;
    tier2EffectiveText.textContent = `คิดเป็น ${t2Effective}% จากราคาขายบ้าน`;
    tier3EffectiveText.textContent = `คิดเป็น ${t3Effective}% จากราคาขายบ้าน`;

    updateSingleChart(companyRate, salesRate);
  }

  // --- Single Mode Calculation ---
  function calculateSingleMode() {
    calculateSingleForward();
    calculateSingleReverse();
  }

  function calculateSingleForward() {
    const { companyRate, salesRate } = getSettings();
    const housePrice = parseNumber(housePriceInput.value);

    if (housePrice > 0 && companyRate > 0) {
      const companyCommission = (housePrice * companyRate) / 100;
      const salesCommission = (companyCommission * salesRate) / 100;
      const companyNet = companyCommission - salesCommission;

      resultCompanyComm.textContent = `${formatCurrency(companyCommission)} บาท`;
      resultSalesComm.textContent = `${formatCurrency(salesCommission)} บาท`;
      resultCompanyNet.textContent = `${formatCurrency(companyNet)} บาท`;
      forwardCalcSummary.classList.remove('opacity-50');
    } else {
      resultCompanyComm.textContent = '- บาท';
      resultSalesComm.textContent = '- บาท';
      resultCompanyNet.textContent = '- บาท';
      forwardCalcSummary.classList.add('opacity-50');
    }
  }

  function calculateSingleReverse() {
    const { companyRate, salesRate } = getSettings();
    const combinedRate = (companyRate * salesRate) / 100;
    const targetComm = parseNumber(targetCommInput.value);

    if (targetComm > 0 && combinedRate > 0 && salesRate > 0 && companyRate > 0) {
      const reqHousePrice = targetComm / (combinedRate / 100);
      const reqCompanyComm = (reqHousePrice * companyRate) / 100;
      const reqCompanyNet = reqCompanyComm - targetComm;

      resultReqHousePrice.textContent = `${formatCurrency(reqHousePrice)} บาท`;
      resultReqCompanyComm.textContent = `${formatCurrency(reqCompanyComm)} บาท`;
      resultReqCompanyNet.textContent = `${formatCurrency(reqCompanyNet)} บาท`;
    } else {
      resultReqHousePrice.textContent = '- บาท';
      resultReqCompanyComm.textContent = '- บาท';
      resultReqCompanyNet.textContent = '- บาท';
    }
  }

  // --- Tier Cumulative Mode Calculation ---
  function calculateTierMode() {
    const { companyRate } = getSettings();

    let totalHouseSales = 0;
    let totalCompanyComm = 0;
    let totalSalesComm = 0;

    let tier1Count = 0, tier1SalesComm = 0;
    let tier2Count = 0, tier2SalesComm = 0;
    let tier3Count = 0, tier3SalesComm = 0;

    deals.forEach((deal, idx) => {
      const dealNumber = idx + 1;
      const tierInfo = getTierForIndex(dealNumber);
      const price = deal.price || 0;

      const compComm = (price * companyRate) / 100;
      const empComm = (compComm * tierInfo.rate) / 100;

      totalHouseSales += price;
      totalCompanyComm += compComm;
      totalSalesComm += empComm;

      if (tierInfo.tier === 1) {
        tier1Count++;
        tier1SalesComm += empComm;
      } else if (tierInfo.tier === 2) {
        tier2Count++;
        tier2SalesComm += empComm;
      } else {
        tier3Count++;
        tier3SalesComm += empComm;
      }

      // Update row UI if present
      updateDealRowUI(deal.id, dealNumber, price, compComm, empComm, tierInfo);
    });

    const totalCompanyNet = totalCompanyComm - totalSalesComm;

    // Update KPI UI
    totalDealsCountText.textContent = deals.length;
    totalHouseSalesText.textContent = `${formatCurrency(totalHouseSales)} บาท`;
    totalSalesCommText.textContent = `${formatCurrency(totalSalesComm)} บาท`;
    totalCompanyCommText.textContent = `${formatCurrency(totalCompanyComm)} บาท`;
    totalCompanyNetText.textContent = `${formatCurrency(totalCompanyNet)} บาท`;

    // Tier summaries
    summaryTier1AmtText.textContent = `${tier1Count} หลัง (${formatCurrency(tier1SalesComm)} บ.)`;
    summaryTier2AmtText.textContent = `${tier2Count} หลัง (${formatCurrency(tier2SalesComm)} บ.)`;
    summaryTier3AmtText.textContent = `${tier3Count} หลัง (${formatCurrency(tier3SalesComm)} บ.)`;

    // Update Tier Summary Chart
    updateTierChart(totalCompanyNet, totalSalesComm, tier1SalesComm, tier2SalesComm, tier3SalesComm);
  }

  // --- Render Deals UI List ---
  function renderDeals() {
    if (!dealsContainer) return;

    if (deals.length === 0) {
      dealsContainer.innerHTML = '';
      emptyDealsState.classList.remove('hidden');
      return;
    }

    emptyDealsState.classList.add('hidden');
    dealsContainer.innerHTML = '';

    const { companyRate } = getSettings();

    deals.forEach((deal, index) => {
      const dealNumber = index + 1;
      const tierInfo = getTierForIndex(dealNumber);
      const price = deal.price || 0;
      const compComm = (price * companyRate) / 100;
      const empComm = (compComm * tierInfo.rate) / 100;
      const compNet = compComm - empComm;

      const row = document.createElement('div');
      row.className = 'deal-row p-4 bg-white/90 border border-slate-200/90 shadow-sm';
      row.id = `row_${deal.id}`;

      row.innerHTML = `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div class="flex items-center gap-2">
            <span class="w-7 h-7 rounded-full bg-slate-800 text-white text-xs font-bold flex items-center justify-center">
              #${dealNumber}
            </span>
            <span class="text-sm font-bold text-slate-800">รายการบ้านหลังที่ ${dealNumber}</span>
            <span class="${tierInfo.badgeClass} text-[11px] font-bold px-2 py-0.5 rounded-md" id="badge_${deal.id}">
              Tier ${tierInfo.tier}: ${tierInfo.rate}%
            </span>
          </div>

          <button type="button" class="delete-deal-btn text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg flex items-center gap-1 transition no-print self-end sm:self-auto" data-id="${deal.id}">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            <span>ลบ</span>
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 mt-3 items-center">
          
          <!-- Price input column -->
          <div class="sm:col-span-5">
            <label class="block text-[10px] font-semibold text-slate-500 mb-1">ราคาบ้าน (บาท):</label>
            <div class="highlight-input-container flex items-center px-3 py-1.5">
              <input type="text" class="deal-price-input highlight-input text-base font-bold" data-id="${deal.id}" value="${formatNumber(price)}" inputmode="numeric">
              <span class="text-xs font-semibold text-slate-600 ml-1">บ.</span>
            </div>
          </div>

          <!-- Calculated Columns -->
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

      dealsContainer.appendChild(row);
    });

    // Re-initialize Lucide Icons for dynamic content
    if (window.lucide) {
      lucide.createIcons();
    }

    // Attach Event Listeners to dynamic rows
    attachRowListeners();
  }

  function attachRowListeners() {
    // Delete buttons
    document.querySelectorAll('.delete-deal-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        deals = deals.filter(d => d.id !== id);
        saveDeals();
        renderDeals();
        calculateTierMode();
        showToast('ลบรายการเรียบร้อยแล้ว');
      });
    });

    // Inline price inputs
    document.querySelectorAll('.deal-price-input').forEach(input => {
      input.addEventListener('input', (e) => {
        formatInputWithCommas(e.target);
        const id = input.getAttribute('data-id');
        const deal = deals.find(d => d.id === id);
        if (deal) {
          deal.price = parseNumber(input.value);
          saveDeals();
          calculateTierMode();
        }
      });
    });
  }

  function updateDealRowUI(id, dealNumber, price, compComm, empComm, tierInfo) {
    const badge = document.getElementById(`badge_${id}`);
    const compCommEl = document.getElementById(`compComm_${id}`);
    const empCommEl = document.getElementById(`empComm_${id}`);
    const compNetEl = document.getElementById(`compNet_${id}`);

    if (badge) {
      badge.className = `${tierInfo.badgeClass} text-[11px] font-bold px-2 py-0.5 rounded-md`;
      badge.textContent = `Tier ${tierInfo.tier}: ${tierInfo.rate}%`;
    }
    if (compCommEl) compCommEl.textContent = formatCurrency(compComm);
    if (empCommEl) empCommEl.textContent = formatCurrency(empComm);
    if (compNetEl) compNetEl.textContent = formatCurrency(compComm - empComm);
  }

  // --- Charts Initialization & Updates ---

  function initCharts() {
    // 1. Single Mode Chart
    const singleCtx = document.getElementById('commissionPieChart');
    if (singleCtx) {
      const { salesRate } = getSettings();
      const compShare = Math.max(0, 100 - salesRate);
      singleChart = new Chart(singleCtx, {
        type: 'doughnut',
        data: {
          labels: ['ส่วนแบ่งบริษัท (คงเหลือ)', 'ส่วนแบ่งพนักงานขาย'],
          datasets: [{
            data: [compShare, salesRate],
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

    // 2. Tier Cumulative Mode Chart
    const tierCtx = document.getElementById('tierSummaryPieChart');
    if (tierCtx) {
      tierSummaryChart = new Chart(tierCtx, {
        type: 'doughnut',
        data: {
          labels: ['บริษัทได้รับสุทธิ', 'คอมมิชชั่นพนักงาน (รวมทุก Tier)'],
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
                label: function(context) {
                  return ` ${context.label}: ${formatCurrency(context.raw)} บาท`;
                }
              }
            }
          },
          cutout: '60%'
        }
      });
    }
  }

  function updateSingleChart(companyRate, salesRate) {
    if (!singleChart) return;
    const compShare = Math.max(0, 100 - salesRate);
    singleChart.data.datasets[0].data = [compShare, salesRate];
    singleChart.update();

    const chartCompanyPercentText = document.getElementById('chartCompanyPercentText');
    const chartSalesPercentText = document.getElementById('chartSalesPercentText');
    if (chartCompanyPercentText) chartCompanyPercentText.textContent = `${compShare}%`;
    if (chartSalesPercentText) chartSalesPercentText.textContent = `${salesRate}%`;
  }

  function updateTierChart(companyNet, salesComm, t1Comm, t2Comm, t3Comm) {
    if (!tierSummaryChart) return;
    if (companyNet === 0 && salesComm === 0) {
      tierSummaryChart.data.datasets[0].data = [1, 0];
    } else {
      tierSummaryChart.data.datasets[0].data = [companyNet, salesComm];
    }
    tierSummaryChart.update();
  }

  // --- Copy Summary Formatter ---

  function copyCalculationSummary() {
    const { companyRate, salesRate, tier1Rate, tier2Rate, tier3Rate } = getSettings();
    let text = '';

    if (activeTab === 'tier') {
      text = `📈 สรุปยอดขายและค่าคอมมิชชั่นสะสมรายเดือน (Tiered Deals)\n`;
      text += `-----------------------------------------\n`;
      text += `⚙️ เกณฑ์ส่วนแบ่งตาม Tier:\n`;
      text += `- อัตราค่าคอมบริษัท: ${companyRate}%\n`;
      text += `- Tier 1 (หลังที่ 1-3): ${tier1Rate}% ของค่าคอมบริษัท (${Number(((companyRate * tier1Rate) / 100).toFixed(4))}% ราคาบ้าน)\n`;
      text += `- Tier 2 (หลังที่ 4-5): ${tier2Rate}% ของค่าคอมบริษัท (${Number(((companyRate * tier2Rate) / 100).toFixed(4))}% ราคาบ้าน)\n`;
      text += `- Tier 3 (หลังที่ 6+): ${tier3Rate}% ของค่าคอมบริษัท (${Number(((companyRate * tier3Rate) / 100).toFixed(4))}% ราคาบ้าน)\n\n`;

      let totalSales = 0, totalComp = 0, totalEmp = 0;

      if (deals.length > 0) {
        text += `📝 รายการบ้านที่ปิดได้ (${deals.length} รายการ):\n`;
        deals.forEach((d, i) => {
          const num = i + 1;
          const tier = getTierForIndex(num);
          const cComm = (d.price * companyRate) / 100;
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
      const housePrice = parseNumber(housePriceInput.value);
      const targetComm = parseNumber(targetCommInput.value);
      const combinedRate = (companyRate * salesRate) / 100;

      text = `🏠 สรุปการคำนวณค่าคอมมิชชั่นอสังหาริมทรัพย์ (รายหลัง)\n`;
      text += `-----------------------------------------\n`;
      text += `⚙️ อัตราที่ตั้งไว้: บริษัท ${companyRate}% | พนักงาน ${salesRate}% (คิดเป็น ${Number(combinedRate.toFixed(4))}% ราคาบ้าน)\n\n`;

      if (housePrice > 0) {
        const compComm = (housePrice * companyRate) / 100;
        const empComm = (compComm * salesRate) / 100;
        text += `📊 คำนวณจากราคาบ้าน:\n`;
        text += `- ราคาบ้าน: ${formatCurrency(housePrice)} บาท\n`;
        text += `- บริษัทได้ค่าคอม (${companyRate}%): ${formatCurrency(compComm)} บาท\n`;
        text += `- พนักงานขายได้ (${salesRate}%): ${formatCurrency(empComm)} บาท\n`;
        text += `- บริษัทได้รับสุทธิ: ${formatCurrency(compComm - empComm)} บาท\n\n`;
      }

      if (targetComm > 0) {
        const reqPrice = targetComm / (combinedRate / 100);
        const reqComp = (reqPrice * companyRate) / 100;
        text += `🎯 คำนวณกลับจากเป้าหมายค่าคอม:\n`;
        text += `- พนักงานต้องการค่าคอม: ${formatCurrency(targetComm)} บาท\n`;
        text += `- ต้องขายบ้านราคา: ${formatCurrency(reqPrice)} บาท\n`;
        text += `- บริษัทได้ค่าคอม: ${formatCurrency(reqComp)} บาท\n\n`;
      }
    }

    text += `\nสร้างโดย: WebApp คำนวณค่าคอมมิชชั่นอสังหาริมทรัพย์`;

    navigator.clipboard.writeText(text).then(() => {
      showToast('คัดลอกสรุปผลลัพธ์ลง Clipboard เรียบร้อยแล้ว!');
    }).catch(() => {
      showToast('ไม่สามารถคัดลอกอัตโนมัติได้');
    });
  }

  // --- Storage & Helpers ---

  function formatInputWithCommas(input) {
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

  function formatNumber(num) {
    if (isNaN(num) || num === null || num === '') return '';
    return Number(num).toLocaleString('en-US');
  }

  function parseNumber(str) {
    if (!str) return 0;
    const cleanStr = String(str).replace(/,/g, '');
    return parseFloat(cleanStr) || 0;
  }

  function formatCurrency(num) {
    if (isNaN(num) || num === null || num === undefined) return '0.00';
    return Number(num).toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function showToast(msg) {
    if (!toast || !toastMessage) return;
    toastMessage.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2800);
  }

  function saveSettings() {
    const s = getSettings();
    localStorage.setItem('comm_companyRate', s.companyRate);
    localStorage.setItem('comm_salesRate', s.salesRate);
    localStorage.setItem('comm_tier1Rate', s.tier1Rate);
    localStorage.setItem('comm_tier2Rate', s.tier2Rate);
    localStorage.setItem('comm_tier3Rate', s.tier3Rate);
  }

  function saveDeals() {
    localStorage.setItem('comm_deals', JSON.stringify(deals));
  }

  function loadState() {
    companyRateInput.value = localStorage.getItem('comm_companyRate') || DEFAULTS.companyRate;
    salesRateInput.value = localStorage.getItem('comm_salesRate') || DEFAULTS.salesRate;
    tier1RateInput.value = localStorage.getItem('comm_tier1Rate') || DEFAULTS.tier1Rate;
    tier2RateInput.value = localStorage.getItem('comm_tier2Rate') || DEFAULTS.tier2Rate;
    tier3RateInput.value = localStorage.getItem('comm_tier3Rate') || DEFAULTS.tier3Rate;

    const savedDeals = localStorage.getItem('comm_deals');
    if (savedDeals) {
      try {
        deals = JSON.parse(savedDeals) || [];
      } catch (e) {
        deals = [];
      }
    } else {
      // Default sample 3 deals if new user
      deals = [
        { id: 'deal_init_1', price: 2000000 },
        { id: 'deal_init_2', price: 2500000 },
        { id: 'deal_init_3', price: 3000000 }
      ];
    }

    const savedTab = localStorage.getItem('comm_activeTab');
    if (savedTab) {
      switchTab(savedTab);
    } else {
      switchTab('tier');
    }
  }
});
