let charts = {};
let currentBaseYear = null;
let currentCategory = "program";
let currentState = "US";

const metricColors = {
  "Work Search": "#3b8ee2",
  "Benefit Year Earnings": "#4cc74c",
  "Separation Issues": "#f04848",
  "Able + Available": "#ff9b1f",
  "Employment Service Registration": "#4dd2d2",
  "Base Period Wages": "#ffd23b",
  "Other Eligibility Issues": "#c15fcf",
  "All Other Causes": "#ff7b93",
  "Improper Payment Rate": "#1f77b4",
  "Fraud Rate": "#ff7f0e",
  "First Payment Timeliness (14 days)": "#2a9d8f",
  "First Payment Timeliness (21 days)": "#e76f51",
  "Nonmonetary Determination": "#9467bd",
};

// ------------------- Chart Renderers -------------------
function renderPieChart(containerId, pieData, exportMode = false) {
  let chartDom = document.getElementById(containerId);
  if (!chartDom) return;
  if (charts[containerId]) echarts.dispose(chartDom);
  let chart = echarts.init(chartDom, null, { renderer: "svg" });

  let option = {
    animation: !exportMode,
    tooltip: { trigger: "item", formatter: "{b}: {c}%" },
    series: [
      {
        type: "pie",
        radius: exportMode ? ["30%", "65%"] : ["35%", "75%"], // slightly smaller donut in export
        center: ["50%", "55%"],
        data: pieData.map((d) => ({
          ...d,
          itemStyle: { color: metricColors[d.name] || "#999" },
        })),
        label: {
          show: true, // ensure labels are forced visible
          formatter: "{b}: {c}%",
          fontSize: exportMode ? 10 : 12,
          color: "#000",
          position: "outside",
          overflow: "break", // try to wrap long text
          alignTo: "labelLine",
          distanceToLabelLine: 2,
        },
        labelLine: {
          show: true,
          length: exportMode ? 20 : 15,
          length2: exportMode ? 15 : 10,
          lineStyle: { color: "#666" },
        },
        avoidLabelOverlap: false, // disable auto-hiding
      },
    ],
  };

  chart.setOption(option);
  charts[containerId] = chart;
}

function renderBumpChart(containerId, bumpData, exportMode = false) {
  let chartDom = document.getElementById(containerId);
  if (!chartDom) return;
  if (charts[containerId]) echarts.dispose(chartDom);
  let chart = echarts.init(chartDom, null, { renderer: "svg" });

  const years = bumpData.years;
  const seriesList = bumpData.series.map((s) => ({
    name: s.name,
    type: "line",
    smooth: true,
    symbolSize: 10,
    emphasis: { focus: "series" },
    lineStyle: { width: 3, color: metricColors[s.name] || "#999" },
    itemStyle: { color: metricColors[s.name] || "#999" },
    data: s.values,
  }));

  let option = {
    animation: !exportMode,
    tooltip: { trigger: "axis" },
    legend: { bottom: 0 },
    grid: { left: 50, right: 50, top: 50, bottom: 40, containLabel: true },
    xAxis: { type: "category", boundaryGap: false, data: years },
    yAxis: {
      type: "value",
      name: "Percent",
      axisLabel: { formatter: "{value}%" },
    },
    series: seriesList,
  };

  chart.setOption(option);
  charts[containerId] = chart;
}

function renderTimelinessChart(containerId, data, exportMode = false) {
  const chartDom = document.getElementById(containerId);
  if (!chartDom) return;
  if (charts[containerId]) echarts.dispose(chartDom);
  const chart = echarts.init(chartDom, null, { renderer: "svg" });

  const years = data.years;
  const alpThreshold = 87;

  const seriesList = data.series.map((s) => ({
    name: s.name.replace("First Payment Timeliness", "FPT"),
    type: "line",
    smooth: true,
    symbolSize: 8,
    emphasis: { focus: "series" },
    lineStyle: { width: 3, color: metricColors[s.name] || "#999" },
    data: s.values.map((v) => ({
      value: v,
      itemStyle: { color: v >= alpThreshold ? "#2a9d8f" : "#e63946" },
    })),
  }));

  const option = {
    animation: !exportMode,
    tooltip: { trigger: "axis" },
    legend: { bottom: 0 },
    grid: { left: 50, right: 50, top: 50, bottom: 40, containLabel: true },
    xAxis: { type: "category", boundaryGap: false, data: years },
    yAxis: {
      type: "value",
      name: "Percent",
      axisLabel: { formatter: "{value}%" },
    },
    series: [
      {
        name: "ALP (87%)",
        type: "line",
        symbol: "none",
        lineStyle: { type: "dashed", color: "red", width: 2 },
        data: years.map(() => alpThreshold),
      },
      ...seriesList,
    ],
  };

  chart.setOption(option);
  charts[containerId] = chart;
}

