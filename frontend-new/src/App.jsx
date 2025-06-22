import { useState, useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import './App.css'

function App() {
  const [text, setText] = useState('')
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const handleAnalyze = async () => {
    setIsLoading(true)
    setResults([])
    try {
      const response = await fetch('http://127.0.0.1:8000/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      })
      if (!response.ok) {
        throw new Error('Something went wrong with the analysis.')
      }
      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error("Failed to analyze text:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const emotionSummaryData = useMemo(() => {
    if (results.length === 0) return []
    
    const emotionCounts = results.reduce((acc, result) => {
      const primaryEmotion = result.emotion[0].label
      acc[primaryEmotion] = (acc[primaryEmotion] || 0) + 1
      return acc
    }, {})

    return Object.entries(emotionCounts).map(([name, value]) => ({ name, value }))
  }, [results])

  const generateInterpretiveNote = (summary) => {
    if (summary.length === 0) return null

    const sortedEmotions = [...summary].sort((a, b) => b.value - a.value)
    const primaryEmotion = sortedEmotions[0]?.name
    const secondaryEmotion = sortedEmotions[1]?.name

    let note = `It looks like the dominant emotion in your entry is **${primaryEmotion}**. `
    if (secondaryEmotion) {
      note += `There are also strong undercurrents of **${secondaryEmotion}**. `
    }
    note += "Reflecting on why these feelings are present may offer deeper insights. "
    
    if (primaryEmotion === 'anger' || primaryEmotion === 'sadness' || primaryEmotion === 'fear') {
      note += "It's brave to explore these challenging emotions. Remember to be kind to yourself."
    }
    if (primaryEmotion === 'joy') {
      note += "It's wonderful to see moments of joy captured here. What contributed to this feeling?"
    }

    return <p dangerouslySetInnerHTML={{ __html: note.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
  }

  const COLORS = {
    joy: '#4ade80',
    sadness: '#60a5fa',
    anger: '#f87171',
    fear: '#c084fc',
    surprise: '#facc15',
    disgust: '#84cc16',
    neutral: '#9ca3af'
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
      <div className="w-full max-w-3xl">
        <h1 className="text-4xl font-bold text-center mb-8">EmotionAware Journal</h1>
        <textarea
          className="w-full h-64 p-4 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          placeholder="Write your thoughts here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-500 transition"
          onClick={handleAnalyze}
          disabled={isLoading || !text}
        >
          {isLoading ? 'Analyzing...' : 'Analyze My Journal'}
        </button>

        {results.length > 0 && (
          <div className="mt-8">
            <h2 className="text-3xl font-semibold mb-6 text-center">Your Emotional Landscape</h2>
            
            <div className="bg-gray-800 p-6 rounded-lg mb-8">
              <h3 className="text-xl font-semibold mb-2">A Moment of Reflection</h3>
              <div className="text-gray-300">
                {generateInterpretiveNote(emotionSummaryData)}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-center">Emotion Breakdown</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={emotionSummaryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {emotionSummaryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#8884d8'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-center">Sentence Analysis</h3>
                <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                  {results.map((result, index) => (
                    <div key={index} className="p-3 bg-gray-700/50 rounded-lg">
                      <p className="mb-2 italic text-sm text-gray-300">"{result.sentence}"</p>
                      <div className="flex justify-between items-center text-xs">
                        <span className={`font-bold`} style={{ color: COLORS[result.emotion[0].label] }}>
                          {result.emotion[0].label} ({result.emotion[0].score.toFixed(2)})
                        </span>
                        <span className="font-semibold text-gray-400">
                          {result.sentiment.label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
