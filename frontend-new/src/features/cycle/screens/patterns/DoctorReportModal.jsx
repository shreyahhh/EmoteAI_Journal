import React, { useMemo, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { daysBetween } from '../../models/cycleCalculations';
import { Button } from '../../../../components/ui/button';
import { Switch } from '../../../../components/ui/switch';
import { buildMostLogged } from '../../models/cyclePatternStats';

const RANGES = [3, 6, 12];
const FLOW_RANK = { none: 0, spotting: 1, light: 2, medium: 3, heavy: 4 };
const FLOW_LABEL = { none: 'None', spotting: 'Spotting', light: 'Light', medium: 'Medium', heavy: 'Heavy' };

function heaviestFlow(start, end, dailyLogs) {
  let best = 'none';
  dailyLogs.forEach((log) => {
    if (log.logDate < start || log.logDate > end) return;
    if ((FLOW_RANK[log.flow] || 0) > (FLOW_RANK[best] || 0)) best = log.flow;
  });
  return best;
}

function buildRows(periods, dailyLogs, range) {
  const sorted = [...periods].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const recent = sorted.slice(-range);
  return recent.map((p, i) => {
    const next = sorted[sorted.indexOf(p) + 1];
    const cycleLength = next ? daysBetween(next.startDate, p.startDate) : null;
    const periodLength = p.endDate ? daysBetween(p.endDate, p.startDate) + 1 : null;
    return {
      startDate: p.startDate,
      cycleLength,
      periodLength,
      heaviestFlow: heaviestFlow(p.startDate, p.endDate || p.startDate, dailyLogs),
    };
  });
}

const DoctorReportModal = ({ open, onOpenChange, data }) => {
  const [range, setRange] = useState(6);
  const [includeSymptoms, setIncludeSymptoms] = useState(true);
  const [includeMood, setIncludeMood] = useState(true);
  const [exporting, setExporting] = useState(false);

  const { periods, dailyLogs } = data;
  const rows = useMemo(() => buildRows(periods, dailyLogs, range), [periods, dailyLogs, range]);
  const mostLogged = useMemo(() => buildMostLogged(periods, dailyLogs, range), [periods, dailyLogs, range]);

  const cycleLengths = rows.map((r) => r.cycleLength).filter(Boolean);
  const periodLengths = rows.map((r) => r.periodLength).filter(Boolean);
  const avgCycle = cycleLengths.length ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length) : null;
  const avgPeriod = periodLengths.length ? Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length) : null;

  const summary = avgCycle && avgPeriod
    ? `Over the last ${range} cycles, periods averaged ${avgPeriod} days and cycles averaged ${avgCycle} days.`
    : 'Not enough logged cycles yet for a full summary.';

  const handleExportPdf = async () => {
    setExporting(true);
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const marginX = 48;
    let y = 56;
    doc.setFontSize(18);
    doc.text('Cycle report', marginX, y);
    y += 20;
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text('Dates and structured data only — journal text is never included.', marginX, y);
    doc.setTextColor(0);
    y += 24;
    doc.setFontSize(11);
    doc.splitTextToSize(summary, 480).forEach((line) => {
      doc.text(line, marginX, y);
      y += 14;
    });
    y += 10;

    doc.setFontSize(13);
    doc.text('Cycles', marginX, y);
    y += 18;
    doc.setFontSize(10);
    rows.forEach((r) => {
      doc.text(
        `${r.startDate}  ·  cycle ${r.cycleLength ?? '—'}d  ·  period ${r.periodLength ?? '—'}d  ·  heaviest flow: ${FLOW_LABEL[r.heaviestFlow]}`,
        marginX,
        y,
      );
      y += 14;
    });

    if (includeSymptoms || includeMood) {
      y += 10;
      doc.setFontSize(13);
      doc.text('Most logged', marginX, y);
      y += 18;
      doc.setFontSize(10);
      if (includeSymptoms) {
        doc.text(`On period days: ${mostLogged.onPeriodDays.join(', ') || '—'}`, marginX, y);
        y += 14;
      }
      if (includeMood) {
        doc.text(`Week before: ${mostLogged.weekBefore.join(', ') || '—'}`, marginX, y);
        y += 14;
      }
    }

    doc.save('cycle_report.pdf');
    setExporting(false);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Cycle report', text: summary });
      } catch {
        /* user cancelled share sheet */
      }
    } else {
      window.alert('Sharing is not supported in this browser — use Export PDF instead.');
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <DialogPrimitive.Content
          // Centering transform lives here, kept apart from the motion.div
          // below — framer-motion writes its own inline `transform` for the
          // animation, which would otherwise clobber a -translate-x/y-1/2
          // class on the same element instead of combining with it.
          className="fixed left-1/2 top-1/2 z-50 w-[min(640px,94vw)] -translate-x-1/2 -translate-y-1/2"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="cycle-root max-h-[90vh] overflow-y-auto rounded-none border border-cycle-line bg-cycle-bg p-6 text-cycle-text shadow-xl focus:outline-none sm:p-7"
          >
            <div className="flex items-start justify-between">
              <h2 className="font-display text-[1.3rem] font-semibold uppercase tracking-wider text-cycle-text">Doctor report</h2>
              <DialogPrimitive.Close asChild>
                <button type="button" aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-none border border-cycle-line text-cycle-text-2 hover:bg-cycle-surface-2">
                  <X className="h-4 w-4" />
                </button>
              </DialogPrimitive.Close>
            </div>

            <div className="mt-3 flex rounded-none border border-cycle-line bg-cycle-surface-2 p-1">
              {RANGES.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRange(n)}
                  className={`min-h-9 flex-1 rounded-none text-[0.85rem] font-semibold uppercase tracking-wider ${n === range ? 'bg-cycle-accent text-cycle-accent-ink' : 'text-cycle-text-2'}`}
                >
                  {n} cycles
                </button>
              ))}
            </div>

            {/* Paper-style preview */}
            <div className="mt-4 rounded-xl bg-[#F6F1E9] p-5 text-[#2A1A0C] shadow-inner">
              <p className="font-display text-[1.1rem]">Cycle summary</p>
              <p className="mt-1 text-[0.85rem] leading-relaxed">{summary}</p>
              <table className="mt-3 w-full text-left text-[0.8rem]">
                <thead>
                  <tr className="border-b border-[#2A1A0C]/15 text-[#7D6C59]">
                    <th className="py-1 font-medium">Started</th>
                    <th className="py-1 font-medium">Cycle</th>
                    <th className="py-1 font-medium">Period</th>
                    <th className="py-1 font-medium">Heaviest flow</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.startDate} className="border-b border-[#2A1A0C]/10">
                      <td className="py-1">{r.startDate}</td>
                      <td className="py-1">{r.cycleLength ?? '—'}d</td>
                      <td className="py-1">{r.periodLength ?? '—'}d</td>
                      <td className="py-1">{FLOW_LABEL[r.heaviestFlow]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {includeSymptoms || includeMood ? (
                <div className="mt-3 text-[0.8rem]">
                  {includeSymptoms ? <p>Most logged on period days: {mostLogged.onPeriodDays.join(', ') || '—'}</p> : null}
                  {includeMood ? <p>Most logged the week before: {mostLogged.weekBefore.join(', ') || '—'}</p> : null}
                </div>
              ) : null}
            </div>

            <div className="mt-4 space-y-2.5">
              <label className="flex items-center justify-between rounded-none border border-cycle-line px-3.5 py-2.5">
                <span className="text-[0.85rem] text-cycle-text-2">Symptoms and pain</span>
                <Switch checked={includeSymptoms} onCheckedChange={setIncludeSymptoms} />
              </label>
              <label className="flex items-center justify-between rounded-none border border-cycle-line px-3.5 py-2.5">
                <span className="text-[0.85rem] text-cycle-text-2">Mood</span>
                <Switch checked={includeMood} onCheckedChange={setIncludeMood} />
              </label>
              <label className="flex items-center justify-between rounded-none border border-cycle-line bg-cycle-surface-2 px-3.5 py-2.5 opacity-60">
                <span className="text-[0.85rem] text-cycle-text-2">Journal text</span>
                <span className="flex items-center gap-2">
                  <span className="text-[0.72rem] text-cycle-faint">Never included in reports</span>
                  <Switch checked={false} disabled />
                </span>
              </label>
            </div>

            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
              <Button type="button" onClick={handleExportPdf} disabled={exporting} className="min-h-[54px] flex-1 rounded-none bg-cycle-accent text-cycle-accent-ink hover:brightness-110">
                {exporting ? 'Preparing…' : 'Export PDF'}
              </Button>
              <Button type="button" variant="outline" onClick={handleShare} className="min-h-[54px] flex-1 rounded-none border-cycle-line text-cycle-text">
                Share another way
              </Button>
            </div>
          </motion.div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export default DoctorReportModal;
