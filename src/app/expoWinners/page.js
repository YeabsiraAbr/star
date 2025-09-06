"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import {
  Trophy,
  Download,
  Sparkles,
  Gift,
  Users,
  Calendar,
} from "lucide-react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

const API_URL =
  "https://v8crgwv139.execute-api.us-east-1.amazonaws.com/Stage/api/v2/user/pickRandomUserByTicketWithPrize";

const PRIZES = [
  { name: "Sheep", emoji: "🐑", color: "from-green-500 to-green-700" },
  { name: "Egg", emoji: "🥚", color: "from-green-400 to-green-600" },
  { name: "Butter", emoji: "🧈", color: "from-emerald-400 to-emerald-600" },
  { name: "Chicken", emoji: "🐔", color: "from-teal-400 to-teal-600" },
];

export default function ExpoWinners() {
  const [selectedPrize, setSelectedPrize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [winners, setWinners] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 600, height: 600 });
  const [error, setError] = useState("");

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

  const handleDraw = async () => {
    if (!selectedPrize || quantity < 1) {
      setError("Please select a prize and enter a valid quantity");
      return;
    }

    setIsLoading(true);
    setError("");
    setWinners(null);
    setShowConfetti(false);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prize: selectedPrize,
          quantity: quantity,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === "SUCCESS") {
        setWinners(data.data);
        setTimeout(() => setShowConfetti(true), 500);
      } else {
        throw new Error(data.message || "Failed to draw winners");
      }
    } catch (err) {
      console.error("Error drawing winners:", err);
      setError(err.message || "Failed to draw winners. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadResults = () => {
    if (!winners) return;

    // Prepare data for Excel
    const excelData = [
      ["Lottery Draw Results"],
      ["Prize", winners.prize],
      ["Total Winners", winners.totalWinners],
      ["Draw Date", new Date().toLocaleDateString()],
      [""], // Empty row
      ["Winner #", "Phone Number", "Draw Date"],
      ...winners.winners.map((winner, index) => [
        index + 1,
        winner.phoneNumber,
        new Date(winner.createdAt).toLocaleDateString(),
      ]),
    ];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    // Style the header row
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 5, c: C }); // Row 6 (0-indexed)
      if (!ws[cellAddress]) continue;
      ws[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "228B22" } }, // Forest green
        alignment: { horizontal: "center" },
      };
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Lottery Winners");

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(
      blob,
      `lottery-winners-${winners.prize}-${
        new Date().toISOString().split("T")[0]
      }.xlsx`
    );
  };

  const resetDraw = () => {
    setWinners(null);
    setShowConfetti(false);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D4F3C] via-[#1A5F4A] to-[#0D4F3C] text-white">
      {/* Banner Section */}
      <div className="relative w-full h-48 md:h-64 bg-gradient-to-r flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        {/* Banner Image */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src="/banner.png"
            alt="Zemen Gebeya Lottery Banner"
            className="h-full w-full object-contain"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextElementSibling.style.display = "block";
            }}
          />
          {/* Fallback content when banner.pdf is not found */}
          <div className="text-center" style={{ display: "none" }}>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-2 drop-shadow-lg">
              🎉 ZEMEN GEBEYA LOTTERY 🎉
            </h1>
            <p className="text-xl md:text-2xl text-white/90 font-semibold">
              Pick Random Winners with Prizes
            </p>
          </div>
        </div>
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-green-300 rounded-full"
              animate={{
                x: [0, Math.random() * 1000],
                y: [0, Math.random() * 400],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
              style={{
                left: Math.random() * 100 + "%",
                top: Math.random() * 100 + "%",
              }}
            />
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Main Content Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/20 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/30"
          >
            {!winners ? (
              <>
                {/* Prize Selection */}
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-center mb-6 flex items-center justify-center gap-3 text-white">
                    <Gift className="w-8 h-8 text-white" />
                    Select Prize Type
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {PRIZES.map((prize) => (
                      <motion.button
                        key={prize.name}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedPrize(prize.name)}
                        className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                          selectedPrize === prize.name
                            ? `border-white bg-gradient-to-br ${prize.color} text-white shadow-lg`
                            : "border-white/40 bg-white/10 hover:bg-white/20"
                        }`}
                      >
                        <div className="text-4xl mb-2">{prize.emoji}</div>
                        <div className="font-bold text-lg">{prize.name}</div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Quantity Input */}
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-center mb-4 flex items-center justify-center gap-3 text-white">
                    <Users className="w-6 h-6 text-white" />
                    Number of Winners
                  </h3>
                  <div className="max-w-xs mx-auto">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(parseInt(e.target.value) || 1)
                      }
                      className="w-full px-6 py-4 text-2xl font-bold text-center bg-white/20 border-2 border-white/50 rounded-2xl focus:border-white focus:outline-none transition-colors text-white placeholder-white/70"
                      placeholder="Enter quantity"
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-2xl text-red-300 text-center"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Draw Button */}
                <div className="text-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDraw}
                    disabled={isLoading || !selectedPrize}
                    className="px-12 py-6 bg-gradient-to-r from-white to-green-100 text-green-800 font-bold text-2xl rounded-2xl shadow-2xl hover:shadow-white/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto border-2 border-white"
                  >
                    {isLoading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="w-6 h-6 border-2 border-green-800 border-t-transparent rounded-full"
                        />
                        Drawing Winners...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-8 h-8" />
                        Draw Winners
                      </>
                    )}
                  </motion.button>
                </div>
              </>
            ) : (
              /* Results Display */
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="text-6xl mb-4"
                  >
                    🎉
                  </motion.div>
                  <h2 className="text-4xl font-bold mb-2 text-white">
                    Congratulations!
                  </h2>
                  <p className="text-xl text-white/80">
                    {winners.totalWinners} winner
                    {winners.totalWinners > 1 ? "s" : ""} selected for{" "}
                    {winners.prize}
                  </p>
                </div>

                {/* Winners List */}
                <div className="space-y-4 mb-8">
                  {winners.winners.map((winner, index) => (
                    <motion.div
                      key={winner.ticketId}
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="bg-gradient-to-r from-white/20 to-white/30 border border-white/40 rounded-2xl p-6 backdrop-blur-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-white to-green-100 rounded-full flex items-center justify-center text-green-800 font-bold text-xl border-2 border-white">
                            {index + 1}
                          </div>
                          <div className="text-left">
                            <div className="text-lg font-bold text-white">
                              {winner.phoneNumber}
                            </div>
                            <div className="text-sm text-white/80 flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(winner.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <Trophy className="w-8 h-8 text-white" />
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={downloadResults}
                    className="px-8 py-4 bg-gradient-to-r from-white to-green-100 text-green-800 font-bold rounded-2xl shadow-lg hover:shadow-white/25 transition-all duration-300 flex items-center gap-3 border-2 border-white"
                  >
                    <Download className="w-6 h-6" />
                    Download Results
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={resetDraw}
                    className="px-8 py-4 bg-gradient-to-r from-white/90 to-emerald-100 text-emerald-800 font-bold rounded-2xl shadow-lg hover:shadow-white/25 transition-all duration-300 flex items-center gap-3 border-2 border-white"
                  >
                    <Sparkles className="w-6 h-6" />
                    New Draw
                  </motion.button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Confetti */}
      {showConfetti && (
        <Confetti
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
  );
}
