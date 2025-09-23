if (!requireNamespace("glue", quietly = TRUE)) install.packages("glue")
if (!requireNamespace("jsonlite", quietly = TRUE)) install.packages("jsonlite")
if (!requireNamespace("dplyr", quietly = TRUE)) install.packages("dplyr")
if (!requireNamespace("lubridate", quietly = TRUE)) install.packages("lubridate")

library(glue)
library(jsonlite)
library(dplyr)
library(lubridate)

# hardcoded variables

year_range <- "Jul-Jun"
base_path <- "C:/Users/Vargas.Daniel.H/Desktop/SCORE CARD PROJECT/main/scorecard/pager-project"

f <- file.path(base_path, "scorecard_data.csv")
df_raw <- read.csv(f, stringsAsFactors = FALSE, header = TRUE, check.names = FALSE)

stopifnot(all(c("State", "Date") %in% names(df_raw)))
df_raw$Date <- as.Date(df_raw$Date, format = "%m/%d/%Y")

metrics_for_pie <- c(
  "Work Search", "Benefit Year Earnings", "Separation Issues", "Able + Available",
  "Employment Service Registration", "Base Period Wages", "Other Eligibility Issues", "All Other Causes"
)

metrics_timeliness <- c(
  "First Payment Timeliness (14 days)",
  "First Payment Timeliness (21 days)"
)

metrics_improperfraud <- c(
  "Improper Payment Rate",
  "Fraud Rate"
)

# ---------------- helper functions ---
numify <- function(x) as.numeric(gsub("%", "", as.character(x)))

annual_last_month <- function(df, year, range, metrics, state = "US") {
  target_date <- if (range == "Jul-Jun") {
    as.Date(paste0(year, "-06-01"))
  } else {
    as.Date(paste0(year, "-12-01"))
  }

  df_sub <- df %>%
    filter(State == state, format(Date, "%Y-%m") == format(target_date, "%Y-%m"))

  if (nrow(df_sub) == 0) {
    return(NULL)
  }

  vals <- df_sub[1, metrics, drop = FALSE]
  vals[] <- lapply(vals, numify)
  as.numeric(vals[1, ])
}

annual_multi_year <- function(df, base_year, range, metrics, state = "US", n_years = 6) {
  years <- (base_year - (n_years - 1)):base_year

  results <- lapply(years, function(y) {
    v <- annual_last_month(df, y, range, metrics, state = state)
    if (is.null(v)) {
      return(NULL)
    }
    setNames(as.list(v), metrics)
  })

  names(results) <- years
  results <- Filter(Negate(is.null), results)
  if (length(results) == 0) {
    return(NULL)
  }

  out <- bind_rows(results, .id = "Year")
  out$Year <- as.integer(out$Year)
  out
}

# ---------------- Build data ----------------
all_years <- c(2024, 2025)
all_states <- unique(df_raw$State)
all_states <- c("AK", "AL", "US") ### TEMPORARY CODE TESTING

all_data <- list()

