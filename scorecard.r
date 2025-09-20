if (!requireNamespace("glue", quietly = TRUE)) install.packages("glue")
if (!requireNamespace("jsonlite", quietly = TRUE)) install.packages("jsonlite")
if (!requireNamespace("dplyr", quietly = TRUE)) install.packages("dplyr")
if (!requireNamespace("lubridate", quietly = TRUE)) install.packages("lubridate")

library(glue)
library(jsonlite)
library(dplyr)
library(lubridate) 

# ---------------- Hardcoded Values ----------------
year_range <- "Jul-Jun"
base_path <- "C:/Users/Daniel/Desktop/Main Projcets/git/pager-project"

f <- file.path(base_path, "scorecard_data.csv")
df_raw <- read.csv(f, stringsAsFactors = FALSE, header = TRUE, check.names = FALSE)

# Basic checks
stopifnot(all(c("State", "Date") %in% names(df_raw)))
df_raw$Date <- as.Date(df_raw$Date, format = "%m/%d/%Y")

# ---- metric sets ----
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

# ---------------- helpers ----------------
numify <- function(x) as.numeric(gsub("%", "", as.character(x)))

annual_last_month <- function(df, year, range, metrics) {
  target_date <- if (range == "Jul-Jun") {
    as.Date(paste0(year, "-06-01"))
  } else {
    as.Date(paste0(year, "-12-01"))
  }

  df_sub <- df %>%
    filter(State == "US", format(Date, "%Y-%m") == format(target_date, "%Y-%m"))

  if (nrow(df_sub) == 0) {
    return(NULL)
  }

  vals <- df_sub[1, metrics, drop = FALSE]
  vals[] <- lapply(vals, numify)
  as.numeric(vals[1, ])
}

annual_multi_year <- function(df, base_year, range, metrics, n_years = 6) {
  years <- (base_year - (n_years - 1)):base_year

  results <- lapply(years, function(y) {
    v <- annual_last_month(df, y, range, metrics)
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

# ---------------- Build ALLDATA ----------------
all_years <- c(2024, 2025)
all_data <- list()

for (y in all_years) {
  # --- PIE/TABLE ---
  vals <- annual_last_month(df_raw, y, year_range, metrics_for_pie)
  if (is.null(vals)) next
  total <- sum(vals, na.rm = TRUE)
  proportions <- round(100 * vals / total, 1)

  prev_vals <- annual_last_month(df_raw, y - 1, year_range, metrics_for_pie)
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


  # --- BUMP/TOP-5 ---
  counts_df <- annual_multi_year(df_raw, y, year_range, metrics_for_pie, n_years = 6)
  if (is.null(counts_df)) next
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

  # --- TIMELINESS ---
  t_vals <- annual_last_month(df_raw, y, year_range, metrics_timeliness)
  if (!is.null(t_vals)) {
    multi_t <- annual_multi_year(df_raw, y, year_range, metrics_timeliness, n_years = 6)
    t_series <- lapply(metrics_timeliness, function(m) {
      list(name = m, values = as.numeric(multi_t[[m]]))
    })
    timeliness_data <- list(years = as.numeric(multi_t$Year), series = t_series)
  } else {
    timeliness_data <- NULL
  }

  # --- NONMONETARY Determination ---
  nm_vals <- annual_last_month(df_raw, y, year_range, "Nonmonetary Determination")
  if (!is.null(nm_vals)) {
    multi_nm <- annual_multi_year(df_raw, y, year_range, "Nonmonetary Determination", n_years = 6)
    nm_series <- list(list(name = "Nonmonetary Determination", values = as.numeric(multi_nm[["Nonmonetary Determination"]])))
    nm_data <- list(years = as.numeric(multi_nm$Year), series = nm_series)
  } else {
    nm_data <- NULL
  }

  # --- IMPROPER/FRAUD ---
  if (all(metrics_improperfraud %in% names(df_raw))) {
    if_vals <- annual_last_month(df_raw, y, year_range, metrics_improperfraud)
    if (!is.null(if_vals)) {
      multi_if <- annual_multi_year(df_raw, y, year_range, metrics_improperfraud, n_years = 6)
      if_series <- lapply(metrics_improperfraud, function(m) {
        list(name = m, values = as.numeric(multi_if[[m]]))
      })
      improperfraud_data <- list(years = as.numeric(multi_if$Year), series = if_series)
    } else {
      improperfraud_data <- NULL
    }
  } else {
    improperfraud_data <- NULL
  }

  # assemble
  all_data[[as.character(y)]] <- list(
    pie = as.list(setNames(proportions, metrics_for_pie)),
    table = table_df,
    bump = bump_data,
    timeliness = timeliness_data,
    improperfraud = improperfraud_data,
    nonmonetary = nm_data
  )
}

# ---------------- Export JS ----------------
alldata_js <- paste0(
  "<script>\nvar ALLDATA = ",
  jsonlite::toJSON(all_data, dataframe = "rows", auto_unbox = TRUE, pretty = TRUE),
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
<div class="section bg-white shadow-sm rounded metric-section" id="section_dashboard">
<!-- Plots view -->
<div id="plots-view">
<div id="pie_chart_container" class="chart-container"></div>
<div id="bump_chart_container" class="chart-container"></div>
<div id="improperfraud_chart_container" class="chart-container"></div>
<div id="timeliness_chart_container" class="chart-container"></div>
<div id="nonmonetary_chart_container" class="chart-container"></div>
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
  gsub("<!--DATE-->", as.character(today), x = _, fixed = TRUE) |>
  gsub("<!--YEAR_RANGE_TEXT-->", year_range, x = _, fixed = TRUE) |>   # <—
  gsub("<!--METRIC_SECTIONS-->", section_html, x = _, fixed = TRUE)


outfile <- file.path(base_path, glue("pie_report_{today}.html"))
writeLines(enc2utf8(final_html), outfile, useBytes = TRUE)
browseURL(outfile)
cat("Dashboard built:", outfile, "\n")
