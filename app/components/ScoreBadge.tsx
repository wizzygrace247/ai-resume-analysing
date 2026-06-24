type ScoreBadgeProps = {
    score: number
}

export default function ScoreBadge({ score }: ScoreBadgeProps) {
    let bgClass = ''
    let textClass = ''
    let label = ''

    if (score >= 70) {
        bgClass = 'bg-badge-green'
        textClass = 'text-green-600'
        label = 'strong'
    } else if (score >= 50) {
        bgClass = 'bg-badge-yellow'
        textClass = 'text-yellow-600'
        label = 'Good Start'
    } else if (score <= 30) {
        bgClass = 'bg-badge-red'
        textClass = 'text-red-600'
        label = 'Needs work'
    } else {
        // Fallback for scores between 31 and 49
        bgClass = 'bg-badge-yellow'
        textClass = 'text-yellow-600'
        label = 'Good Start'
    }

    return (
        <div className={`inline-flex items-center px-3 py-1 rounded-full ${bgClass}`}>
            <p className={`text-sm font-semibold ${textClass}`}>{label}</p>
        </div>
    )
}

