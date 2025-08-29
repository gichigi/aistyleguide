interface StyleGuideHeaderProps {
  brandName: string
  guideType: 'core' | 'complete'
  date?: string
}

export function StyleGuideHeader({ brandName, guideType, date }: StyleGuideHeaderProps) {
  const formattedDate = date || new Date().toLocaleDateString(undefined, { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  return (
    <div className="p-8 border-b bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <div className="text-base text-gray-500 mb-2 tracking-wide font-semibold">
          {guideType === 'complete' ? 'The Complete Style Guide' : 'Core Style Guide'}
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-gray-900">
          {brandName}
          <br />
          Brand Voice & Style Guide
        </h1>
        <p className="text-gray-500 text-base">Created on {formattedDate}</p>
      </div>
    </div>
  )
} 