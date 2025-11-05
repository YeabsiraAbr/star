"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import { ShipWheelIcon as Wheel } from "lucide-react";

// Predefined names for the lottery
const names = [
  "Yeabsira",
  "Nathnael",
  "Dawit",
  "Eleni",
  "Tekle",
  "Kelab",
  "Solomon",
  "Tadel",
  "Dagem",
  "Anmaw",
  "Eden",
  "Mebrat",
  "Yoseph",
  "Yoseph-Call-2",
  "Ermias",
  "Girum",
  "Tsion",
  "Wende",
  "Haymi",
  "Haymi2",
  "Eyuel",
  "Blen",
  "Sami",
  "Abenezer",
  "Yanet",
  "Yared",
  "Yonas",
];

// Use a specific key for localStorage to avoid conflicts
const LOCAL_STORAGE_KEY = "lotteryParticipants";
// Default to empty array if nothing in localStorage
const loadParticipantsFromLocalStorage = () => {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to parse participants from localStorage:", e);
      return []; // Return empty array on error
    }
  }
  return [];
};

// Updated colors to match black and orange theme
const colors = [
  "#FF531A", // Primary orange
  "#FF6B35",
  "#FF8C42",
  "#FFA85C",
];

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

export default function LotterySpinner() {
  // Initialize participants from localStorage or as an empty array
  const [participants, setParticipants] = useState(
    loadParticipantsFromLocalStorage
  );
  const [input, setInput] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [winnerIdx, setWinnerIdx] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);
  const [windowSize, setWindowSize] = useState({ width: 600, height: 600 });
  const [cyclingName, setCyclingName] = useState("");
  const [cyclingInterval, setCyclingInterval] = useState(null);

  // Load window size for confetti
  useEffect(() => {
    if (typeof window !== "undefined") {
      const updateSize = () =>
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      updateSize();
      window.addEventListener("resize", updateSize);
      return () => window.removeEventListener("resize", updateSize);
    }
  }, []);

  // Save participants to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(participants));
      } catch (e) {
        console.error("Failed to save participants to localStorage:", e);
      }
    }
  }, [participants]); // Dependency array: run effect when 'participants' changes

  // Cleanup cycling interval on unmount
  useEffect(() => {
    return () => {
      if (cyclingInterval) {
        clearInterval(cyclingInterval);
      }
    };
  }, [cyclingInterval]);

  const addParticipant = () => {
    if (input.trim() && !participants.includes(input.trim())) {
      setParticipants([...participants, input.trim()]);
      setInput("");
    }
  };

  const loadAllNames = () => {
    setParticipants([...names]);
  };

  const startNameCycling = () => {
    if (participants.length === 0) return;

    let currentIndex = 0;
    const interval = setInterval(() => {
      setCyclingName(participants[currentIndex]);
      currentIndex = (currentIndex + 1) % participants.length;
    }, 100); // Change name every 100ms for fast cycling

    setCyclingInterval(interval);
  };

  const stopNameCycling = () => {
    if (cyclingInterval) {
      clearInterval(cyclingInterval);
      setCyclingInterval(null);
    }
    setCyclingName("");
  };

  const removeParticipant = (index) => {
    setParticipants(participants.filter((_, i) => i !== index));
    // Optional: Also clear winner if the removed participant was the winner
    if (winnerIdx === index) setWinnerIdx(null);
  };

  const startSpin = async () => {
    if (participants.length < 2) return;

    setConfettiKey((k) => k + 1);
    setShowConfetti(false);
    setSpinning(true);
    setWinnerIdx(null);

    // Start name cycling effect
    startNameCycling();

    try {
      // Fetch winner from API
      const response = await fetch("https://els-dev.tamcon.net.et/equbTicket");
      const data = await response.json();

      if (data.success && data.winner) {
        // Find the winner's index in participants array
        const winnerIndex = participants.findIndex(
          (participant) =>
            participant.toLowerCase() === data.winner.toLowerCase()
        );

        if (winnerIndex !== -1) {
          setWinnerIdx(winnerIndex);
          const segmentAngle = 360 / participants.length;
          const baseSpins = 6;
          const endAngle =
            360 -
            winnerIndex * segmentAngle -
            segmentAngle / 2 +
            360 * baseSpins;
          setWheelRotation((prev) => prev + endAngle);
        } else {
          // If winner from API is not in participants, use random selection as fallback
          console.warn(
            `Winner "${data.winner}" from API not found in participants, using random selection`
          );
          const winner = getRandomInt(participants.length);
          setWinnerIdx(winner);
          const segmentAngle = 360 / participants.length;
          const baseSpins = 6;
          const endAngle =
            360 - winner * segmentAngle - segmentAngle / 2 + 360 * baseSpins;
          setWheelRotation((prev) => prev + endAngle);
        }
      } else {
        // Fallback to random selection if API fails
        console.warn("API response invalid, using random selection");
        const winner = getRandomInt(participants.length);
        setWinnerIdx(winner);
        const segmentAngle = 360 / participants.length;
        const baseSpins = 6;
        const endAngle =
          360 - winner * segmentAngle - segmentAngle / 2 + 360 * baseSpins;
        setWheelRotation((prev) => prev + endAngle);
      }
    } catch (error) {
      // Fallback to random selection if API call fails
      console.error("Failed to fetch winner from API:", error);
      const winner = getRandomInt(participants.length);
      setWinnerIdx(winner);
      const segmentAngle = 360 / participants.length;
      const baseSpins = 6;
      const endAngle =
        360 - winner * segmentAngle - segmentAngle / 2 + 360 * baseSpins;
      setWheelRotation((prev) => prev + endAngle);
    }

    setTimeout(() => {
      // Stop name cycling and show final winner
      stopNameCycling();
      setShowConfetti(true);
      setSpinning(false);
    }, 5000); // sync with animation duration
  };

  // Reset the lottery for a new round AND clear localStorage
  const resetLottery = () => {
    stopNameCycling(); // Stop any ongoing name cycling
    setParticipants([]); // This will trigger the useEffect to save []
    setWinnerIdx(null);
    setWheelRotation(0);
    setShowConfetti(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem(LOCAL_STORAGE_KEY); // Explicitly clear on reset
    }
  };

  return (
    <div className="min-h-screen bg-white text-white flex flex-col items-center justify-center px-4 py-4 transition-all duration-300">
      {/* Replace title with image */}
      <div className="mb-4 flex justify-center w-full">
        <img
          src="/TameKUB-02.png"
          alt="Ethiolottery"
          className="h-16 md:h-20 object-contain w-full max-w-4xl drop-shadow-lg"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/Ethiolotteryet-05.png";
          }}
        />
      </div>

      <div className="bg-[#F6F7F9] rounded-3xl p-6 w-full max-w-xl shadow-2xl border border-orange-500/20">
        {/* Only show input form when there's no winner */}
        {winnerIdx === null && (
          <>
            <div className="flex gap-2 mb-4">
              <input
                className="flex-1 px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none border border-gray-600 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                placeholder="Enter participant name"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addParticipant()}
                disabled={spinning}
              />
              <button
                className="bg-orange-500 text-white font-bold px-4 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 shadow-lg transition-all hover:scale-105"
                onClick={addParticipant}
                disabled={
                  !input.trim() ||
                  participants.includes(input.trim()) ||
                  spinning
                }
              >
                ጨምር
              </button>
            </div>
            <div className="flex gap-2 mb-4">
              <button
                className="bg-green-500 text-white font-bold px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 shadow-lg transition-all hover:scale-105 flex-1"
                onClick={loadAllNames}
                disabled={spinning}
              >
                Load All Names ({names.length})
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {participants.map((p, idx) => (
                <span
                  key={`${p}-${idx}`}
                  className="bg-gray-700 text-white px-3 py-1 rounded-full flex items-center gap-2 text-sm border border-orange-500/30 shadow-sm backdrop-blur-sm"
                >
                  {p}
                  <button
                    className="text-white hover:text-red-500 font-bold transition-colors"
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

        {/* Cycling Name Display / Winner Display */}
        {(spinning && cyclingName) || (winnerIdx !== null && !spinning) ? (
          <div className="mb-4 flex justify-center">
            <motion.div
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-xl shadow-2xl border-4 border-orange-300 min-w-[180px] text-center"
              key={spinning ? cyclingName : participants[winnerIdx]}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.1 }}
            >
              <span className="tracking-wide">
                {spinning ? cyclingName : participants[winnerIdx]}
              </span>
            </motion.div>
          </div>
        ) : null}

        <div className="flex justify-center my-6 relative">
          <div className="relative w-[20rem] h-[20rem]">
            {/* Arrow Pointer */}
            <div className="absolute top-[-16px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-[24px] border-transparent border-b-orange-500 z-10 drop-shadow-lg"></div>

            {/* SVG Wheel */}
            <motion.div
              className="w-full h-full"
              animate={{ rotate: wheelRotation }}
              transition={{
                duration: 4.8,
                ease: [0.2, 0.6, 0.1, 1],
              }}
            >
              <svg
                width="320"
                height="320"
                className="drop-shadow-2xl"
                viewBox="0 0 320 320"
              >
                {/* Outer Ring */}
                <circle
                  cx="160"
                  cy="160"
                  r="150"
                  fill="none"
                  stroke="#FF531A"
                  strokeWidth="10"
                />
                {/* Wheel Segments */}
                {participants.length > 0 ? (
                  participants.map((participant, index) => {
                    const segmentAngle = 360 / participants.length;
                    const startAngle = index * segmentAngle - 90;
                    const endAngle = (index + 1) * segmentAngle - 90;
                    const startAngleRad = (startAngle * Math.PI) / 180;
                    const endAngleRad = (endAngle * Math.PI) / 180;
                    const x1 = 160 + 140 * Math.cos(startAngleRad);
                    const y1 = 160 + 140 * Math.sin(startAngleRad);
                    const x2 = 160 + 140 * Math.cos(endAngleRad);
                    const y2 = 160 + 140 * Math.sin(endAngleRad);
                    const largeArcFlag = segmentAngle > 180 ? 1 : 0;
                    const pathData = [
                      `M 160 160`,
                      `L ${x1} ${y1}`,
                      `A 140 140 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                      "Z",
                    ].join(" ");
                    return (
                      <g key={index}>
                        <path
                          d={pathData}
                          fill={colors[index % colors.length]}
                          stroke="#1a1a1a"
                          strokeWidth="2"
                          className={`transition-all duration-300 ${
                            winnerIdx === index && !spinning
                              ? "drop-shadow-lg shadow-orange-500/50"
                              : ""
                          }`}
                        />
                      </g>
                    );
                  })
                ) : (
                  // Empty wheel background
                  <circle
                    cx="160"
                    cy="160"
                    r="140"
                    fill="#374151"
                    stroke="#FF531A"
                    strokeWidth="2"
                  />
                )}
                {/* Center Circle */}
                <circle
                  cx="160"
                  cy="160"
                  r="25"
                  fill="#FF531A"
                  stroke="#1a1a1a"
                  strokeWidth="3"
                />
              </svg>

              {/* Center Icon */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white">
                <Wheel className="w-6 h-6" />
              </div>
            </motion.div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          {/* Show Spin button only if no winner */}
          {winnerIdx === null && (
            <button
              onClick={startSpin}
              disabled={spinning || participants.length < 2}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-lg shadow-lg hover:scale-105 transition disabled:opacity-50 border border-orange-400 hover:shadow-orange-500/25 hover:shadow-xl"
            >
              {spinning ? "እየውጣ ነው..." : "እጣዎን ያውጡ"}
            </button>
          )}

          {participants.length < 2 && participants.length > 0 && (
            <p className="text-orange-400 text-center text-sm">
              Add at least 2 participants to spin the wheel
            </p>
          )}

          {participants.length === 0 && (
            <p className="text-gray-400 text-center text-sm">
              Add participants to get started
            </p>
          )}

          <AnimatePresence>
            {winnerIdx !== null && !spinning && (
              <motion.div
                className="flex flex-col items-center justify-center gap-2 mt-4"
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-3xl animate-bounce">🎉</span>
                  <span className="text-2xl font-extrabold bg-gradient-to-r from-orange-400 to-yellow-300 bg-clip-text text-transparent drop-shadow-lg">
                    አሸናፊ!
                  </span>
                  <span className="text-3xl animate-bounce">🎉</span>
                </div>
                <div className="text-orange-600 text-base font-semibold animate-pulse">
                  Congratulations! 🎊
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
          colors={["#FF531A", "#FF6B35", "#FF8C42", "#FFA85C", "#FFFFFF"]}
          confettiSource={{
            x: windowSize.width / 2 - 100,
            y: windowSize.height / 2 - 100,
            w: 200,
            h: 200,
          }}
        />
      )}
    </div>
  );
}
