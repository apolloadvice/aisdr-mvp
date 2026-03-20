const SIGNAL_COLORS: Record<string, { bg: string; text: string }> = {
  job_posting: { bg: 'var(--signal-job-bg)', text: 'var(--signal-job-text)' },
  funding: { bg: 'var(--signal-funding-bg)', text: 'var(--signal-funding-text)' },
  news: { bg: 'var(--signal-news-bg)', text: 'var(--signal-news-text)' },
  product_launch: { bg: 'var(--signal-product-bg)', text: 'var(--signal-product-text)' },
  other: {
    bg: 'var(--signal-other-bg, hsl(0 0% 90%))',
    text: 'var(--signal-other-text, hsl(0 0% 40%))'
  }
};

const LABELS: Record<string, string> = {
  job_posting: 'Job Posting',
  funding: 'Funding',
  news: 'News',
  product_launch: 'Product Launch',
  other: 'Signal'
};

export function SignalBadge({ type }: { type: string }) {
  const colors = SIGNAL_COLORS[type] || SIGNAL_COLORS.other;
  return (
    <span
      className="font-medium"
      style={{
        borderRadius: 'var(--tag-radius, 9999px)',
        paddingInline: 'var(--tag-padding-x, 0.5rem)',
        paddingBlock: 'var(--tag-padding-y, 0.125rem)',
        fontSize: 'var(--tag-font-size, 0.75rem)',
        backgroundColor: colors.bg,
        color: colors.text
      }}
    >
      {LABELS[type] || type}
    </span>
  );
}