for (st in all_states) {
  state_list <- list()

  for (y in all_years) {
    # --- PIE/TABLE ---
    vals <- annual_last_month(df_raw, y, year_range, metrics_for_pie, state = st)
    if (is.null(vals)) next
    total <- sum(vals, na.rm = TRUE)
    proportions <- round(100 * vals / total, 1)

    prev_vals <- annual_last_month(df_raw, y - 1, year_range, metrics_for_pie, state = st)
    prev_prop <- if (!is.null(prev_vals)) round(100 * prev_vals / sum(prev_vals, na.rm = TRUE), 1) else rep(NA_real_, length(metrics_for_pie))

    rel <- round(as.numeric(proportions) - as.numeric(prev_prop), 1)
    rel[is.na(rel)] <- NA_real_

    table_df <- data.frame(
      Metric = metrics_for_pie,
      Current = as.numeric(proportions),
      Previous = as.numeric(prev_prop),
      RelativeChange = rel,
      check.names = FALSE
    )


    # --- Build validation table ---
    validation_metrics <- c(
      "First Payment Timeliness (14 days)",
      "First Payment Timeliness (21 days)",
      "Nonmonetary Determination",
      "Improper Payment Rate",
      "Fraud Rate"
    )

    # For each state, grab the most recent year’s values
    validation_table <- lapply(all_states, function(st) {
      latest_year <- max(all_years)
      vals <- annual_last_month(df_raw, latest_year, year_range, validation_metrics, state = st)
      if (is.null(vals)) {
        return(NULL)
      }
      data.frame(State = st, t(vals), stringsAsFactors = FALSE)
    })

    validation_table <- do.call(rbind, validation_table)

    # Clean column names
    colnames(validation_table) <- c("State", validation_metrics)

    # Store into ALLDATA so JS can use it
    all_data$validation_table <- validation_table


    # all plots being built #####################

    benefit_table_df <- NULL

    # Timeliness table
    t_vals <- annual_last_month(df_raw, y, year_range, metrics_timeliness, state = st)
    prev_t_vals <- annual_last_month(df_raw, y - 1, year_range, metrics_timeliness, state = st)
    if (!is.null(t_vals)) {
      t_prev <- if (!is.null(prev_t_vals)) prev_t_vals else rep(NA_real_, length(metrics_timeliness))
      t_rel <- round(as.numeric(t_vals) - as.numeric(t_prev), 1)
      t_df <- data.frame(
        Metric = metrics_timeliness,
        Current = as.numeric(t_vals),
        Previous = as.numeric(t_prev),
        RelativeChange = t_rel,
        check.names = FALSE
      )
      benefit_table_df <- rbind(benefit_table_df, t_df)
    }

    # Nonmonetary table
    nm_vals <- annual_last_month(df_raw, y, year_range, "Nonmonetary Determination", state = st)
    prev_nm_vals <- annual_last_month(df_raw, y - 1, year_range, "Nonmonetary Determination", state = st)
    if (!is.null(nm_vals)) {
      nm_prev <- if (!is.null(prev_nm_vals)) prev_nm_vals else NA_real_
      nm_rel <- round(as.numeric(nm_vals) - as.numeric(nm_prev), 1)
      nm_df <- data.frame(
        Metric = "Nonmonetary Determination",
        Current = as.numeric(nm_vals),
        Previous = as.numeric(nm_prev),
        RelativeChange = nm_rel,
        check.names = FALSE
      )
      benefit_table_df <- rbind(benefit_table_df, nm_df)
    }

    # bump table
    counts_df <- annual_multi_year(df_raw, y, year_range, metrics_for_pie, state = st, n_years = 6)
    bump_data <- NULL
    if (!is.null(counts_df)) {
      row_totals <- rowSums(counts_df[, metrics_for_pie], na.rm = TRUE)
      prop_df <- as.data.frame(round(100 * sweep(counts_df[, metrics_for_pie], 1, row_totals, "/"), 1))
      prop_df$Year <- counts_df$Year

      base_row_idx <- which(prop_df$Year == y)
      base_vals_p <- as.numeric(prop_df[base_row_idx, metrics_for_pie])
      names(base_vals_p) <- metrics_for_pie
      top_metrics <- names(sort(base_vals_p, decreasing = TRUE))[1:5]

      series_list <- lapply(top_metrics, function(m) {
        list(name = m, values = as.numeric(prop_df[[m]]))
      })

      bump_data <- list(
        years = as.numeric(prop_df$Year),
        series = series_list
      )
    }

    # --- TIMELINESS ---
    timeliness_data <- NULL
    if (!is.null(t_vals)) {
      multi_t <- annual_multi_year(df_raw, y, year_range, metrics_timeliness, state = st, n_years = 6)
      t_series <- lapply(metrics_timeliness, function(m) {
        list(name = m, values = as.numeric(multi_t[[m]]))
      })
      timeliness_data <- list(years = as.numeric(multi_t$Year), series = t_series)
    }

    # --- NONMONETARY ---
    nm_data <- NULL
    if (!is.null(nm_vals)) {
      multi_nm <- annual_multi_year(df_raw, y, year_range, "Nonmonetary Determination", state = st, n_years = 6)
      nm_series <- list(list(name = "Nonmonetary Determination", values = as.numeric(multi_nm[["Nonmonetary Determination"]])))
      nm_data <- list(years = as.numeric(multi_nm$Year), series = nm_series)
    }

    # --- IMPROPER/FRAUD ---
    improper_data <- NULL
    fraud_data <- NULL
    if (all(metrics_improperfraud %in% names(df_raw))) {
      if_vals <- annual_last_month(df_raw, y, year_range, metrics_improperfraud, state = st)
      if (!is.null(if_vals)) {
        multi_if <- annual_multi_year(df_raw, y, year_range, metrics_improperfraud, state = st, n_years = 6)

        # Improper Payment Rate
        if ("Improper Payment Rate" %in% names(multi_if)) {
          improper_data <- list(
            years = as.numeric(multi_if$Year),
            series = list(list(name = "Improper Payment Rate", values = as.numeric(multi_if[["Improper Payment Rate"]])))
          )
        }

        # Fraud Rate
        if ("Fraud Rate" %in% names(multi_if)) {
          fraud_data <- list(
            years = as.numeric(multi_if$Year),
            series = list(list(name = "Fraud Rate", values = as.numeric(multi_if[["Fraud Rate"]])))
          )
        }
      }
    }

    # --- Quality (Separation) ---

    quality_sep_data <- NULL

    qs_vals <- annual_last_month(df_raw, y, year_range, "Quality (Separation)", state = st)
    if (!is.null(qs_vals)) {
      qs_nm <- annual_multi_year(df_raw, y, year_range, "Quality (Separation)", state = st, n_years = 6)
      qs_series <- list(list(name = "Quality (Separation)", values = as.numeric(qs_nm[["Quality (Separation)"]])))
      quality_sep_data <- list(years = as.numeric(qs_nm$Year), series = qs_series)
    }


    # --- Quality (Non - Separation) ---

    quality_nonsep_data <- NULL

    nqs_vals <- annual_last_month(df_raw, y, year_range, "Quality (Non - Separation)", state = st)
    if (!is.null(nqs_vals)) {
      qns_nm <- annual_multi_year(df_raw, y, year_range, "Quality (Non - Separation)", state = st, n_years = 6)
      qns_series <- list(list(name = "Quality (Non - Separation)", values = as.numeric(qns_nm[["Quality (Non - Separation)"]])))
      quality_nonsep_data <- list(years = as.numeric(qns_nm$Year), series = qns_series)
    }

    # assemble per year
    state_list[[as.character(y)]] <- list(
      pie = as.list(setNames(proportions, metrics_for_pie)),
      table_program = table_df,
      table_benefit = benefit_table_df,
      bump = bump_data,
      timeliness = timeliness_data,
      improper = improper_data,
      fraud = fraud_data,
      nonmonetary = nm_data,
      quality_sep = quality_sep_data,
      quality_nonsep = quality_nonsep_data
    )
  }

  # attach to main list
  all_data[[st]] <- state_list
}

