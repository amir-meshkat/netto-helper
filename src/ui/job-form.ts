import { t } from "../i18n";
import { escapeHtml } from "./dom";
import { markInvalid, textField } from "./fields";
import { euros, percent } from "./format";
import { JOB_SLIDERS, isInvalidInput, toEngineJob, type JobInput, type JobTextKey } from "./job-input";

// The inputs of one job: salary, plus holiday pay, bonus and pension behind a toggle.
// Every element carries data-job (a page-unique id) and data-k (the JobInput key),
// so a page only has to map a job id to its JobInput.

const f = t.jobForm;

interface FieldOptions {
  nl?: string;
  big?: boolean;
}

function field(jobId: string, job: JobInput, key: JobTextKey, label: string, unit: "€" | "%", options: FieldOptions = {}) {
  return textField({
    id: `${jobId}-${key}`,
    value: job[key],
    label,
    nl: options.nl,
    unit,
    big: options.big,
    invalid: isInvalidInput(key, job[key]),
    data: { job: jobId, k: key },
    slider: JOB_SLIDERS[key],
  });
}

/** Short summary under the toggle, so the defaults (such as 8% holiday pay) are never hidden. */
export function detailsNow(input: JobInput): string {
  const job = toEngineJob(input);
  const bonus = job.yearEndBonusRate > 0 ? percent(job.yearEndBonusRate) : null;
  let pension: string | null = null;
  if (job.pension.kind === "monthly" && job.pension.amount > 0) pension = f.pensionPerMonth(euros(job.pension.amount));
  if (job.pension.kind === "scheme" && job.pension.rate > 0) {
    pension = f.pensionScheme(percent(job.pension.rate), euros(job.pension.franchise));
  }
  return f.detailsNow(percent(job.holidayPayRate), bonus, pension);
}

/** Salary field plus the collapsible details for one job. */
export function jobFields(jobId: string, job: JobInput, open: boolean): string {
  const radio = (value: JobInput["pensionMode"], label: string) => `
    <label><input type="radio" id="${jobId}-pm-${value}" name="${jobId}-pm" value="${value}"
      data-job="${jobId}"${job.pensionMode === value ? " checked" : ""}><span>${escapeHtml(label)}</span></label>`;
  const pensionFields =
    job.pensionMode === "monthly"
      ? `${field(jobId, job, "pensionMonthly", f.pensionMonthly, "€")}<p class="hint">${escapeHtml(f.pensionMonthlyHint)}</p>`
      : `<div class="grid-2">${field(jobId, job, "pensionPct", f.pensionRate, "%")}${field(jobId, job, "franchise", f.franchise, "€")}</div>
         <p class="hint">${escapeHtml(f.pensionSchemeHint)}</p>`;
  return `
    ${field(jobId, job, "monthly", f.monthlyGross, "€", { nl: f.monthlyGrossNl, big: true })}
    <details class="more" data-key="more-${jobId}"${open ? " open" : ""}>
      <summary>${escapeHtml(f.moreDetails)}<span class="details-now" id="${jobId}-now">${escapeHtml(detailsNow(job))}</span></summary>
      <div class="grid-2">
        ${field(jobId, job, "holidayPct", f.holiday, "%", { nl: f.holidayNl })}
        ${field(jobId, job, "yearEndPct", f.yearEnd, "%", { nl: f.yearEndNl })}
      </div>
      <fieldset class="pension">
        <legend>${escapeHtml(f.pension)} <span class="nl">(${escapeHtml(f.pensionNl)})</span></legend>
        <div class="segmented">${radio("monthly", f.pensionModeMonthly)}${radio("scheme", f.pensionModeScheme)}</div>
        ${pensionFields}
      </fieldset>
    </details>`;
}

type FindJob = (jobId: string) => JobInput | undefined;

/** Typing in a job field: updates the JobInput and the field's error state. False if not a job field. */
export function handleJobInput(event: Event, findJob: FindJob): boolean {
  const el = event.target;
  if (!(el instanceof HTMLInputElement) || el.type === "radio" || !el.dataset.job) return false;
  const job = findJob(el.dataset.job);
  if (!job) return false;
  const key = el.dataset.k as JobTextKey;
  job[key] = el.value;
  markInvalid(el, isInvalidInput(key, el.value));
  const now = document.getElementById(`${el.dataset.job}-now`);
  if (now) now.textContent = detailsNow(job);
  return true;
}

/** Switching the pension mode. Returns the radio's id (to focus after redrawing), or null if not a mode switch. */
export function handlePensionModeChange(event: Event, findJob: FindJob): string | null {
  const el = event.target;
  if (!(el instanceof HTMLInputElement) || el.type !== "radio" || !el.checked || !el.dataset.job) return null;
  const job = findJob(el.dataset.job);
  if (!job) return null;
  job.pensionMode = el.value === "scheme" ? "scheme" : "monthly";
  return el.id;
}