function renderNonmonetaryChart(containerId, data, exportMode = false) {
  const chartDom = document.getElementById(containerId);
  if (!chartDom) return;
  if (charts[containerId]) echarts.dispose(chartDom);
  const chart = echarts.init(chartDom, null, { renderer: "svg" });

  const years = data.years;
  const alpThreshold = 80;

  const seriesList = data.series.map((s) => ({
    name: s.name,
    type: "line",
    smooth: true,
    symbolSize: 8,
    emphasis: { focus: "series" },
    lineStyle: { width: 3, color: metricColors[s.name] || "#999" },
    data: s.values.map((v) => ({
      value: v,
      itemStyle: { color: v >= alpThreshold ? "#2a9d8f" : "#e63946" },
    })),
  }));

  const option = {
    animation: !exportMode,
    tooltip: { trigger: "axis" },
    legend: { bottom: 0 },
    grid: { left: 50, right: 50, top: 50, bottom: 40, containLabel: true },
    xAxis: { type: "category", boundaryGap: false, data: years },
    yAxis: {
      type: "value",
      name: "Percent",
      axisLabel: { formatter: "{value}%" },
    },
    series: [
      {
        name: "ALP (80%)",
        type: "line",
        symbol: "none",
        lineStyle: { type: "dashed", color: "red", width: 2 },
        data: years.map(() => alpThreshold),
      },
      ...seriesList,
    ],
  };

  chart.setOption(option);
  charts[containerId] = chart;
}

function renderImproperFraudChart(containerId, data, exportMode = false) {
  const chartDom = document.getElementById(containerId);
  if (!chartDom) return;
  if (charts[containerId]) echarts.dispose(chartDom);
  const chart = echarts.init(chartDom, null, { renderer: "svg" });

  const years = data.years;
  const alpThreshold = 10;

  const seriesList = data.series.map((s) => ({
    name: s.name,
    type: "line",
    smooth: true,
    symbolSize: 8,
    emphasis: { focus: "series" },
    lineStyle: { width: 3, color: metricColors[s.name] || "#999" },
    data: s.values.map((v) => ({
      value: v,
      itemStyle: { color: v > alpThreshold ? "#e63946" : "#2a9d8f" },
    })),
  }));

  const option = {
    animation: !exportMode,
    tooltip: { trigger: "axis" },
    legend: { bottom: 0 },
    grid: { left: 50, right: 50, top: 50, bottom: 40, containLabel: true },
    xAxis: { type: "category", boundaryGap: false, data: years },
    yAxis: {
      type: "value",
      name: "Percent",
      axisLabel: { formatter: "{value}%" },
    },
    series: [
      {
        name: "ALP (10%)",
        type: "line",
        symbol: "none",
        lineStyle: { type: "dashed", color: "red", width: 2 },
        data: years.map(() => alpThreshold),
      },
      ...seriesList,
    ],
  };

  chart.setOption(option);
  charts[containerId] = chart;
}

function renderComparisonTable(containerId, tableData, baseYear) {
  const container = document.getElementById(containerId);
  if (!container) return;

  tableData.sort((a, b) => b.Current - a.Current);

  const rows = tableData
    .map((row, idx) => {
      // Ensure safe text for each field
      const currTxt =
        row.Current != null && !isNaN(row.Current) ? `${row.Current}%` : "NA";
      const prevTxt =
        row.Previous != null && !isNaN(row.Previous)
          ? `${row.Previous}%`
          : "NA";
      const rel =
        row.RelativeChange != null && !isNaN(row.RelativeChange)
          ? `${row.RelativeChange > 0 ? "+" : ""}${row.RelativeChange}%`
          : "NA";

      return `
<tr>
  <td>${row.Metric}</td>
  <td>${currTxt}</td>
  <td>${prevTxt}</td>
  <td>${rel}</td>
</tr>`;
    })
    .join("");

  container.innerHTML = `
<div class="table-responsive">
  <table class="table table-bordered table-sm text-center align-middle comparison-table">
    <thead>
      <tr>
        <th>Metric</th>
        <th>% of Overpayments (${baseYear} PIIA)</th>
        <th>% of Overpayments (${baseYear - 1} PIIA)</th>
        <th>Relative Change</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</div>`;
}

