"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import { Trophy, Phone, Ticket, Sparkles, Star, Crown } from "lucide-react";
import Image from "next/image";

export default function iPhoneDrawPage() {
  const [currentStep, setCurrentStep] = useState("idle"); // idle, drawing, winner
  const [winner, setWinner] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 600, height: 600 });
  const [rollingNumber, setRollingNumber] = useState("");
  const [rollingPhone, setRollingPhone] = useState("");

  // Prize configuration
  const PRIZE = {
    amount: "iPhone 17 Pro Max",
    title: "GRAND PRIZE",
    titleAmharic: "ታላቅ ሽልማት",
    confettiColors: ["#EA580C", "#F97316", "#FB923C", "#FDBA74", "#FED7AA"],
  };

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

  // Simulate number rolling effect
  const startRolling = () => {
    const interval = setInterval(() => {
      // Generate random lottery number (6 digits)
      const randomLottery = Math.floor(100000 + Math.random() * 900000);
      setRollingNumber(randomLottery.toString());
      // Generate random phone number (09XXXXXXXX)
      const randomPhone =
        "09" + Math.floor(10000000 + Math.random() * 90000000);
      setRollingPhone(randomPhone);
    }, 50);
    return interval;
  };

  // Start drawing
  const startDrawing = async () => {
    console.log("Starting iPhone draw");
    setCurrentStep("drawing");
    setShowConfetti(false);

    // Start rolling animation
    const interval = startRolling();

    // Wait for 5 seconds with rolling animation
    console.log("Rolling numbers for 5 seconds...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    try {
      const apiUrl =
        "https://v8crgwv139.execute-api.us-east-1.amazonaws.com/Stage/api/v2/ticket/drawLottery/60Million";

      console.log("Calling API:", apiUrl);

      const fetchOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: 1000000,
        }),
      };

      const response = await fetch(apiUrl, fetchOptions);
      const data = await response.json();
      console.log("API Response:", data);

      clearInterval(interval);

      if (data.status === "SUCCESS" && data.winner) {
        const winnerData = {
          lotteryNumber: data.winner.ticketNumber,
          phoneNumber: data.winner.phoneNumber,
          drawnAt: data.winner.drawnAt,
          amount: data.winner.amount,
        };

        console.log("Winner data:", winnerData);
        setRollingNumber(winnerData.lotteryNumber);
        setRollingPhone(winnerData.phoneNumber);
        setWinner(winnerData);

        setCurrentStep("winner");
        setShowConfetti(true);

        // Auto hide confetti after 8 seconds
        setTimeout(() => {
          setShowConfetti(false);
        }, 8000);
      } else {
        // Handle API error
        console.error("API returned error:", data);
        clearInterval(interval);
        alert(`Failed to draw winner: ${data.message || "Unknown error"}`);
        setCurrentStep("idle");
      }
    } catch (error) {
      // Handle network error
      console.error("Failed to fetch winner from API:", error);
      clearInterval(interval);
      alert("Network error. Please check your connection and try again.");
      setCurrentStep("idle");
    }
  };

  // Reset everything
  const resetDraw = () => {
    setCurrentStep("idle");
    setWinner(null);
    setShowConfetti(false);
    setRollingNumber("");
    setRollingPhone("");
  };

  const isDrawing = currentStep === "drawing";
  const isWinnerShown = currentStep === "winner";

  return (
    <div className="h-screen bg-gradient-to-br from-white via-orange-50 to-orange-100 text-gray-900 flex items-center justify-center px-4 py-3 relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-600/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Main Content */}
      <div className="w-full h-full max-w-7xl z-10 flex items-center justify-center">
        {/* Idle State */}
        {currentStep === "idle" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8"
          >
            {/* iPhone Image Display - Left Side */}
            <motion.div
              className="flex-shrink-0"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="relative w-64 h-96 md:w-80 md:h-[500px]">
                <Image
                  src="/Apple-iPhone-17-Pro-Max.jpg"
                  alt="iPhone 17 Pro Max"
                  fill
                  className="object-contain rounded-2xl"
                  priority
                />
              </div>
            </motion.div>

            {/* Right Side Content */}
            <div className="flex flex-col items-center md:items-start flex-1 max-w-lg">
              {/* Header */}
              <motion.div
                className="text-center md:text-left mb-4"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center justify-center md:justify-start gap-2 sm:gap-3 mb-2">
                  <Crown className="w-6 h-6 md:w-8 md:h-8 text-orange-600 animate-pulse flex-shrink-0" />
                  <h1 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-orange-600 via-orange-500 to-orange-700 bg-clip-text text-transparent drop-shadow-lg whitespace-nowrap">
                    iPhone Lottery Draw
                  </h1>
                  <Crown className="w-6 h-6 md:w-8 md:h-8 text-orange-600 animate-pulse flex-shrink-0" />
                </div>
                <p className="text-lg md:text-xl text-orange-700 font-semibold">
                  iPhone 17 Pro Max Prize Draw
                </p>
              </motion.div>

              {/* Prize Display */}
              <motion.div
                className="bg-white rounded-3xl p-6 md:p-8 border-4 border-orange-500 shadow-2xl mb-6 w-full"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex flex-col items-center text-center">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                  >
                    <Trophy className="w-16 h-16 md:w-20 md:h-20 mb-4 text-orange-600" />
                  </motion.div>
                  <h2 className="text-xl md:text-2xl font-bold mb-3 text-gray-800">
                    {PRIZE.title}
                  </h2>
                  <div className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-orange-600 via-orange-500 to-orange-700 bg-clip-text text-transparent mb-3">
                    {PRIZE.amount}
                  </div>
                  <p className="text-base md:text-lg text-gray-600">
                    {PRIZE.titleAmharic}
                  </p>
                </div>
              </motion.div>

              {/* Start Button */}
              <motion.button
                onClick={startDrawing}
                className="px-10 md:px-12 py-3 md:py-4 bg-gradient-to-r from-orange-600 via-orange-500 to-orange-700 rounded-full text-white font-bold text-xl md:text-2xl shadow-2xl hover:shadow-orange-500/50 transition-all border-4 border-white w-full md:w-auto"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                🎲 Start Draw / ዕጣ ጀምር
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Drawing State */}
        {isDrawing && (
          <motion.div
            className="w-full h-full flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* iPhone Image - Left Side */}
            <motion.div
              className="flex-shrink-0"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="relative w-64 h-96 md:w-80 md:h-[500px]">
                <Image
                  src="/Apple-iPhone-17-Pro-Max.jpg"
                  alt="iPhone 17 Pro Max"
                  fill
                  className="object-contain rounded-2xl"
                />
              </div>
            </motion.div>

            {/* Right Side Content */}
            <div className="flex flex-col items-center md:items-start flex-1 max-w-2xl">
              {/* Prize Title */}
              <motion.div
                className="mb-4 text-center md:text-left p-4 rounded-2xl bg-gradient-to-r from-orange-600 via-orange-500 to-orange-700 shadow-2xl border-4 border-white w-full"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Trophy className="w-10 h-10 md:w-12 md:h-12 mx-auto md:mx-0 mb-2 text-white" />
                <h2 className="text-xl md:text-2xl font-extrabold text-white mb-1">
                  {PRIZE.title}
                </h2>
                <p className="text-2xl md:text-3xl font-black text-white">
                  {PRIZE.amount}
                </p>
              </motion.div>

              {/* Drawing Animation */}
              <div className="bg-white rounded-3xl p-4 md:p-6 border-4 border-orange-500 shadow-2xl w-full">
                <motion.div
                  className="text-center mb-4"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <p className="text-xl md:text-2xl font-bold text-orange-600 mb-1">
                    🎰 Drawing in Progress...
                  </p>
                  <p className="text-base md:text-lg text-gray-600">
                    እየወጣ ነው...
                  </p>
                </motion.div>

                {/* Rolling Numbers Display - Side by Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
                  {/* Lottery Number */}
                  <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-4 border-4 border-orange-600 shadow-lg overflow-hidden min-w-0">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Ticket className="w-5 h-5 md:w-6 md:h-6 text-orange-600 flex-shrink-0" />
                      <p className="text-base md:text-lg font-bold text-gray-700">
                        Lottery Number
                      </p>
                    </div>
                    <motion.div
                      className="text-3xl sm:text-4xl md:text-5xl font-mono font-bold text-orange-600 text-center tracking-normal sm:tracking-widest break-all overflow-hidden"
                      key={rollingNumber}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.1 }}
                    >
                      {rollingNumber || "------"}
                    </motion.div>
                  </div>

                  {/* Phone Number */}
                  <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-4 border-4 border-orange-600 shadow-lg overflow-hidden min-w-0">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Phone className="w-5 h-5 md:w-6 md:h-6 text-orange-600 flex-shrink-0" />
                      <p className="text-base md:text-lg font-bold text-gray-700">
                        Phone Number
                      </p>
                    </div>
                    <motion.div
                      className="text-2xl sm:text-3xl md:text-4xl font-mono font-bold text-orange-600 text-center tracking-normal sm:tracking-wider break-all overflow-hidden"
                      key={rollingPhone}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.1 }}
                    >
                      {rollingPhone || "09--------"}
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Winner Revealed State */}
        {isWinnerShown && winner && (
          <motion.div
            className="w-full h-full flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
          >
            {/* iPhone Image - Left Side */}
            <motion.div
              className="flex-shrink-0"
              initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <div className="relative w-64 h-96 md:w-80 md:h-[500px]">
                <Image
                  src="/Apple-iPhone-17-Pro-Max.jpg"
                  alt="iPhone 17 Pro Max"
                  fill
                  className="object-contain rounded-2xl"
                />
              </div>
            </motion.div>

            {/* Right Side Content */}
            <div className="flex flex-col items-center md:items-start flex-1 max-w-2xl">
              {/* Winner Announcement */}
              <motion.div
                className="mb-3 text-center md:text-left w-full"
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="inline-block"
                  >
                    <span className="text-3xl md:text-4xl">🎉</span>
                  </motion.div>
                  <h2 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-orange-600 via-orange-500 to-orange-700 bg-clip-text text-transparent">
                    WINNER! / አሸናፊ!
                  </h2>
                  <motion.div
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="inline-block"
                  >
                    <span className="text-3xl md:text-4xl">🎉</span>
                  </motion.div>
                </div>
              </motion.div>

              {/* Prize Card */}
              <motion.div
                className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-orange-600 via-orange-500 to-orange-700 shadow-2xl border-4 border-white w-full"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Trophy className="w-10 h-10 md:w-12 md:h-12 mx-auto md:mx-0 mb-2 text-white" />
                <h3 className="text-lg md:text-xl font-bold text-white text-center md:text-left mb-1">
                  {PRIZE.title}
                </h3>
                <p className="text-2xl md:text-3xl font-black text-white text-center md:text-left">
                  {PRIZE.amount}
                </p>
              </motion.div>

              {/* Winner Details */}
              <div className="bg-white rounded-3xl p-4 border-4 border-orange-500 shadow-2xl w-full mb-4 min-w-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
                  {/* Lottery Number */}
                  <motion.div
                    className="bg-gradient-to-br from-orange-100 to-orange-50 rounded-2xl p-4 border-4 border-orange-600 shadow-lg overflow-hidden min-w-0"
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Ticket className="w-5 h-5 md:w-6 md:h-6 text-orange-600 flex-shrink-0" />
                      <p className="text-base md:text-lg font-bold text-orange-700">
                        Winning Ticket
                      </p>
                    </div>
                    <div className="text-3xl sm:text-4xl md:text-5xl font-mono font-black text-orange-600 text-center tracking-normal sm:tracking-widest break-all overflow-hidden">
                      {winner.lotteryNumber}
                    </div>
                  </motion.div>

                  {/* Phone Number */}
                  <motion.div
                    className="bg-gradient-to-br from-orange-100 to-orange-50 rounded-2xl p-4 border-4 border-orange-600 shadow-lg overflow-hidden min-w-0"
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Phone className="w-5 h-5 md:w-6 md:h-6 text-orange-600 flex-shrink-0" />
                      <p className="text-base md:text-lg font-bold text-orange-700">
                        Contact Number
                      </p>
                    </div>
                    <div className="text-2xl sm:text-3xl md:text-4xl font-mono font-black text-orange-600 text-center tracking-normal sm:tracking-wider break-all overflow-hidden">
                      {winner.phoneNumber}
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Action Buttons */}
              <motion.button
                onClick={resetDraw}
                className="px-8 md:px-10 py-3 bg-gradient-to-r from-orange-600 via-orange-500 to-orange-700 rounded-full text-white font-bold text-lg md:text-xl shadow-2xl hover:shadow-orange-500/50 transition-all border-4 border-white w-full md:w-auto"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                🔄 New Draw / አዲስ ዕጣ
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Confetti */}
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={500}
          recycle={false}
          gravity={0.3}
          wind={0.01}
          initialVelocityY={30}
          colors={PRIZE.confettiColors}
        />
      )}
    </div>
  );
}
