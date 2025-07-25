"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";

const defaultParticipants = ["Alice", "Bob", "Charlie", "Diana"];

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

export default function LotterySpinner() {
  const [participants, setParticipants] = useState(defaultParticipants);
  const [input, setInput] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [winnerIdx, setWinnerIdx] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);
  const [windowSize, setWindowSize] = useState({ width: 400, height: 400 });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const updateSize = () =>
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      updateSize();
      window.addEventListener("resize", updateSize);
      return () => window.removeEventListener("resize", updateSize);
    }
  }, []);

  const addParticipant = () => {
    if (input.trim() && !participants.includes(input.trim())) {
      setParticipants([...participants, input.trim()]);
      setInput("");
    }
  };

  const removeParticipant = (index) => {
    setParticipants(participants.filter((_, i) => i !== index));
    if (winnerIdx === index) setWinnerIdx(null);
  };

  const startSpin = () => {
    if (participants.length < 2) return;

    const segmentAngle = 360 / participants.length;
    const winner = getRandomInt(participants.length);
    setWinnerIdx(winner);
    setConfettiKey((k) => k + 1);
    setShowConfetti(false);
    setSpinning(true);

    const baseSpins = 6;
    const endAngle =
      360 - winner * segmentAngle - segmentAngle / 2 + 360 * baseSpins;

    setWheelRotation((prev) => prev + endAngle);

    setTimeout(() => {
      setShowConfetti(true);
      setSpinning(false);
    }, 5000); // sync with animation duration
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001f3f] via-[#0f1b3d] to-[#150734] text-white flex flex-col items-center justify-center px-4">
      <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-center tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-white to-yellow-400">
        🎡 yeshhhh!
      </h1>

      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 w-full max-w-xl shadow-2xl">
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
            disabled={
              !input.trim() || participants.includes(input.trim()) || spinning
            }
          >
            Add
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {participants.map((p, idx) => (
            <span
              key={p}
              className="bg-yellow-100 text-yellow-900 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
            >
              {p}
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

        <div className="flex justify-center my-8 relative">
          <div className="relative w-72 h-72">
            <motion.div
              className="rounded-full border-[10px] border-yellow-300 w-full h-full relative"
              animate={{ rotate: wheelRotation }}
              transition={{
                duration: 4.8,
                ease: [0.2, 0.6, 0.1, 1],
              }}
              style={{ background: "#1e1e2f" }}
            >
              {participants.map((name, i) => {
                const angle = (360 / participants.length) * i;
                const color = `hsl(${
                  (i * 360) / participants.length
                }, 80%, 65%)`;
                return (
                  <div
                    key={name}
                    className={`absolute left-1/2 top-1/2 origin-bottom font-bold text-sm select-none pointer-events-none ${
                      winnerIdx === i && !spinning
                        ? "text-green-400 scale-125 drop-shadow-xl"
                        : "text-white"
                    }`}
                    style={{
                      transform: `rotate(${angle}deg) translateY(-120px) rotate(-${angle}deg)`,
                      color: spinning ? color : undefined,
                    }}
                  >
                    {name}
                  </div>
                );
              })}
              {/* Center */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-yellow-300 text-black font-bold flex items-center justify-center text-xl shadow-inner">
                🎡
              </div>
            </motion.div>
            {/* Pointer */}
            <div className="absolute top-[-16px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-[24px] border-transparent border-b-yellow-400 z-10" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <button
            onClick={startSpin}
            disabled={spinning || participants.length < 2}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-300 to-yellow-500 text-black font-bold text-lg shadow hover:scale-105 transition disabled:opacity-50"
          >
            {spinning ? "Spinning..." : "Spin the Wheel"}
          </button>

          <AnimatePresence>
            {winnerIdx !== null && !spinning && (
              <motion.div
                className="text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.6 }}
              >
                <div className="text-3xl font-extrabold text-green-400 mb-1">
                  🎉 Winner!
                </div>
                <div className="text-4xl font-bold text-yellow-300 drop-shadow-lg">
                  {participants[winnerIdx]}
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

      <div className="mt-10 text-xs text-white/40 text-center">
        Made with ❤️ using React, Tailwind, Framer Motion & Confetti
      </div>
    </div>
  );
}
