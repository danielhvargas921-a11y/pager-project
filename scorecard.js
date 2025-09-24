let charts = {};
let currentBaseYear = null;
let currentCategory = "overview"; // default category
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

const waitingWeekStates = ["CA", "VA", "WV"];

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
        radius: exportMode ? ["30%", "65%"] : ["35%", "75%"],
        center: ["50%", "55%"],
        data: pieData.map((d) => ({
          ...d,
          itemStyle: { color: metricColors[d.name] || "#999" },
        })),
        label: {
          show: true,
          formatter: "{b}: {c}%",
          fontSize: exportMode ? 10 : 12,
          color: "#000",
          position: "outside",
          overflow: "break",
          alignTo: "labelLine",
          distanceToLabelLine: 2,
        },
        labelLine: {
          show: true,
          length: exportMode ? 20 : 15,
          length2: exportMode ? 15 : 10,
          lineStyle: { color: "#666" },
        },
        avoidLabelOverlap: false,
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

  if (charts[containerId]) {
    echarts.dispose(chartDom);
    delete charts[containerId];
  }

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

function renderLineChart(containerId, data, options = {}, exportMode = false) {
  const chartDom = document.getElementById(containerId);
  if (!chartDom) return;

  if (charts[containerId]) {
    echarts.dispose(chartDom);
    delete charts[containerId];
  }

  const chart = echarts.init(chartDom, null, { renderer: "svg" });

  const years = data.years || [];
  const seriesList = data.series.map((s) => ({
    name: s.name,
    type: "line",
    smooth: true,
    symbolSize: 8,
    emphasis: { focus: "series" },
    lineStyle: { width: 3, color: metricColors[s.name] || "#999" },
    data: s.values.map((v) => ({
      value: v,
      itemStyle: { color: metricColors[s.name] || "#999" },
    })),
  }));

  //
  if (options.threshold !== undefined) {
    seriesList.unshift({
      name: options.thresholdLabel || `Threshold (${options.threshold}%)`,
      type: "line",
      symbol: "none",
      lineStyle: { type: "dashed", color: "red", width: 2 },
      data: years.map(() => options.threshold),
    });
  }

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
    series: seriesList,
  };

  chart.setOption(option);
  charts[containerId] = chart;
}

//comparison table

