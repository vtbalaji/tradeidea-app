export default function SvgDemo() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Trading Position Visualization Options
        </h1>

        {/* Option 1 */}
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Option 1: Runner on Track with Door and Target
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Clean, modern design with progress bar showing journey from entry to target
          </p>

          <svg width="100%" height="80" viewBox="0 0 300 80" className="border border-gray-200 rounded">
            {/* Background track */}
            <line x1="20" y1="35" x2="280" y2="35" stroke="#e5e7eb" strokeWidth="4" strokeLinecap="round"/>

            {/* Progress fill (from entry to current LTP) */}
            <line x1="20" y1="35" x2="150" y2="35" stroke="#fb923c" strokeWidth="4" strokeLinecap="round"/>

            {/* Entry Door (left) */}
            <g transform="translate(10, 20)">
              <rect x="0" y="0" width="15" height="25" fill="#94a3b8" rx="2"/>
              <rect x="3" y="5" width="9" height="15" fill="#475569" rx="1"/>
              <circle cx="11" cy="12" r="1" fill="#fb923c"/>
            </g>

            {/* StopLoss marker */}
            <g transform="translate(60, 25)">
              <line x1="0" y1="0" x2="0" y2="20" stroke="#ef4444" strokeWidth="2"/>
              <circle cx="0" cy="10" r="4" fill="#ef4444"/>
            </g>

            {/* Runner (current LTP position) */}
            <g transform="translate(145, 15)">
              <circle cx="5" cy="5" r="4" fill="#fb923c"/>
              <path d="M 5 9 L 5 18" stroke="#fb923c" strokeWidth="2" strokeLinecap="round"/>
              <path d="M 5 18 L 2 25" stroke="#fb923c" strokeWidth="2" strokeLinecap="round"/>
              <path d="M 5 18 L 8 23" stroke="#fb923c" strokeWidth="2" strokeLinecap="round"/>
              <path d="M 5 11 L 1 14" stroke="#fb923c" strokeWidth="2" strokeLinecap="round"/>
              <path d="M 5 11 L 9 8" stroke="#fb923c" strokeWidth="2" strokeLinecap="round"/>
            </g>

            {/* Target flag (right) */}
            <g transform="translate(270, 20)">
              <line x1="5" y1="0" x2="5" y2="25" stroke="#22c55e" strokeWidth="2"/>
              <path d="M 5 0 L 15 5 L 5 10 Z" fill="#22c55e"/>
            </g>

            {/* Labels */}
            <text x="20" y="65" fontSize="10" fill="#6b7280" textAnchor="middle">Entry</text>
            <text x="60" y="65" fontSize="10" fill="#ef4444" textAnchor="middle">SL</text>
            <text x="150" y="65" fontSize="10" fill="#fb923c" textAnchor="middle">LTP</text>
            <text x="280" y="65" fontSize="10" fill="#22c55e" textAnchor="middle">Target</text>
          </svg>
        </div>

        {/* Option 2 */}
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Option 2: Dynamic Runner with Colored Zones
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Better runner animation with danger zone (red tint) and profit zone
          </p>

          <svg width="100%" height="60" viewBox="0 0 300 60" className="border border-gray-200 rounded">
            {/* Track background */}
            <rect x="15" y="25" width="270" height="6" fill="#f3f4f6" rx="3"/>

            {/* Danger zone (Entry to StopLoss) */}
            <rect x="15" y="25" width="45" height="6" fill="#fee2e2" rx="3"/>

            {/* Progress (Entry to LTP) */}
            <rect x="15" y="25" width="135" height="6" fill="#fb923c" rx="3"/>

            {/* Entry Door */}
            <g transform="translate(10, 15)">
              <rect x="0" y="0" width="10" height="18" fill="#64748b" rx="1"/>
              <path d="M 2 3 L 2 15 L 8 15 L 8 3" fill="#94a3b8" stroke="#475569" strokeWidth="0.5"/>
              <circle cx="7" cy="9" r="0.8" fill="#fb923c"/>
            </g>

            {/* StopLoss X marker */}
            <g transform="translate(55, 20)">
              <circle cx="5" cy="8" r="6" fill="#fecaca" stroke="#ef4444" strokeWidth="1.5"/>
              <path d="M 2 5 L 8 11 M 8 5 L 2 11" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
            </g>

            {/* Dynamic Runner */}
            <g transform="translate(145, 8)">
              {/* Shadow */}
              <ellipse cx="5" cy="40" rx="6" ry="2" fill="#00000015"/>

              {/* Head */}
              <circle cx="5" cy="8" r="4.5" fill="#fb923c"/>

              {/* Body lean forward */}
              <path d="M 5 12.5 L 3 24" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round"/>

              {/* Front leg (extended) */}
              <path d="M 3 24 L -2 34" stroke="#f97316" strokeWidth="2" strokeLinecap="round"/>

              {/* Back leg (pushing) */}
              <path d="M 4 24 L 10 30" stroke="#f97316" strokeWidth="2" strokeLinecap="round"/>

              {/* Front arm (forward) */}
              <path d="M 4 15 L -1 20" stroke="#f97316" strokeWidth="2" strokeLinecap="round"/>

              {/* Back arm (backward) */}
              <path d="M 4 15 L 10 18" stroke="#f97316" strokeWidth="2" strokeLinecap="round"/>
            </g>

            {/* Target Flag */}
            <g transform="translate(280, 15)">
              <line x1="5" y1="0" x2="5" y2="20" stroke="#16a34a" strokeWidth="2" strokeLinecap="round"/>
              <path d="M 5 2 L 18 7 L 5 12 Z" fill="#22c55e"/>
              <circle cx="5" cy="20" r="2" fill="#16a34a"/>
            </g>
          </svg>
        </div>

        {/* Option 3 */}
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Option 3: Minimal with Percentage Indicators
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Simple design with colored segments and clear labels
          </p>

          <svg width="100%" height="70" viewBox="0 0 300 70" className="border border-gray-200 rounded">
            {/* Main track line */}
            <line x1="30" y1="35" x2="270" y2="35" stroke="#e5e7eb" strokeWidth="3" strokeLinecap="round"/>

            {/* Colored segments */}
            <line x1="30" y1="35" x2="80" y2="35" stroke="#fca5a5" strokeWidth="3"/>
            <line x1="80" y1="35" x2="160" y2="35" stroke="#fb923c" strokeWidth="3"/>
            <line x1="160" y1="35" x2="270" y2="35" stroke="#d1d5db" strokeWidth="3"/>

            {/* Entry Door */}
            <g transform="translate(22, 22)">
              <rect width="12" height="20" fill="#475569" rx="1.5"/>
              <rect x="2" y="3" width="8" height="14" fill="#64748b" rx="1"/>
              <line x1="9" y1="10" x2="9" y2="11" stroke="#fb923c" strokeWidth="1.5" strokeLinecap="round"/>
            </g>

            {/* StopLoss */}
            <g transform="translate(75, 30)">
              <circle cx="5" cy="5" r="5" fill="#ef4444"/>
              <text x="5" y="20" fontSize="9" fill="#6b7280" textAnchor="middle">SL</text>
            </g>

            {/* Animated Runner at LTP */}
            <g transform="translate(155, 15)">
              <circle cx="5" cy="7" r="5" fill="#fb923c"/>
              <line x1="5" y1="12" x2="4" y2="24" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M 4 24 L 0 34" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M 4 24 L 9 30" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M 4 15 L 0 20" stroke="#f97316" strokeWidth="2" strokeLinecap="round"/>
              <path d="M 5 15 L 10 18" stroke="#f97316" strokeWidth="2" strokeLinecap="round"/>
              <text x="5" y="52" fontSize="9" fill="#f97316" textAnchor="middle" fontWeight="600">LTP</text>
            </g>

            {/* Target */}
            <g transform="translate(265, 20)">
              <line x1="5" y1="0" x2="5" y2="24" stroke="#22c55e" strokeWidth="2.5"/>
              <polygon points="5,0 16,6 5,12" fill="#22c55e"/>
              <circle cx="5" cy="24" r="2.5" fill="#22c55e"/>
              <text x="5" y="40" fontSize="9" fill="#6b7280" textAnchor="middle">Target</text>
            </g>
          </svg>
        </div>

        {/* Example on actual card background */}
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Option 2 - On Card Background (Preview)
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            How it would look below #medium risk #long term tags
          </p>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-lg border border-gray-200">
            <div className="flex gap-2 mb-4">
              <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">#medium risk</span>
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">#long term</span>
            </div>

            <svg width="100%" height="60" viewBox="0 0 300 60">
              <rect x="15" y="25" width="270" height="6" fill="#f3f4f6" rx="3"/>
              <rect x="15" y="25" width="45" height="6" fill="#fee2e2" rx="3"/>
              <rect x="15" y="25" width="135" height="6" fill="#fb923c" rx="3"/>

              <g transform="translate(10, 15)">
                <rect x="0" y="0" width="10" height="18" fill="#64748b" rx="1"/>
                <path d="M 2 3 L 2 15 L 8 15 L 8 3" fill="#94a3b8" stroke="#475569" strokeWidth="0.5"/>
                <circle cx="7" cy="9" r="0.8" fill="#fb923c"/>
              </g>

              <g transform="translate(55, 20)">
                <circle cx="5" cy="8" r="6" fill="#fecaca" stroke="#ef4444" strokeWidth="1.5"/>
                <path d="M 2 5 L 8 11 M 8 5 L 2 11" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
              </g>

              <g transform="translate(145, 8)">
                <ellipse cx="5" cy="40" rx="6" ry="2" fill="#00000015"/>
                <circle cx="5" cy="8" r="4.5" fill="#fb923c"/>
                <path d="M 5 12.5 L 3 24" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M 3 24 L -2 34" stroke="#f97316" strokeWidth="2" strokeLinecap="round"/>
                <path d="M 4 24 L 10 30" stroke="#f97316" strokeWidth="2" strokeLinecap="round"/>
                <path d="M 4 15 L -1 20" stroke="#f97316" strokeWidth="2" strokeLinecap="round"/>
                <path d="M 4 15 L 10 18" stroke="#f97316" strokeWidth="2" strokeLinecap="round"/>
              </g>

              <g transform="translate(280, 15)">
                <line x1="5" y1="0" x2="5" y2="20" stroke="#16a34a" strokeWidth="2" strokeLinecap="round"/>
                <path d="M 5 2 L 18 7 L 5 12 Z" fill="#22c55e"/>
                <circle cx="5" cy="20" r="2" fill="#16a34a"/>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
