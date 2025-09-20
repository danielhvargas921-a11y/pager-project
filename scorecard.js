let charts = {};
let currentBaseYear = null;
let currentCategory = "program";

const metricColors = {
  "Work Search": "#3b8ee2",
  "Benefit Year Earnings": "#4cc74c",
  "Separation Issues": "#f04848",
  "Able + Available": "#ff9b1f",
  "Employment Service Registration": "#4dd2d2",
  "Base Period Wages": "#ffd23b",
  "Other Eligibility Issues": "#c15fcf",
  "All Other Causes": "#ff7b93",
  "Improper Payment Rate": "#2a9d8f",
  "Fraud Rate": "#e76f51",
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
  let chartDom = document.getElementById(containerId);
  if (!chartDom) return;
  if (charts[containerId]) echarts.dispose(chartDom);
  let chart = echarts.init(chartDom);

  const years = data.years;
  const seriesList = data.series.map((s) => ({
    name: s.name.replace("First Payment Timeliness", "FPT"),
    type: "line",
    smooth: true,
    symbolSize: 8,
    emphasis: { focus: "series" },
    lineStyle: { width: 3, color: metricColors[s.name] || undefined },
    itemStyle: { color: metricColors[s.name] || undefined },
    data: s.values,
  }));

  let option = {
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
    series: seriesList.concat([
      {
        name: "ALP (87%)",
        type: "line",
        symbol: "none", // no points
        lineStyle: { type: "dashed", color: "red", width: 2 },
        itemStyle: { color: "red" },
        data: years.map(() => 87),
      },
    ]),
  };

  chart.setOption(option);
  charts[containerId] = chart;
}

function renderNonmonetaryChart(containerId, data) {
  let chartDom = document.getElementById(containerId);
  if (!chartDom) return;
  if (charts[containerId]) echarts.dispose(chartDom);
  let chart = echarts.init(chartDom);

  const years = data.years;
  const seriesList = data.series.map((s) => ({
    name: s.name,
    type: "line",
    smooth: true,
    symbolSize: 8,
    emphasis: { focus: "series" },
    lineStyle: { width: 3, color: metricColors[s.name] || "#999" },
    itemStyle: { color: metricColors[s.name] || "#999" },
    data: s.values,
  }));

  // Add ALP reference line
  seriesList.push({
    name: "ALP (80%)",
    type: "line",
    symbol: "none", // no points
    lineStyle: { type: "dashed", color: "red", width: 2 },
    itemStyle: { color: "red" },
    data: years.map(() => 80),
  });

  let option = {
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
    series: seriesList,
  };

  chart.setOption(option);
  charts[containerId] = chart;
}

function renderImproperFraudChart(containerId, data) {
  let chartDom = document.getElementById(containerId);
  if (!chartDom) return;
  if (charts[containerId]) echarts.dispose(chartDom);
  let chart = echarts.init(chartDom);

  const years = data.years;
  const seriesList = data.series.map((s) => ({
    name: s.name,
    type: "line",
    smooth: true,
    symbolSize: 8,
    emphasis: { focus: "series" },
    lineStyle: { width: 3, color: metricColors[s.name] || undefined },
    itemStyle: { color: metricColors[s.name] || undefined },
    data: s.values,
  }));

  let option = {
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
    series: seriesList.concat([
      {
        name: "ALP (10%)",
        type: "line",
        symbol: "none",
        lineStyle: { type: "dashed", color: "red", width: 2 },
        itemStyle: { color: "red" },
        data: years.map(() => 10),
      },
    ]),
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

// ------------------- Dashboard -------------------
function updateDashboard(baseYear, category) {
  if (!ALLDATA[baseYear]) return;
  baseYear = parseInt(baseYear, 10);
  currentBaseYear = baseYear;

  // --- Update page title dynamically (using HTML entity for em dash) ---
  const catLabel =
    category === "program" ? "Program Integrity Measures" : "Benefit Measures";
  document.getElementById(
    "reportTitle"
  ).innerHTML = `UI Overpayments Report &mdash; ${baseYear} (${catLabel})`;

  // --- Pie data ---
  const pieData = Object.entries(ALLDATA[baseYear].pie || {}).map(
    ([name, value]) => ({ name, value })
  );

  // Update table depending on category
  if (category === "program") {
    renderComparisonTable(
      "comparison_table_container",
      ALLDATA[baseYear].table_program || [],
      baseYear
    );
  } else if (category === "benefit") {
    renderComparisonTable(
      "comparison_table_container",
      ALLDATA[baseYear].table_benefit || [],
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

    if (ALLDATA[baseYear].bump) {
      const bumpData = {
        years: yearsRange,
        series: ALLDATA[baseYear].bump.series.map((s) => {
          const values = yearsRange.map((yr) => {
            const idx = ALLDATA[baseYear].bump.years.indexOf(yr);
            return idx !== -1 ? s.values[idx] : null;
          });
          return { ...s, values };
        }),
      };
      renderBumpChart("bump_chart_container", bumpData);
    }

    if (ALLDATA[baseYear].improperfraud) {
      const ifData = {
        years: yearsRange,
        series: ALLDATA[baseYear].improperfraud.series.map((s) => {
          const values = yearsRange.map((yr) => {
            const idx = ALLDATA[baseYear].improperfraud.years.indexOf(yr);
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

    if (ALLDATA[baseYear].timeliness) {
      const timelinessData = {
        years: yearsRange,
        series: ALLDATA[baseYear].timeliness.series.map((s) => {
          const values = yearsRange.map((yr) => {
            const idx = ALLDATA[baseYear].timeliness.years.indexOf(yr);
            return idx !== -1 ? s.values[idx] : null;
          });
          return { ...s, values };
        }),
      };
      renderTimelinessChart("timeliness_chart_container", timelinessData);
    }

    if (ALLDATA[baseYear].nonmonetary) {
      const nonmonetaryData = {
        years: yearsRange,
        series: ALLDATA[baseYear].nonmonetary.series.map((s) => {
          const values = yearsRange.map((yr) => {
            const idx = ALLDATA[baseYear].nonmonetary.years.indexOf(yr);
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
  const years = Object.keys(ALLDATA)
    .map((y) => parseInt(y))
    .sort((a, b) => b - a);
  const defaultYear = years[0];

  renderBaseYearSelector("base_year_selector", years, defaultYear);
  renderCategorySelector("category_selector");

  updateDashboard(defaultYear, currentCategory);

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
  if (!currentBaseYear) return;

  if (view === "plots") {
    document.getElementById("plots-view").style.display = "block";
    document.getElementById("table-view").style.display = "none";
    updateDashboard(currentBaseYear, currentCategory);
  } else {
    document.getElementById("plots-view").style.display = "none";
    document.getElementById("table-view").style.display = "block";

    const tableData =
      currentCategory === "program"
        ? ALLDATA[currentBaseYear].table_program
        : ALLDATA[currentBaseYear].table_benefit;

    renderComparisonTable(
      "comparison_table_container",
      tableData || [],
      currentBaseYear
    );
  }
}