# ---------------- Export JS ----------------
alldata_js <- paste0(
  "<script>\nvar ALLDATA = ",
  jsonlite::toJSON(all_data, dataframe = "rows", auto_unbox = TRUE, pretty = TRUE),
  ";\n</script>\n"
)

# ---------------- Export STATE_CODES ----------------
state_list <- sort(setdiff(unique(df_raw$State), "US"))
states_js <- paste0(
  "<script>\nvar STATE_CODES = ",
  jsonlite::toJSON(state_list, auto_unbox = TRUE, pretty = FALSE),
  ";\n</script>\n"
)

# ---------------- Inline CSS/JS ----------------
css_lines <- readLines(file.path(base_path, "scorecard.css"), warn = FALSE, encoding = "UTF-8")
if (length(css_lines) > 0) css_lines[1] <- sub("^\ufeff", "", css_lines[1])
css_code <- paste0("<style>\n", paste(css_lines, collapse = "\n"), "\n</style>")

js_text <- readChar(file.path(base_path, "scorecard.js"),
  file.info(file.path(base_path, "scorecard.js"))$size,
  useBytes = TRUE
)
js_text <- sub("^\ufeff", "", js_text)
if (substr(js_text, nchar(js_text), nchar(js_text)) != "\n") js_text <- paste0(js_text, "\n")
js_code <- paste0("<script>\n", js_text, "</script>")

