/** OW School 디자인 토큰 — Tailwind 클래스 별칭 */

export const ds = {
  bg: 'bg-background',
  card: 'bg-card border border-border rounded-xl shadow-card transition-all duration-200',
  cardHover: 'hover:bg-card-hover hover:border-border/80 hover:shadow-card-hover',
  cardInteractive: 'bg-card border border-border rounded-xl shadow-card transition-all duration-200 hover:bg-card-hover hover:border-primary/30 hover:shadow-card-hover',
  cardPad: 'p-4 sm:p-6',
  pageGap: 'space-y-6 sm:space-y-8',
  text: 'text-foreground',
  textMuted: 'text-muted-foreground',
  textSub: 'text-subtle',
  title: 'text-xl sm:text-2xl font-bold tracking-tight text-foreground',
  subtitle: 'text-sm text-muted-foreground',
  sectionTitle: 'text-lg sm:text-xl font-semibold text-foreground',
  caption: 'text-xs text-subtle',
  input: 'h-12 rounded-xl border border-border bg-surface px-4 text-sm text-foreground placeholder:text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-shadow',
  textarea: 'min-h-[140px] rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
  tableHead: 'border-b border-border text-subtle text-xs font-medium uppercase tracking-wider text-left',
  tableRow: 'border-b border-border/60 hover:bg-card-hover/50 transition-colors',
  tableCell: 'px-4 py-3 text-sm',
  adminShell: 'min-h-screen bg-background text-foreground',
} as const;