// ------------------- Selectors -------------------
function renderBaseYearSelector(containerId, years, defaultYear) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const select = document.createElement("select");
  select.className = "form-select form-select-sm";
  years.forEach((y) => {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    if (y == defaultYear) opt.selected = true;
    select.appendChild(opt);
  });

  container.innerHTML = "";
  container.appendChild(select);

  select.addEventListener("change", () => {
    currentBaseYear = parseInt(select.value, 10);
    updateDashboard(currentBaseYear, currentCategory);
  });
}

function renderCategorySelector(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const select = document.createElement("select");
  select.className = "form-select form-select-sm";
  [
    { value: "program", label: "Program Integrity Measures" },
    { value: "benefit", label: "Benefit Measures" },
  ].forEach((optDef) => {
    const opt = document.createElement("option");
    opt.value = optDef.value;
    opt.textContent = optDef.label;
    if (optDef.value === currentCategory) opt.selected = true;
    select.appendChild(opt);
  });

  container.innerHTML = "";
  container.appendChild(select);

  select.addEventListener("change", () => {
    currentCategory = select.value;
    updateDashboard(currentBaseYear, currentCategory);
  });
}

function renderStateSelector(containerId, stateCodes, defaultState = "AK") {
  const container = document.getElementById(containerId);
  if (!container) return;

  const select = document.getElementById("stateDropdown");

  select.innerHTML = "";
  stateCodes.forEach((code) => {
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = code;
    if (code === defaultState) opt.selected = true;
    select.appendChild(opt);
  });

  select.addEventListener("change", () => {
    currentState = select.value;
    updateDashboard(currentBaseYear, currentCategory, currentState);
  });
}

// ------------------- State / National Toggle -------------------
function setupScopeToggle() {
  const nationalBtn = document.getElementById("btnNational");
  const stateBtn = document.getElementById("btnState");
  const stateSelector = document.getElementById("state_selector");

  // Default = National
  nationalBtn.classList.add("active");
  stateBtn.classList.remove("active");
  stateSelector.classList.add("hidden");

  nationalBtn.addEventListener("click", () => {
    nationalBtn.classList.add("active");
    stateBtn.classList.remove("active");
    stateSelector.classList.add("hidden");
    currentState = "US";
    updateDashboard(currentBaseYear, currentCategory, currentState);
  });

  stateBtn.addEventListener("click", () => {
    stateBtn.classList.add("active");
    nationalBtn.classList.remove("active");
    stateSelector.classList.remove("hidden");
    currentState = document.getElementById("stateDropdown").value;
    updateDashboard(currentBaseYear, currentCategory, currentState);
  });
}

// ------------------- Dashboard -------------------
function updateDashboard(baseYear, category, stateCode = "US") {
  if (!ALLDATA[stateCode] || !ALLDATA[stateCode][baseYear]) return;

  baseYear = parseInt(baseYear, 10);
  currentBaseYear = baseYear;
  currentState = stateCode;

  const stateData = ALLDATA[stateCode][baseYear];

  // --- Update page title dynamically with two lines ---
  const catLabel =
    category === "program" ? "Program Integrity Measures" : "Benefit Measures";
  const stateLabel = stateCode === "US" ? "National" : stateCode;

  document.getElementById("reportTitle").innerHTML = `
    <div class="title-main">UI Overpayments Report &mdash; ${baseYear}</div>
    <div class="title-sub">(${stateLabel}, ${catLabel})</div>
  `;

  // --- Toggle chart blocks ---
  document.querySelectorAll(".chart-block").forEach((block) => {
    block.style.display = "none";
  });
  document
    .querySelectorAll(`.chart-block[data-category='${category}']`)
    .forEach((block) => {
      block.style.display = "block";
    });

  // --- Build pie data ---
  const pieData = Object.entries(stateData.pie || {}).map(([name, value]) => ({
    name,
    value,
  }));

  // Build the 6-year window (baseYear - 5 through baseYear)
  const yearsRange = [];
  for (let y = baseYear - 5; y <= baseYear; y++) yearsRange.push(y);

  // --- Render charts depending on category ---
  if (category === "program") {
    renderPieChart("pie_chart_container", pieData);

    if (stateData.bump) {
      const bumpData = {
        years: yearsRange,
        series: stateData.bump.series.map((s) => {
          const values = yearsRange.map((yr) => {
            const idx = stateData.bump.years.indexOf(yr);
            return idx !== -1 ? s.values[idx] : null;
          });
          return { ...s, values };
        }),
      };
      renderBumpChart("bump_chart_container", bumpData);
    }

    if (stateData.improperfraud) {
      const ifData = {
        years: yearsRange,
        series: stateData.improperfraud.series.map((s) => {
          const values = yearsRange.map((yr) => {
            const idx = stateData.improperfraud.years.indexOf(yr);
            return idx !== -1 ? s.values[idx] : null;
          });
          return { ...s, values };
        }),
      };
      renderImproperFraudChart("improperfraud_chart_container", ifData);
    }
  } else if (category === "benefit") {
    if (stateData.timeliness) {
      const timelinessData = {
        years: yearsRange,
        series: stateData.timeliness.series.map((s) => {
          const values = yearsRange.map((yr) => {
            const idx = stateData.timeliness.years.indexOf(yr);
            return idx !== -1 ? s.values[idx] : null;
          });
          return { ...s, values };
        }),
      };
      renderTimelinessChart("timeliness_chart_container", timelinessData);
    }

    if (stateData.nonmonetary) {
      const nonmonetaryData = {
        years: yearsRange,
        series: stateData.nonmonetary.series.map((s) => {
          const values = yearsRange.map((yr) => {
            const idx = stateData.nonmonetary.years.indexOf(yr);
            return idx !== -1 ? s.values[idx] : null;
          });
          return { ...s, values };
        }),
      };
      renderNonmonetaryChart("nonmonetary_chart_container", nonmonetaryData);
    }
  }
}

