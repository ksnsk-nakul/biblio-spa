export default function ProgressBar({ percentage }: { percentage: number | null }) {
  return (
    <div className="reader-progress">
      <div className="reader-progress-track">
        <div className="reader-progress-fill" style={{ width: `${Math.round((percentage ?? 0) * 100)}%` }} />
      </div>
      <span className="reader-progress-text">{percentage === null ? '--' : `${Math.round(percentage * 100)}%`}</span>
    </div>
  )
}