function renderComparisonTable(containerId, tableData, baseYear) {
  const container = document.getElementById(containerId);
  if (!container) return;

  tableData.sort((a, b) => b.Current - a.Current);

  const rows = tableData
    .map((row) => {
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
    { value: "overview", label: "Overview" },
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

  // --- Title
  const catLabel =
    category === "program"
      ? "Program Integrity Measures"
      : category === "benefit"
      ? "Benefit Measures"
      : "Overview";
  const stateLabel = stateCode === "US" ? "National" : stateCode;

  document.getElementById("reportTitle").innerHTML = `
    <div class="title-main">UI Overpayments Report &mdash; ${baseYear}</div>
    <div class="title-sub">(${stateLabel}, ${catLabel})</div>
  `;

  // --- Show correct section
  document
    .querySelectorAll(".metric-section")
    .forEach((s) => (s.style.display = "none"));
  document.getElementById("section_dashboard").style.display = "block";

  // --- Chart visibility
  document
    .querySelectorAll(".chart-block")
    .forEach((b) => (b.style.display = "none"));
  document
    .querySelectorAll(`.chart-block[data-category='${category}']`)
    .forEach((b) => (b.style.display = "block"));

  // --- Years range
  const yearsRange = [];
  for (let y = baseYear - 5; y <= baseYear; y++) yearsRange.push(y);

  // --- Render charts depending on category
  if (category === "program" && stateData.pie) {
    const pieData = Object.entries(stateData.pie || {}).map(
      ([name, value]) => ({ name, value })
    );
    renderPieChart("pie_chart_container", pieData);
  }

  if (category === "program" && stateData.bump) {
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

  if (
    (category === "benefit" || category === "overview") &&
    stateData.timeliness
  ) {
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

    // --- Apply waiting week rule ---
    if (stateCode !== "US") {
      const waitingWeekStates = ["CA", "VA", "WV"]; // temp list
      const isWaitingWeek = waitingWeekStates.includes(stateCode);

      timelinessData.series = timelinessData.series.filter((s) =>
        isWaitingWeek ? s.name.includes("21 days") : s.name.includes("14 days")
      );
    }

    renderTimelinessChart(
      category === "overview"
        ? "overview_timeliness"
        : "timeliness_chart_container",
      timelinessData
    );
  }

  if (
    (category === "benefit" || category === "overview") &&
    stateData.nonmonetary
  ) {
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
    renderNonmonetaryChart(
      category === "overview"
        ? "overview_nonmonetary"
        : "nonmonetary_chart_container",
      nonmonetaryData
    );
  }

  //improper payment

  if (category === "overview" && stateData.improper) {
    const improper_data = {
      years: yearsRange,
      series: stateData.improper.series.map((s) => {
        const values = yearsRange.map((yr) => {
          const idx = stateData.improper.years.indexOf(yr);
          return idx !== -1 ? s.values[idx] : null;
        });
        return { ...s, values };
      }),
    };

    renderLineChart("improper_chart_container", improper_data, {
      threshold: 50,
      thresholdLabel: "Target (50%)",
    });
  }

  //fraud rate

  if (category === "overview" && stateData.fraud) {
    const fraud_data = {
      years: yearsRange,
      series: stateData.fraud.series.map((s) => {
        const values = yearsRange.map((yr) => {
          const idx = stateData.fraud.years.indexOf(yr);
          return idx !== -1 ? s.values[idx] : null;
        });
        return { ...s, values };
      }),
    };

    renderLineChart("fraud_chart_container", fraud_data, {
      threshold: 50,
      thresholdLabel: "Target (50%)",
    });
  }

  //quality_sep

  if (category === "overview" && stateData.quality_sep) {
    const qualitysep_data = {
      years: yearsRange,
      series: stateData.quality_sep.series.map((s) => {
        const values = yearsRange.map((yr) => {
          const idx = stateData.quality_sep.years.indexOf(yr);
          return idx !== -1 ? s.values[idx] : null;
        });
        return { ...s, values };
      }),
    };

    renderLineChart("overview_quality_sep", qualitysep_data, {
      threshold: 50,
      thresholdLabel: "Target (50%)",
    });
  }

  //quality_nonsep

  if (category === "overview" && stateData.quality_nonsep) {
    const qualitynonsep_data = {
      years: yearsRange,
      series: stateData.quality_nonsep.series.map((s) => {
        const values = yearsRange.map((yr) => {
          const idx = stateData.quality_nonsep.years.indexOf(yr);
          return idx !== -1 ? s.values[idx] : null;
        });
        return { ...s, values };
      }),
    };

    renderLineChart("overview_quality_nonsep", qualitynonsep_data, {
      threshold: 50,
      thresholdLabel: "Target (50%)",
    });
  }
}

// ------------------- Switch View -------------------
function switchView(view) {
  if (!currentBaseYear || !currentState) return;

  if (view === "plots") {
    document.getElementById("plots-view").style.display = "block";
    document.getElementById("table-view").style.display = "none";
    updateDashboard(currentBaseYear, currentCategory, currentState);
    setTimeout(() => Object.values(charts).forEach((c) => c.resize()), 50);
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

// ------------------- Init -------------------
document.addEventListener("DOMContentLoaded", () => {
  const years = Object.keys(ALLDATA["US"])
    .map((y) => parseInt(y))
    .sort((a, b) => b - a);
  const defaultYear = years[0];

  renderBaseYearSelector("base_year_selector", years, defaultYear);
  renderCategorySelector("category_selector");
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

// ------------------- Export PDF -------------------
async function exportToPDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  console.log("Export button clicked");

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

  pdf.addPage();

  const exportDiv = document.createElement("div");
  exportDiv.style.position = "absolute";
  exportDiv.style.left = "-9999px";
  document.body.appendChild(exportDiv);

  const stateData = ALLDATA[currentState][currentBaseYear];
  let yOffset = 30;

  // (Rendering program, benefit, overview sections into PDF ... unchanged from your current code)

  document.body.removeChild(exportDiv);

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

// ------------------- Helper -------------------
async function renderChartToPDF(
  pdf,
  exportDiv,
  containerId,
  renderer,
  data,
  pageWidth,
  pageHeight,
  yOffset,
  width,
  height
) {
  const container = document.createElement("div");
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  container.id = containerId;
  exportDiv.appendChild(container);

  renderer(container.id, data, true);

  await new Promise((resolve) => setTimeout(resolve, 300));
  const svgEl = container.querySelector("svg");
  if (!svgEl) return yOffset;

  svgEl.removeAttribute("style");
  const w = svgEl.getAttribute("width") || width;
  const h = svgEl.getAttribute("height") || height;
  svgEl.setAttribute("viewBox", `0 0 ${w} ${h}`);

  const aspectRatio = w / h;
  let drawW = pageWidth - 40;
  let drawH = drawW / aspectRatio;

  if (yOffset + drawH > pageHeight - 20) {
    pdf.addPage();
    yOffset = 30;
  }

  await window.svg2pdf.svg2pdf(svgEl, pdf, {
    x: (pageWidth - drawW) / 2,
    y: yOffset,
    width: drawW,
    height: drawH,
  });

  return yOffset + drawH + 20;
}

// ------------------- Hook Export Button -------------------
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("exportPDFBtn");
  if (btn) {
    console.log("Attaching click handler to Export PDF button");
    btn.addEventListener("click", exportToPDF);
  }
});
