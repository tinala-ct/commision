// Commission Calculator Application Script
document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements - Settings
  const companyRateInput = document.getElementById('companyRate');
  const salesRateInput = document.getElementById('salesRate');
  const combinedRateText = document.getElementById('combinedRateText');
  const formulaExplanation = document.getElementById('formulaExplanation');
  const resetSettingsBtn = document.getElementById('resetSettingsBtn');

  // DOM Elements - Forward Calc (House Price -> Commission)
  const housePriceInput = document.getElementById('housePriceInput');
  const clearHousePriceBtn = document.getElementById('clearHousePriceBtn');
  const resultCompanyComm = document.getElementById('resultCompanyComm');
  const resultSalesComm = document.getElementById('resultSalesComm');
  const resultCompanyNet = document.getElementById('resultCompanyNet');
  const forwardCalcSummary = document.getElementById('forwardCalcSummary');

  // DOM Elements - Reverse Calc (Target Commission -> House Price)
  const targetCommInput = document.getElementById('targetCommInput');
  const clearTargetCommBtn = document.getElementById('clearTargetCommBtn');
  const resultReqHousePrice = document.getElementById('resultReqHousePrice');
  const resultReqCompanyComm = document.getElementById('resultReqCompanyComm');
  const resultReqCompanyNet = document.getElementById('resultReqCompanyNet');

  // DOM Elements - Actions
  const copySummaryBtn = document.getElementById('copySummaryBtn');
  const printPageBtn = document.getElementById('printPageBtn');
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');

  // Chart Instance
  let commissionChart = null;

  // Defaults
  const DEFAULT_COMPANY_RATE = 3;
  const DEFAULT_SALES_RATE = 7;

  // Initialize
  loadSavedSettings();
  initChart();
  calculateAll();

  // Event Listeners - Settings
  companyRateInput.addEventListener('input', () => {
    saveSettings();
    calculateAll();
  });

  salesRateInput.addEventListener('input', () => {
    saveSettings();
    calculateAll();
  });

  resetSettingsBtn.addEventListener('click', () => {
    companyRateInput.value = DEFAULT_COMPANY_RATE;
    salesRateInput.value = DEFAULT_SALES_RATE;
    saveSettings();
    calculateAll();
    showToast('รีเซ็ตอัตราค่าคอมเริ่มต้น (3% / 7%) เรียบร้อย');
  });

  // Event Listeners - Forward Calc
  housePriceInput.addEventListener('input', (e) => {
    formatInputWithCommas(e.target);
    calculateForward();
  });

  clearHousePriceBtn.addEventListener('click', () => {
    housePriceInput.value = '';
    calculateForward();
    housePriceInput.focus();
  });

  // Quick Chips for House Price
  document.querySelectorAll('.chip-house-price').forEach((chip) => {
    chip.addEventListener('click', () => {
      const val = chip.getAttribute('data-value');
      housePriceInput.value = formatNumber(val);
      calculateForward();
    });
  });

  // Event Listeners - Reverse Calc
  targetCommInput.addEventListener('input', (e) => {
    formatInputWithCommas(e.target);
    calculateReverse();
  });

  clearTargetCommBtn.addEventListener('click', () => {
    targetCommInput.value = '';
    calculateReverse();
    targetCommInput.focus();
  });

  // Quick Chips for Target Commission
  document.querySelectorAll('.chip-target-comm').forEach((chip) => {
    chip.addEventListener('click', () => {
      const val = chip.getAttribute('data-value');
      targetCommInput.value = formatNumber(val);
      calculateReverse();
    });
  });

  // Copy Summary Action
  copySummaryBtn.addEventListener('click', () => {
    copyCalculationSummary();
  });

  // Print Action
  printPageBtn.addEventListener('click', () => {
    window.print();
  });

  // --- Calculation Logic Functions ---

  function calculateAll() {
    updateFormulaText();
    calculateForward();
    calculateReverse();
  }

  function getRates() {
    const companyRate = parseFloat(companyRateInput.value) || 0;
    const salesRate = parseFloat(salesRateInput.value) || 0;
    const combinedRate = (companyRate * salesRate) / 100;
    return { companyRate, salesRate, combinedRate };
  }

  function updateFormulaText() {
    const { companyRate, salesRate, combinedRate } = getRates();
    const formattedCombined = Number(combinedRate.toFixed(4));
    
    combinedRateText.textContent = `${formattedCombined}%`;
    formulaExplanation.textContent = `พนักงานขายได้ค่าคอม จากราคาบ้านคือ ${companyRate}% × ${salesRate}% = ${formattedCombined}%`;

    // Update Chart with new proportions
    updateChart(companyRate, salesRate);
  }

  function calculateForward() {
    const { companyRate, salesRate, combinedRate } = getRates();
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

  function calculateReverse() {
    const { companyRate, salesRate, combinedRate } = getRates();
    const targetComm = parseNumber(targetCommInput.value);

    if (targetComm > 0 && combinedRate > 0 && salesRate > 0 && companyRate > 0) {
      // Required House Price = targetComm / (combinedRate / 100)
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

  // --- Chart.js Pastel Visualizer ---

  function initChart() {
    const ctx = document.getElementById('commissionPieChart');
    if (!ctx) return;

    const { salesRate } = getRates();
    const companyShareRate = Math.max(0, 100 - salesRate);

    commissionChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['ส่วนแบ่งบริษัท (คงเหลือ)', 'ส่วนแบ่งพนักงานขาย'],
        datasets: [{
          data: [companyShareRate, salesRate],
          backgroundColor: [
            '#38bdf8', // Pastel Sky Blue
            '#fb923c'  // Pastel Peach / Orange
          ],
          borderColor: [
            '#ffffff',
            '#ffffff'
          ],
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
            labels: {
              font: {
                family: "'Prompt', sans-serif",
                size: 13
              },
              padding: 16,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                return ` ${label}: ${value}% ของก้อนค่าคอมมิชชั่น`;
              }
            },
            bodyFont: {
              family: "'Prompt', sans-serif"
            }
          }
        },
        cutout: '62%',
        animation: {
          animateScale: true,
          animateRotate: true
        }
      }
    });
  }

  function updateChart(companyRate, salesRate) {
    if (!commissionChart) return;
    const companyShareRate = Math.max(0, 100 - salesRate);
    commissionChart.data.datasets[0].data = [companyShareRate, salesRate];
    commissionChart.update();

    const chartCompanyPercentText = document.getElementById('chartCompanyPercentText');
    const chartSalesPercentText = document.getElementById('chartSalesPercentText');
    if (chartCompanyPercentText) chartCompanyPercentText.textContent = `${companyShareRate}%`;
    if (chartSalesPercentText) chartSalesPercentText.textContent = `${salesRate}%`;
  }

  // --- Helper & Utility Functions ---

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

  function copyCalculationSummary() {
    const { companyRate, salesRate, combinedRate } = getRates();
    const housePrice = parseNumber(housePriceInput.value);
    const targetComm = parseNumber(targetCommInput.value);

    let summaryText = `🏠 สรุปการคำนวณค่าคอมมิชชั่นอสังหาริมทรัพย์\n`;
    summaryText += `-----------------------------------------\n`;
    summaryText += `⚙️ อัตราที่ตั้งไว้:\n`;
    summaryText += `- อัตราค่าคอมบริษัท: ${companyRate}%\n`;
    summaryText += `- อัตราพนักงานขาย: ${salesRate}% ของค่าคอมบริษัท\n`;
    summaryText += `- อัตรารวมพนักงานขายจากราคาบ้าน: ${Number(combinedRate.toFixed(4))}%\n\n`;

    if (housePrice > 0) {
      const companyCommission = (housePrice * companyRate) / 100;
      const salesCommission = (companyCommission * salesRate) / 100;
      const companyNet = companyCommission - salesCommission;
      summaryText += `📊 คำนวณจากราคาบ้าน:\n`;
      summaryText += `- ราคาบ้าน: ${formatCurrency(housePrice)} บาท\n`;
      summaryText += `- บริษัทได้ค่าคอม (${companyRate}%): ${formatCurrency(companyCommission)} บาท\n`;
      summaryText += `- พนักงานขายได้ (${salesRate}%): ${formatCurrency(salesCommission)} บาท\n`;
      summaryText += `- บริษัทได้รับสุทธิ: ${formatCurrency(companyNet)} บาท\n\n`;
    }

    if (targetComm > 0) {
      const reqHousePrice = targetComm / (combinedRate / 100);
      const reqCompanyComm = (reqHousePrice * companyRate) / 100;
      summaryText += `🎯 คำนวณย้อนกลับจากเป้าหมายค่าคอม:\n`;
      summaryText += `- พนักงานต้องการค่าคอม: ${formatCurrency(targetComm)} บาท\n`;
      summaryText += `- ต้องขายบ้านราคา: ${formatCurrency(reqHousePrice)} บาท\n`;
      summaryText += `- บริษัทจะได้ค่าคอม: ${formatCurrency(reqCompanyComm)} บาท\n\n`;
    }

    summaryText += `สร้างโดย: WebApp คำนวณค่าคอมมิชชั่น`;

    navigator.clipboard.writeText(summaryText).then(() => {
      showToast('คัดลอกสรุปผลลัพธ์ลง Clipboard เรียบร้อยแล้ว!');
    }).catch(() => {
      showToast('ไม่สามารถคัดลอกอัตโนมัติได้');
    });
  }

  function showToast(msg) {
    if (!toast || !toastMessage) return;
    toastMessage.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  function saveSettings() {
    const { companyRate, salesRate } = getRates();
    localStorage.setItem('comm_companyRate', companyRate);
    localStorage.setItem('comm_salesRate', salesRate);
  }

  function loadSavedSettings() {
    const savedCompanyRate = localStorage.getItem('comm_companyRate');
    const savedSalesRate = localStorage.getItem('comm_salesRate');

    if (savedCompanyRate !== null) {
      companyRateInput.value = savedCompanyRate;
    } else {
      companyRateInput.value = DEFAULT_COMPANY_RATE;
    }

    if (savedSalesRate !== null) {
      salesRateInput.value = savedSalesRate;
    } else {
      salesRateInput.value = DEFAULT_SALES_RATE;
    }
  }
});
