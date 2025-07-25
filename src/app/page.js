"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Confetti from "react-confetti"
import { ShipWheelIcon as Wheel } from "lucide-react"
import { X } from "lucide-react"

const defaultParticipants = []

function getRandomInt(max) {
  return Math.floor(Math.random() * max)
}

const colors = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E9",
]

export default function LotterySpinner() {
  const [participants, setParticipants] = useState(defaultParticipants)
  const [input, setInput] = useState("")
  const [spinning, setSpinning] = useState(false)
  const [wheelRotation, setWheelRotation] = useState(0)
  const [winnerIdx, setWinnerIdx] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [confettiKey, setConfettiKey] = useState(0)
  const [windowSize, setWindowSize] = useState({ width: 600, height: 600 })
  const [lastDraw, setLastDraw] = useState([])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const updateSize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight })
      updateSize()
      window.addEventListener("resize", updateSize)
      return () => window.removeEventListener("resize", updateSize)
    }
  }, [])

useEffect(() => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("lastDraw")
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        // Only keep valid strings
        const valid = Array.isArray(parsed)
          ? parsed.filter(p => typeof p === "string")
          : []
        setLastDraw(valid)
      } catch {
        setLastDraw([])
      }
    }
  }
}, [])


useEffect(() => {
  if (winnerIdx !== null && !spinning) {
    const valid = participants.filter(p => typeof p === "string")
    localStorage.setItem("lastDraw", JSON.stringify(valid))
    setLastDraw(valid)
  }
}, [winnerIdx, spinning])



 const addParticipant = () => {
  const name = String(input).trim()
  if (name && !participants.includes(name)) {
    setParticipants([...participants, name])
    setInput("")
  }
}


  const removeParticipant = (index) => {
    setParticipants(participants.filter((_, i) => i !== index))
    if (winnerIdx === index) setWinnerIdx(null)
  }

  const startSpin = () => {
    if (participants.length < 2) return
    const segmentAngle = 360 / participants.length
    const winner = getRandomInt(participants.length)
    setWinnerIdx(winner)
    setConfettiKey((k) => k + 1)
    setShowConfetti(false)
    setSpinning(true)
    const baseSpins = 6
    const endAngle = 360 - winner * segmentAngle - segmentAngle / 2 + 360 * baseSpins
    setWheelRotation((prev) => prev + endAngle)

    setTimeout(() => {
      setShowConfetti(true)
      setSpinning(false)
    }, 5000) // sync with animation duration
  }

  // Reset the lottery for a new round
  const resetLottery = () => {
    setParticipants(lastDraw)
    setWinnerIdx(null)
    setWheelRotation(0)
    setShowConfetti(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#032852] via-[#032852] to-[#032852] text-white flex flex-col items-center justify-center px-4">
      {/* Replace title with image */}
      <div className="mb-6 flex justify-center w-full">
        <img src="/ethiolottery.png" alt="Ethiolottery" className="h-20 md:h-28 object-contain w-full max-w-6xl" onError={e => { e.target.onerror = null; e.target.src = '/Ethiolotteryet-05.png'; }} />
      </div>

      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 w-full max-w-xl shadow-2xl">
        {/* Only show input form when there's no winner */}
        {winnerIdx === null && (
          <>
            <div className="flex gap-2 mb-4">
              <input
                className="flex-1 px-4 py-2 rounded-lg bg-white/90 text-gray-800 placeholder-gray-500 focus:outline-none"
                placeholder="Enter participant name"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addParticipant()}
                disabled={spinning}
              />
              <button
                className="bg-yellow-400 text-black font-bold px-4 py-2 rounded-lg hover:bg-yellow-300 disabled:opacity-50"
                onClick={addParticipant}
                disabled={!input.trim() || participants.includes(input.trim()) || spinning}
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {participants.map((p, idx) => (
  <span key={idx} className="...">
    {typeof p === 'string' ? p : ""}
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={() => removeParticipant(idx)}
                    disabled={spinning}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </>
        )}

        {/* Show last draw participants if available, only when no draw is active */}
        {winnerIdx === null && lastDraw.length > 0 && (
          <div className="mb-8">
           {/*  <h3 className="text-white text-lg font-semibold mb-3">Last Draw Participants ({lastDraw.length})</h3> */}
            <div className="flex flex-wrap gap-2">
              {lastDraw.map((participant, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100  text-yellow-900`}
                >
                  {typeof participant === 'string' ? participant : JSON.stringify(participant)}
                  <button
                    onClick={() => {
                      const updated = lastDraw.filter((_, i) => i !== index)
                      setLastDraw(updated)
                      localStorage.setItem("lastDraw", JSON.stringify(updated))
                    }}
                       className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-center my-8 relative">
          <div className="relative w-[24rem] h-[24rem]">
            {/* Arrow Pointer */}
            <div className="absolute top-[-16px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-[24px] border-transparent border-b-yellow-400 z-10">
              {winnerIdx !== null && !spinning && (
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
                  <div className="text-xs font-bold bg-yellow-400 text-black px-2 py-1 rounded">
                    {participants[winnerIdx]}
                  </div>
                </div>
              )}
            </div>

            {/* SVG Wheel */}
            <motion.div
              className="w-full h-full"
              animate={{ rotate: wheelRotation }}
              transition={{
                duration: 4.8,
                ease: [0.2, 0.6, 0.1, 1],
              }}
            >
              <svg width="384" height="384" className="drop-shadow-2xl" viewBox="0 0 384 384">
                {/* Outer Ring */}
                <circle cx="192" cy="192" r="182" fill="none" stroke="#FCD34D" strokeWidth="12" />

                {/* Wheel Segments */}
                {participants.length > 0 ? (
                  participants.map((participant, index) => {
                    const segmentAngle = 360 / participants.length
                    const startAngle = index * segmentAngle - 90
                    const endAngle = (index + 1) * segmentAngle - 90

                    const startAngleRad = (startAngle * Math.PI) / 180
                    const endAngleRad = (endAngle * Math.PI) / 180

                    const x1 = 192 + 170 * Math.cos(startAngleRad)
                    const y1 = 192 + 170 * Math.sin(startAngleRad)
                    const x2 = 192 + 170 * Math.cos(endAngleRad)
                    const y2 = 192 + 170 * Math.sin(endAngleRad)

                    const largeArcFlag = segmentAngle > 180 ? 1 : 0

                    const pathData = [
                      `M 192 192`,
                      `L ${x1} ${y1}`,
                      `A 170 170 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                      "Z",
                    ].join(" ")

                    // Text position
                    const textAngle = startAngle + segmentAngle / 2
                    const textAngleRad = (textAngle * Math.PI) / 180
                    const textX = 192 + 120 * Math.cos(textAngleRad)
                    const textY = 192 + 120 * Math.sin(textAngleRad)

                    return (
                      <g key={index}>
                        <path d={pathData} fill={colors[index % colors.length]} stroke="#1E3A8A" strokeWidth="2" />
                        <text
  x={textX}
  y={textY}
  textAnchor="middle"
  dominantBaseline="middle"
  fill="white"
  fontSize="16"
  fontWeight="bold"
  transform={`rotate(${textAngle + 90}, ${textX}, ${textY})`}
  className={`drop-shadow-sm ${
    winnerIdx === index && !spinning ? "fill-yellow-300 text-shadow" : ""
  }`}
>
  {typeof participant === "string" ? participant : ""}
</text>

                      </g>
                    )
                  })
                ) : (
                  // Empty wheel background
                  <circle cx="192" cy="192" r="170" fill="#1e1e2f" stroke="#1E3A8A" strokeWidth="2" />
                )}

                {/* Center Circle */}
                <circle cx="192" cy="192" r="30" fill="#FCD34D" stroke="#1E3A8A" strokeWidth="4" />
              </svg>

              {/* Center Icon */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-black">
                <Wheel className="w-8 h-8" />
              </div>
            </motion.div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          {/* Show Spin button only if no winner */}
          {winnerIdx === null && (
            <button
              onClick={startSpin}
              disabled={spinning || participants.length < 2}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-300 to-yellow-500 text-black font-bold text-lg shadow hover:scale-105 transition disabled:opacity-50"
            >
              {spinning ? "እየውጣ ነው. . ." : "እጣዎን ያውጡ"}
            </button>
          )}

          {participants.length < 2 && participants.length > 0 && (
           {/* <p className="text-yellow-300 text-center text-sm">Add at least 2 participants to spin the wheel</p>*/}
          )}

          {participants.length === 0 && (
            <p className="text-white/60 text-center text-sm">Add participants to get started</p>
          )}

          <AnimatePresence>
            {winnerIdx !== null && !spinning && (
              <motion.div
                className="flex flex-col items-center justify-center gap-2 mt-6"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-4xl animate-bounce">🎉</span>
                  <span className="text-3xl font-extrabold text-gradient bg-gradient-to-r from-green-400 via-yellow-300 to-green-400 bg-clip-text text-transparent drop-shadow-lg">
                    Winner!
                  </span>
                  <span className="text-4xl animate-bounce">🎉</span>
                </div>
                <div className="mt-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-yellow-300 via-white to-green-400 text-black font-extrabold text-3xl shadow-lg border-4 border-yellow-400 drop-shadow-xl flex items-center gap-2">
                  <span className="text-green-500">🏆</span>
                  <span className="tracking-wide">{participants[winnerIdx]}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Confetti from center */}
      {showConfetti && (
        <Confetti
          key={confettiKey}
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={200}
          recycle={false}
          gravity={0.3}
          wind={0.01}
          initialVelocityY={25}
          confettiSource={{
            x: windowSize.width / 2 - 100,
            y: windowSize.height / 2 - 100,
            w: 200,
            h: 200,
          }}
        />
      )}
    </div>
  )
}