# ---------------- Template Injection ----------------
template <- readLines(file.path(base_path, "scorecard_template.html"))
today <- Sys.Date()

section_html <- glue('
<div class="metric-section" id="section_dashboard">
  <!-- Plots view -->
  <div id="plots-view">

    <!-- ================= OVERVIEW ================= -->
    <div class="overview-row">
      <!-- Left Column -->
      <div class="overview-col left">

        <div class="chart-block" data-category="overview">
          <h4>First Payment Timeliness</h4>
          <p class="chart-subtitle">Percent of payments made within 14 and 21 days</p>
          <div id="overview_timeliness" class="chart-container"></div>
        </div>

        <div class="chart-block" data-category="overview">
          <h4>Nonmonetary Determinations</h4>
          <p class="chart-subtitle">Percent of determinations meeting ALP (80%)</p>
          <div id="overview_nonmonetary" class="chart-container"></div>
        </div>

        <div class="chart-block" data-category="overview">
          <h4>Fraud Rate</h4>
          <p class="chart-subtitle">Percent of overpayments classified as improper</p>
          <div id="fraud_chart_container" class="chart-container"></div>
        </div>

      </div>

      <!-- Right Column -->
      <div class="overview-col right">

        <div class="chart-block" data-category="overview">
          <h4>Improper Payment Rate</h4>
          <p class="chart-subtitle">Percent of overpayments classified as improper</p>
          <div id="improper_chart_container" class="chart-container"></div>
        </div>

        <div class="chart-block" data-category="overview">
          <h4>Quality Saparation</h4>
          <p class="chart-subtitle">Test Test</p>
          <div id="overview_quality_sep" class="chart-container"></div>
        </div>

        <div class="chart-block" data-category="overview">
          <h4>Quality Non-Separation</h4>
          <p class="chart-subtitle">Test Test</p>
          <div id="overview_quality_nonsep" class="chart-container"></div>
        </div>

      </div>

    </div>

        <div class="overview-validation chart-block mt-4" data-category="overview">
          <h4>Data Validation Table</h4>
          <div id="overview_validation_table" class="comparison-table"></div>
        </div>

    <!-- ================= PROGRAM ================= -->
    <div class="chart-block" data-category="program">
      <h3>Root Causes of Overpayments</h3>
      <div id="pie_chart_container" class="chart-container"></div>
    </div>

    <div class="chart-block" data-category="program">
      <h3>Top 5 Causes of Overpayment</h3>
      <div id="bump_chart_container" class="chart-container"></div>
    </div>

    <div class="chart-block" data-category="program">
      <h3>Improper Payment & Fraud Rates</h3>
      <div id="improperfraud_chart_container" class="chart-container"></div>
    </div>

    <!-- ================= BENEFIT ================= -->
    <div class="chart-block" data-category="benefit">
      <h3>First Payment Timeliness (FPT)</h3>
      <div id="timeliness_chart_container" class="chart-container"></div>
    </div>

    <div class="chart-block" data-category="benefit">
      <h3>Nonmonetary Determinations</h3>
      <div id="nonmonetary_chart_container" class="chart-container"></div>
    </div>

  </div>

  <!-- Table view -->
  <div id="table-view" style="display:none">
    <div id="comparison_table_container"></div>
  </div>
</div>
')




final_html <- template |>
  gsub("<!--INLINE_CSS-->", css_code, x = _, fixed = TRUE) |>
  gsub("<!--INLINE_JS-->", js_code, x = _, fixed = TRUE) |>
  gsub("<!--TIMESERIES_JS-->", alldata_js, x = _, fixed = TRUE) |>
  gsub("<!--STATE_JS-->", states_js, x = _, fixed = TRUE) |>
  gsub("<!--DATE-->", as.character(today), x = _, fixed = TRUE) |>
  gsub("<!--METRIC_SECTIONS-->", section_html, x = _, fixed = TRUE)



outfile <- file.path(base_path, glue("integrity_report_{today}.html"))
writeLines(enc2utf8(final_html), outfile, useBytes = TRUE)
browseURL(outfile)
cat("Dashboard built:", outfile, "\n")
