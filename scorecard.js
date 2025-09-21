let charts = {};
let currentBaseYear = null;
let currentCategory = "program";
let currentState = "AK";

const metricColors = {
  "Work Search": "#3b8ee2",
  "Benefit Year Earnings": "#4cc74c",
  "Separation Issues": "#f04848",
  "Able + Available": "#ff9b1f",
  "Employment Service Registration": "#4dd2d2",
  "Base Period Wages": "#ffd23b",
  "Other Eligibility Issues": "#c15fcf",
  "All Other Causes": "#ff7b93",
  "Improper Payment Rate": "#1f77b4", // blue
  "Fraud Rate": "#ff7f0e", // orange
  "First Payment Timeliness (14 days)": "#2a9d8f",
  "First Payment Timeliness (21 days)": "#e76f51",
  "Nonmonetary Determination": "#9467bd", // purple
};

// ------------------- Chart Renderers -------------------
function renderPieChart(containerId, pieData) {
  let chartDom = document.getElementById(containerId);
  if (!chartDom) return;
  if (charts[containerId]) echarts.dispose(chartDom);
  let chart = echarts.init(chartDom);

  let option = {
    title: { text: "Root Causes of Overpayments", left: "center" },
    tooltip: { trigger: "item", formatter: "{b}: {c}%" },
    series: [
      {
        type: "pie",
        radius: ["35%", "75%"],
        center: ["50%", "55%"],
        data: pieData.map((d) => ({
          ...d,
          itemStyle: { color: metricColors[d.name] || "#999" },
        })),
        label: { formatter: "{b}: {c}%" },
      },
    ],
  };

  chart.setOption(option);
  charts[containerId] = chart;
}

function renderBumpChart(containerId, bumpData) {
  let chartDom = document.getElementById(containerId);
  if (!chartDom) return;
  if (charts[containerId]) echarts.dispose(chartDom);
  let chart = echarts.init(chartDom);

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
    title: { text: "Top 5 Causes of Overpayment", left: "center" },
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

function renderTimelinessChart(containerId, data) {
  const chartDom = document.getElementById(containerId);
  if (!chartDom) return;
  if (charts[containerId]) echarts.dispose(chartDom);
  const chart = echarts.init(chartDom);

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
      itemStyle: {
        color: v >= alpThreshold ? "#2a9d8f" : "#e63946", // green if above line, red if below
      },
    })),
  }));

  const option = {
    title: { text: "First Payment Timeliness (FPT)", left: "center", top: 0 },
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

function renderNonmonetaryChart(containerId, data) {
  const chartDom = document.getElementById(containerId);
  if (!chartDom) return;
  if (charts[containerId]) echarts.dispose(chartDom);
  const chart = echarts.init(chartDom);

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
      itemStyle: {
        color: v >= alpThreshold ? "#2a9d8f" : "#e63946", // green if above line, red if below
      },
    })),
  }));

  const option = {
    title: { text: "Nonmonetary Determination", left: "center", top: 0 },
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

function renderImproperFraudChart(containerId, data) {
  const chartDom = document.getElementById(containerId);
  if (!chartDom) return;
  if (charts[containerId]) echarts.dispose(chartDom);
  const chart = echarts.init(chartDom);

  const years = data.years;
  const alpThreshold = 10;

  // Series with per-point coloring
  const seriesList = data.series.map((s) => ({
    name: s.name,
    type: "line",
    smooth: true,
    symbolSize: 8,
    emphasis: { focus: "series" },
    lineStyle: { width: 3, color: metricColors[s.name] || "#999" },
    data: s.values.map((v) => ({
      value: v,
      itemStyle: {
        color: v > alpThreshold ? "#e63946" : "#2a9d8f", // red fail / green pass
      },
    })),
  }));

  const option = {
    title: { text: "Improper Payment & Fraud Rates", left: "center", top: 0 },
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
      // ALP dashed reference line
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
<tr class="fade-in" style="animation-delay:${idx * 0.3}s">
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

  // --- Update page title dynamically (using HTML entity for em dash) ---
  const catLabel =
    category === "program" ? "Program Integrity Measures" : "Benefit Measures";
  document.getElementById(
    "reportTitle"
  ).innerHTML = `UI Overpayments Report &mdash; ${baseYear} (${catLabel}, ${stateCode})`;

  // --- Pie data ---
  const pieData = Object.entries(stateData.pie || {}).map(([name, value]) => ({
    name,
    value,
  }));

  // Update table depending on category
  if (category === "program") {
    renderComparisonTable(
      "comparison_table_container",
      stateData.table_program || [],
      baseYear
    );
  } else if (category === "benefit") {
    renderComparisonTable(
      "comparison_table_container",
      stateData.table_benefit || [],
      baseYear
    );
  }

  // Build the 6-year window (baseYear - 5 through baseYear)
  const yearsRange = [];
  for (let y = baseYear - 5; y <= baseYear; y++) yearsRange.push(y);

  // Hide all plots first
  [
    "pie_chart_container",
    "bump_chart_container",
    "improperfraud_chart_container",
    "timeliness_chart_container",
    "nonmonetary_chart_container",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  if (category === "program") {
    // Show program-related charts
    document.getElementById("pie_chart_container").style.display = "block";
    document.getElementById("bump_chart_container").style.display = "block";
    document.getElementById("improperfraud_chart_container").style.display =
      "block";

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
    // Show benefit-related charts
    document.getElementById("timeliness_chart_container").style.display =
      "block";
    document.getElementById("nonmonetary_chart_container").style.display =
      "block";

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