// ------------------- Init -------------------
document.addEventListener("DOMContentLoaded", () => {
  // Assume ALLDATA has structure ALLDATA[stateCode][year]
  const years = Object.keys(ALLDATA["US"])
    .map((y) => parseInt(y))
    .sort((a, b) => b - a);
  const defaultYear = years[0];

  renderBaseYearSelector("base_year_selector", years, defaultYear);
  renderCategorySelector("category_selector");

  // Pass in state abbreviations from R script (like ["US","VA","CA",...])
  renderStateSelector("state_selector", STATE_CODES, "US");

  setupScopeToggle();

  updateDashboard(defaultYear, currentCategory, currentState);

  const toggle = document.getElementById("viewToggle");
  toggle.addEventListener("click", (e) => {
    if (e.target.classList.contains("toggle-option")) {
      document
        .querySelectorAll(".toggle-option")
        .forEach((btn) => btn.classList.remove("active"));
      e.target.classList.add("active");
      switchView(e.target.getAttribute("data-view"));
    }
  });

  window.addEventListener("resize", () => {
    Object.values(charts).forEach((c) => c.resize());
  });
});

function switchView(view) {
  if (!currentBaseYear || !currentState) return;

  if (view === "plots") {
    document.getElementById("plots-view").style.display = "block";
    document.getElementById("table-view").style.display = "none";
    updateDashboard(currentBaseYear, currentCategory, currentState);
  } else {
    document.getElementById("plots-view").style.display = "none";
    document.getElementById("table-view").style.display = "block";

    const stateData = ALLDATA[currentState][currentBaseYear];

    const tableData =
      currentCategory === "program"
        ? stateData.table_program
        : stateData.table_benefit;

    renderComparisonTable(
      "comparison_table_container",
      tableData || [],
      currentBaseYear
    );
  }
}

