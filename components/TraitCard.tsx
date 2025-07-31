import { TRAITS, type TraitName } from "@/lib/traits"

interface TraitCardProps {
  traitName: TraitName
}

export default function TraitCard({ traitName }: TraitCardProps) {
  const trait = TRAITS[traitName]

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 shadow-sm mb-6">
      <h3 className="font-bold text-lg mb-1">{traitName}</h3>
      <p className="italic text-gray-600 mb-4">{trait.definition}</p>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <h4 className="font-semibold text-green-700 mb-2">Means</h4>
          <ul className="space-y-1">
            {trait.do.map((item, index) => (
              <li key={index} className="text-sm flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-red-700 mb-2">Doesn't mean</h4>
          <ul className="space-y-1">
            {trait.dont.map((item, index) => (
              <li key={index} className="text-sm flex items-start">
                <span className="text-red-500 mr-2">✗</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t pt-3">
        <div className="font-mono text-xs text-gray-500">
          <div className="mb-1">
            <span className="font-semibold">Before:</span> {trait.example.before}
          </div>
          <div>
            <span className="font-semibold">After:</span> {trait.example.after}
          </div>
        </div>
      </div>
    </div>
  )
} 