// ------------------- Export PDF -------------------
async function exportToPDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  console.log("Export button clicked");

  // ---- Cover Page ----
  const titleMain =
    document.querySelector("#reportTitle .title-main")?.innerText ||
    "UI Overpayments Report";
  const titleSub =
    document.querySelector("#reportTitle .title-sub")?.innerText || "";

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text(titleMain, pageWidth / 2, pageHeight / 2 - 10, { align: "center" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(14);
  pdf.text(titleSub, pageWidth / 2, pageHeight / 2 + 5, { align: "center" });

  // Add a new page for charts
  pdf.addPage();

  // ---- Hidden container for charts ----
  const exportDiv = document.createElement("div");
  exportDiv.style.position = "absolute";
  exportDiv.style.left = "-9999px";
  document.body.appendChild(exportDiv);

  const stateData = ALLDATA[currentState][currentBaseYear];
  const chartConfigs = [
    {
      key: "pie",
      renderer: renderPieChart,
      data: Object.entries(stateData.pie || {}).map(([n, v]) => ({
        name: n,
        value: v,
      })),
      header: "Root Causes of Overpayments",
      category: "Program Integrity Measures",
    },
    {
      key: "bump",
      renderer: renderBumpChart,
      data: stateData.bump,
      header: "Top 5 Causes of Overpayment",
      category: "Program Integrity Measures",
    },
    {
      key: "improperfraud",
      renderer: renderImproperFraudChart,
      data: stateData.improperfraud,
      header: "Improper Payment & Fraud Rates",
      category: "Program Integrity Measures",
    },
    {
      key: "timeliness",
      renderer: renderTimelinessChart,
      data: stateData.timeliness,
      header: "First Payment Timeliness (FPT)",
      category: "Benefit Measures",
    },
    {
      key: "nonmonetary",
      renderer: renderNonmonetaryChart,
      data: stateData.nonmonetary,
      header: "Nonmonetary Determination",
      category: "Benefit Measures",
    },
  ];

  let yOffset = 30;
  let currentCategory = null;
  let printedCategories = new Set();

  for (let i = 0; i < chartConfigs.length; i++) {
    const cfg = chartConfigs[i];
    if (!cfg.data) continue;

    // ---- Category header (print once per category) ----
    if (currentCategory !== cfg.category) {
      if (currentCategory !== null) {
        pdf.addPage();
        yOffset = 30;
      }
      currentCategory = cfg.category;

      if (!printedCategories.has(currentCategory)) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(16);
        pdf.setTextColor(10, 34, 57);
        pdf.text(currentCategory, pageWidth / 2, yOffset, { align: "center" });
        pdf.setTextColor(0, 0, 0);
        yOffset += 12;

        printedCategories.add(currentCategory);
      }
    }

    // ---- Estimate chart height ----
    let estHeight = 110;
    if (cfg.key === "pie") estHeight = 100;
    if (cfg.key === "bump") estHeight = 130;
    if (cfg.key === "improperfraud") estHeight = 130;
    if (cfg.key === "timeliness" || cfg.key === "nonmonetary") estHeight = 130;

    const needed = estHeight + 20;
    if (yOffset + needed > pageHeight - 20) {
      pdf.addPage();
      yOffset = 30;

      // ✅ Reprint ONLY section header, not category header
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text(cfg.header, pageWidth / 2, yOffset, { align: "center" });
      yOffset += 6;
    } else {
      // ---- Section header ----
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text(cfg.header, pageWidth / 2, yOffset, { align: "center" });
      yOffset += 6;
    }

    // ---- Render chart ----
    const container = document.createElement("div");
    container.style.width = "700px";
    container.style.height = "400px";

    if (cfg.key === "bump") {
      container.style.width = "900px";
      container.style.height = "450px";
    } else if (cfg.key === "pie") {
      container.style.width = "600px";
      container.style.height = "350px";
    }

    container.id = cfg.key + "_export";
    exportDiv.appendChild(container);

    cfg.renderer(container.id, cfg.data, true);

    await new Promise((resolve) => setTimeout(resolve, 300));
    const svgEl = container.querySelector("svg");
    if (!svgEl) continue;

    svgEl.removeAttribute("style");
    const w = svgEl.getAttribute("width") || 700;
    const h = svgEl.getAttribute("height") || 500;
    svgEl.setAttribute("viewBox", `0 0 ${w} ${h}`);

    const aspectRatio = w / h;
    let drawW = pageWidth - 40;
    let drawH = drawW / aspectRatio;

    if (yOffset + drawH > pageHeight - 20) {
      pdf.addPage();
      yOffset = 30;

      // ✅ Reprint ONLY section header
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text(cfg.header, pageWidth / 2, yOffset, { align: "center" });
      yOffset += 6;
    }

    await window.svg2pdf.svg2pdf(svgEl, pdf, {
      x: (pageWidth - drawW) / 2,
      y: yOffset,
      width: drawW,
      height: drawH,
    });

    yOffset += drawH + 20;
  }

  // ---- Cleanup ----
  document.body.removeChild(exportDiv);

  // ---- Table export ----
  const tableEl = document.querySelector("#comparison_table_container table");
  if (tableEl) {
    pdf.addPage();
    pdf.autoTable({
      html: tableEl,
      theme: "grid",
      headStyles: { fillColor: [10, 34, 57] },
      margin: { top: 20 },
    });
  }

  pdf.save("UI_Overpayments_Report.pdf");
}

// ------------------- Hook Export Button -------------------
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("exportPDFBtn");
  if (btn) {
    console.log("Attaching click handler to Export PDF button");
    btn.addEventListener("click", exportToPDF);
  }
});
