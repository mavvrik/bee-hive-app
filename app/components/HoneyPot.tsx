"use client";

import { useEffect, useMemo, useState } from "react";

type HoneyPotProps = {
  currentLiters: number;
  monthlyGoal: number;
};

export default function HoneyPot({
  currentLiters,
  monthlyGoal,
}: HoneyPotProps) {
  const targetPercent = useMemo(() => {
    if (monthlyGoal <= 0) {
      return 0;
    }

    return Math.min(
      Math.max((currentLiters / monthlyGoal) * 100, 0),
      100,
    );
  }, [currentLiters, monthlyGoal]);

  const [animatedPercent, setAnimatedPercent] = useState(0);
  const [displayedLiters, setDisplayedLiters] = useState(0);

  useEffect(() => {
    const duration = 1400;
    const startTime = performance.now();
    const startingPercent = animatedPercent;
    const startingLiters = displayedLiters;

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easedProgress =
        1 - Math.pow(1 - progress, 3);

      setAnimatedPercent(
        startingPercent +
          (targetPercent - startingPercent) *
            easedProgress,
      );

      setDisplayedLiters(
        startingLiters +
          (currentLiters - startingLiters) *
            easedProgress,
      );

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const animationFrame =
      requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [currentLiters, targetPercent]);

  const remainingLiters = Math.max(
    monthlyGoal - currentLiters,
    0,
  );

  const honeyMaximumHeight = 224;
  const honeyHeight =
    honeyMaximumHeight *
    (animatedPercent / 100);

  const honeyBottom = 334;
  const honeyY =
    honeyBottom - honeyHeight;

  return (
    <section
      className="honey-pot-card"
      aria-label="Monthly production progress"
    >
      <div
  className={`ambient-glow ${
    targetPercent >= 100
      ? "goal-complete-glow"
      : targetPercent >= 85
        ? "goal-near-glow"
        : ""
  }`}
  aria-hidden="true"
/>

      <header className="honey-pot-header">
        <p className="eyebrow">
          Monthly Hive Progress
        </p>

        <h2>The Honey Pot</h2>

        <p className="location">
          Riviera Beach 115
        </p>
      </header>

      <div className="pot-stage">
  <svg
    className={`honey-pot-svg ${
      targetPercent >= 100
        ? "goal-complete"
        : targetPercent >= 85
          ? "goal-near"
          : ""
    }`}
    viewBox="0 0 420 440"
    role="img"
    aria-label={`The Honey Pot is ${targetPercent.toFixed(
      1,
    )}% full`}
  >
          <defs>
            <linearGradient
              id="glassBody"
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#ffffff"
                stopOpacity="0.94"
              />

              <stop
                offset="30%"
                stopColor="#fff8dc"
                stopOpacity="0.72"
              />

              <stop
                offset="72%"
                stopColor="#eacb73"
                stopOpacity="0.48"
              />

              <stop
                offset="100%"
                stopColor="#b98217"
                stopOpacity="0.62"
              />
            </linearGradient>

            <linearGradient
              id="glassEdge"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop
                offset="0%"
                stopColor="#7d560f"
              />

              <stop
                offset="48%"
                stopColor="#d3a83d"
              />

              <stop
                offset="100%"
                stopColor="#714907"
              />
            </linearGradient>

            <linearGradient
              id="honeyBody"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#ffe27d"
              />

              <stop
                offset="18%"
                stopColor="#ffc83d"
              />

              <stop
                offset="56%"
                stopColor="#ed9d13"
              />

              <stop
                offset="100%"
                stopColor="#ad5203"
              />
            </linearGradient>

            <linearGradient
              id="honeyDepth"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop
                offset="0%"
                stopColor="#8f3d00"
                stopOpacity="0.38"
              />

              <stop
                offset="28%"
                stopColor="#ffcf48"
                stopOpacity="0.08"
              />

              <stop
                offset="65%"
                stopColor="#fff0a4"
                stopOpacity="0.24"
              />

              <stop
                offset="100%"
                stopColor="#8a3900"
                stopOpacity="0.42"
              />
            </linearGradient>

            <radialGradient
              id="labelGlow"
              cx="50%"
              cy="35%"
              r="75%"
            >
              <stop
                offset="0%"
                stopColor="#fffdf0"
                stopOpacity="0.96"
              />

              <stop
                offset="100%"
                stopColor="#f5dfa0"
                stopOpacity="0.83"
              />
            </radialGradient>

            <clipPath id="jarClip">
              <path d="
                M118 91
                C99 126 91 177 92 237
                C93 309 118 356 164 372
                C193 382 227 382 256 372
                C302 356 327 309 328 237
                C329 177 321 126 302 91
                Z
              " />
            </clipPath>

            <filter
              id="jarShadow"
              x="-30%"
              y="-30%"
              width="160%"
              height="180%"
            >
              <feDropShadow
                dx="0"
                dy="16"
                stdDeviation="13"
                floodColor="#533403"
                floodOpacity="0.3"
              />
            </filter>

            <filter
              id="softGlow"
              x="-40%"
              y="-40%"
              width="180%"
              height="180%"
            >
              <feGaussianBlur
                stdDeviation="7"
                result="blur"
              />

              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <ellipse
            cx="210"
            cy="397"
            rx="124"
            ry="23"
            fill="rgba(80, 48, 2, 0.15)"
          />

          <path
            d="
              M118 91
              C99 126 91 177 92 237
              C93 309 118 356 164 372
              C193 382 227 382 256 372
              C302 356 327 309 328 237
              C329 177 321 126 302 91
              Z
            "
            fill="url(#glassBody)"
            stroke="url(#glassEdge)"
            strokeWidth="7"
            filter="url(#jarShadow)"
          />

          <g clipPath="url(#jarClip)">
            <rect
              x="86"
              y={honeyY}
              width="248"
              height={
                honeyHeight + 70
              }
              fill="url(#honeyBody)"
              className="honey-level"
            />

            <rect
              x="86"
              y={honeyY}
              width="248"
              height={
                honeyHeight + 70
              }
              fill="url(#honeyDepth)"
              className="honey-level"
            />

            <g
              className="wave wave-back"
              style={{
                transform: `translateY(${honeyY}px)`,
              }}
            >
              <path
                d="
                  M38 16
                  C72 -6 104 -6 138 16
                  C172 38 204 38 238 16
                  C272 -6 304 -6 338 16
                  C372 38 404 38 438 16
                  L438 70
                  L38 70
                  Z
                "
                fill="#f3a915"
                opacity="0.72"
              />
            </g>

            <g
              className="wave wave-front"
              style={{
                transform: `translateY(${honeyY + 4}px)`,
              }}
            >
              <path
                d="
                  M20 18
                  C50 -2 82 -2 112 18
                  C142 38 174 38 204 18
                  C234 -2 266 -2 296 18
                  C326 38 358 38 388 18
                  C418 -2 450 -2 480 18
                  L480 72
                  L20 72
                  Z
                "
                fill="#ffdc65"
                opacity="0.95"
              />
            </g>

            {animatedPercent > 2 && (
              <>
                <circle
                  className="honey-bubble bubble-one"
                  cx="143"
                  cy="342"
                  r="6"
                  fill="#fff1a7"
                  opacity="0.55"
                />

                <circle
                  className="honey-bubble bubble-two"
                  cx="263"
                  cy="324"
                  r="8"
                  fill="#fff2aa"
                  opacity="0.42"
                />

                <circle
                  className="honey-bubble bubble-three"
                  cx="199"
                  cy="355"
                  r="4"
                  fill="#fff6c5"
                  opacity="0.6"
                />

                <circle
                  className="honey-bubble bubble-four"
                  cx="292"
                  cy="352"
                  r="5"
                  fill="#fff1a7"
                  opacity="0.38"
                />
              </>
            )}

            <ellipse
              cx="210"
              cy={honeyY + 24}
              rx="90"
              ry="22"
              fill="#fff2a4"
              opacity="0.24"
              filter="url(#softGlow)"
              className="honey-surface-glow"
            />
          </g>

          {targetPercent >= 100 && (
            <g
              className="goal-sparkles"
              aria-hidden="true"
            >
              <circle className="goal-sparkle sparkle-one" cx="90" cy="150" r="4" />
              <circle className="goal-sparkle sparkle-two" cx="330" cy="180" r="5" />
              <circle className="goal-sparkle sparkle-three" cx="115" cy="290" r="3" />
              <circle className="goal-sparkle sparkle-four" cx="305" cy="310" r="4" />
              <path
                className="goal-star star-one"
                d="M76 230 L81 242 L93 247 L81 252 L76 264 L71 252 L59 247 L71 242 Z"
              />
              <path
                className="goal-star star-two"
                d="M346 108 L350 118 L360 122 L350 126 L346 136 L342 126 L332 122 L342 118 Z"
              />
            </g>
          )}

          <ellipse
            cx="210"
            cy="89"
            rx="99"
            ry="29"
            fill="#bd8420"
            stroke="#73500d"
            strokeWidth="6"
          />

          <ellipse
            cx="210"
            cy="87"
            rx="81"
            ry="19"
            fill="#f4d36c"
          />

          <ellipse
            cx="210"
            cy="84"
            rx="57"
            ry="10"
            fill="rgba(255, 255, 255, 0.48)"
          />

          <path
            d="
              M132 123
              C116 172 119 278 145 326
            "
            fill="none"
            stroke="rgba(255, 255, 255, 0.67)"
            strokeWidth="13"
            strokeLinecap="round"
          />

          <path
            d="
              M286 128
              C302 176 301 233 292 272
            "
            fill="none"
            stroke="rgba(255, 255, 255, 0.25)"
            strokeWidth="7"
            strokeLinecap="round"
          />

          <path
            className="glass-shimmer"
            d="
              M151 110
              C133 163 139 220 151 251
            "
            fill="none"
            stroke="rgba(255, 255, 255, 0.86)"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {[25, 50, 75].map(
            (mark) => {
              const markY =
                honeyBottom -
                honeyMaximumHeight *
                  (mark / 100);

              return (
                <g key={mark}>
                  <line
                    x1="309"
                    y1={markY}
                    x2="321"
                    y2={markY}
                    stroke="#69460c"
                    strokeWidth="2"
                    opacity="0.58"
                  />

                  <text
                    x="328"
                    y={markY + 4}
                    fill="#69460c"
                    fontSize="11"
                    fontWeight="800"
                    opacity="0.72"
                  >
                    {mark}%
                  </text>
                </g>
              );
            },
          )}

          <rect
            x="132"
            y="170"
            width="156"
            height="106"
            rx="25"
            fill="url(#labelGlow)"
            stroke="rgba(107, 71, 8, 0.25)"
            strokeWidth="2"
          />

          <path
            d="
              M154 191
              H266
            "
            stroke="#d0a437"
            strokeWidth="2"
            opacity="0.45"
          />

          <text
            x="210"
            y="222"
            textAnchor="middle"
            fill="#342307"
            fontSize={targetPercent >= 100 ? "30" : "42"}
            fontWeight="900"
            className={
              targetPercent >= 100
                ? "goal-success-title"
                : ""
            }
          >
            {targetPercent >= 100
              ? "HIVE FULL"
              : `${animatedPercent.toFixed(1)}%`}
          </text>

          <text
            x="210"
            y="250"
            textAnchor="middle"
            fill="#72551b"
            fontSize="12"
            fontWeight="900"
            letterSpacing="1.8"
            className={
              targetPercent >= 100
                ? "goal-success-subtitle"
                : ""
            }
          >
            {targetPercent >= 100
              ? "GOAL ACHIEVED"
              : "OF MONTHLY GOAL"}
          </text>
        </svg>
      </div>

      <div className="metrics-grid">
        <Metric
          label="Current Liters"
          value={displayedLiters}
        />

        <Metric
          label="Monthly Goal"
          value={monthlyGoal}
        />

        <Metric
          label="Remaining"
          value={remainingLiters}
        />
      </div>

      <style>
        {`
          .honey-pot-card {
            position: relative;
            overflow: hidden;
            margin-bottom: 32px;
            padding: 34px 24px 30px;
            text-align: center;
            border: 1px solid #ead58f;
            border-radius: 30px;
            background:
              radial-gradient(
                circle at 50% 0%,
                #ffffff 0%,
                #fff9df 48%,
                #f3dc95 100%
              );
            box-shadow:
              0 20px 50px rgba(100, 70, 10, 0.16),
              inset 0 1px 0 rgba(255, 255, 255, 0.9);
          }

          .ambient-glow {
            position: absolute;
            top: -130px;
            left: 50%;
            width: 520px;
            height: 270px;
            transform: translateX(-50%);
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.7);
            filter: blur(25px);
            pointer-events: none;
          }

          .honey-pot-header {
            position: relative;
            z-index: 2;
          }

          .eyebrow {
            margin: 0;
            color: #886619;
            font-size: 0.78rem;
            font-weight: 900;
            letter-spacing: 0.18em;
            text-transform: uppercase;
          }

          .honey-pot-header h2 {
            margin: 8px 0 0;
            color: #33250c;
            font-size: clamp(1.9rem, 4vw, 2.5rem);
          }

          .location {
            margin: 8px 0 0;
            color: #786238;
            font-size: 0.95rem;
          }

          .pot-stage {
            position: relative;
            z-index: 2;
            display: flex;
            justify-content: center;
            align-items: center;
          }

          .honey-pot-svg {
  display: block;
  width: 100%;
  max-width: 410px;
  height: auto;
  overflow: visible;

  animation:
    honeyPotFloat 5.8s ease-in-out infinite;

  transform-origin: center center;
  will-change: transform, filter;
}

@keyframes honeyPotFloat {
  0%,
  100% {
    transform:
      translateY(0)
      rotate(-0.35deg);
  }

  50% {
    transform:
      translateY(-8px)
      rotate(0.35deg);
  }
}

.honey-pot-svg.goal-near {
  animation:
    honeyPotFloat 5.8s ease-in-out infinite,
    nearGoalGlow 2.8s ease-in-out infinite;
}

@keyframes nearGoalGlow {
  0%,
  100% {
    filter:
      drop-shadow(
        0 0 4px rgba(235,169,26,.18)
      );
  }

  50% {
    filter:
      drop-shadow(
        0 0 18px rgba(235,169,26,.55)
      );
  }
}

.honey-pot-svg.goal-complete {
  animation:
    honeyPotFloat 5.2s ease-in-out infinite,
    completedGoalGlow 2s ease-in-out infinite;
}

@keyframes completedGoalGlow {
  0%,
  100% {
    filter:
      drop-shadow(
        0 0 10px rgba(232,168,20,.45)
      )
      drop-shadow(
        0 0 24px rgba(255,220,90,.28)
      );
  }

  50% {
    filter:
      drop-shadow(
        0 0 24px rgba(232,168,20,.85)
      )
      drop-shadow(
        0 0 44px rgba(255,220,90,.6)
      );
  }
}

          @keyframes completedGoalPulse {
            0%, 84%, 100% { scale: 1; }
            90% { scale: 1.025; }
            95% { scale: 1; }
          }

          .honey-level {
            transition:
              y 1400ms cubic-bezier(0.22, 1, 0.36, 1),
              height 1400ms cubic-bezier(0.22, 1, 0.36, 1);
          }

          .wave {
            transform-box: fill-box;
            transform-origin: center;
            transition:
              transform 1400ms cubic-bezier(0.22, 1, 0.36, 1);
          }

          .wave-front {
            animation:
              frontWave 4.2s ease-in-out infinite;
          }

          .wave-back {
            animation:
              backWave 5.8s ease-in-out infinite;
          }

          @keyframes frontWave {
            0% {
              translate: -64px 0;
              scale: 1 1;
            }

            25% {
              translate: -42px 2px;
              scale: 1.03 0.94;
            }

            50% {
              translate: -18px -1px;
              scale: 1 1.05;
            }

            75% {
              translate: -42px 2px;
              scale: 1.02 0.96;
            }

            100% {
              translate: -64px 0;
              scale: 1 1;
            }
          }

          @keyframes backWave {
            0% {
              translate: -20px 1px;
              scale: 1.02 0.96;
            }

            50% {
              translate: -65px -2px;
              scale: 1 1.05;
            }

            100% {
              translate: -20px 1px;
              scale: 1.02 0.96;
            }
          }

          .honey-surface-glow {
            animation:
              surfaceGlow 3.8s ease-in-out infinite;
          }

          @keyframes surfaceGlow {
            0%,
            100% {
              opacity: 0.18;
              transform: scaleX(0.94);
            }

            50% {
              opacity: 0.4;
              transform: scaleX(1.05);
            }
          }

          .honey-bubble {
            transform-box: fill-box;
            transform-origin: center;
          }

          .bubble-one {
            animation:
              bubbleRiseOne 7s ease-in infinite;
          }

          .bubble-two {
            animation:
              bubbleRiseTwo 8.5s ease-in infinite 1.2s;
          }

          .bubble-three {
            animation:
              bubbleRiseOne 6.4s ease-in infinite 2.1s;
          }

          .bubble-four {
            animation:
              bubbleRiseTwo 7.8s ease-in infinite 3s;
          }

          @keyframes bubbleRiseOne {
            0% {
              transform: translateY(15px) scale(0.7);
              opacity: 0;
            }

            18% {
              opacity: 0.5;
            }

            80% {
              opacity: 0.35;
            }

            100% {
              transform: translateY(-125px) scale(1.08);
              opacity: 0;
            }
          }

          @keyframes bubbleRiseTwo {
            0% {
              transform: translate(0, 18px) scale(0.65);
              opacity: 0;
            }

            25% {
              opacity: 0.42;
            }

            55% {
              transform: translate(-8px, -52px) scale(0.9);
            }

            100% {
              transform: translate(5px, -145px) scale(1.12);
              opacity: 0;
            }
          }

          .glass-shimmer {
            animation:
              glassShimmer 5.5s ease-in-out infinite;
          }

          @keyframes glassShimmer {
            0%,
            20% {
              opacity: 0;
              transform: translateX(-18px);
            }

            42% {
              opacity: 0.8;
            }

            62% {
              opacity: 0;
              transform: translateX(46px);
            }

            100% {
              opacity: 0;
              transform: translateX(46px);
            }
          }

          .goal-sparkles { pointer-events: none; }

          .goal-sparkle,
          .goal-star {
            fill: #ffd75e;
            filter: drop-shadow(0 0 6px rgba(255, 195, 32, 0.95));
            transform-box: fill-box;
            transform-origin: center;
          }

          .sparkle-one { animation: sparkleFloat 2.8s ease-in-out infinite; }
          .sparkle-two { animation: sparkleFloat 3.3s ease-in-out infinite 0.4s; }
          .sparkle-three { animation: sparkleFloat 2.6s ease-in-out infinite 0.8s; }
          .sparkle-four { animation: sparkleFloat 3.1s ease-in-out infinite 1.1s; }
          .star-one { animation: starTwinkle 2.4s ease-in-out infinite; }
          .star-two { animation: starTwinkle 2.9s ease-in-out infinite 0.7s; }

          @keyframes sparkleFloat {
            0%, 100% { opacity: 0.25; transform: translateY(6px) scale(0.7); }
            50% { opacity: 1; transform: translateY(-8px) scale(1.18); }
          }

          @keyframes starTwinkle {
            0%, 100% { opacity: 0.3; transform: rotate(0deg) scale(0.7); }
            50% { opacity: 1; transform: rotate(18deg) scale(1.15); }
          }

          .goal-success-title,
          .goal-success-subtitle {
            transform-box: fill-box;
            transform-origin: center;
          }

          .goal-success-title { animation: successTitlePulse 2.4s ease-in-out infinite; }
          .goal-success-subtitle { animation: successSubtitleGlow 2.4s ease-in-out infinite; }

          @keyframes successTitlePulse {
            0%, 100% { opacity: 0.9; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.035); }
          }

          @keyframes successSubtitleGlow {
            0%, 100% { opacity: 0.78; }
            50% { opacity: 1; }
          }

          .metrics-grid {
            position: relative;
            z-index: 2;
            display: grid;
            grid-template-columns:
              repeat(auto-fit, minmax(170px, 1fr));
            gap: 14px;
            width: 100%;
            max-width: 780px;
            margin: 0 auto;
          }

          .honey-metric {
            padding: 17px 14px;
            border: 1px solid rgba(197, 153, 42, 0.35);
            border-radius: 17px;
            background: rgba(255, 255, 255, 0.74);
            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.92),
              0 6px 16px rgba(103, 72, 11, 0.06);
            backdrop-filter: blur(8px);
          }

          .honey-metric-label {
            margin: 0 0 7px;
            color: #786439;
            font-size: 0.8rem;
            font-weight: 800;
            letter-spacing: 0.05em;
            text-transform: uppercase;
          }

          .honey-metric-value {
            display: block;
            color: #30250f;
            font-size: 1.38rem;
          }

          @media (prefers-reduced-motion: reduce) {
            .ambient-glow,
            .honey-pot-svg,
            .wave-front,
            .wave-back,
            .honey-surface-glow,
            .honey-bubble,
            .glass-shimmer,
            .goal-sparkle,
            .goal-star,
            .goal-success-title,
            .goal-success-subtitle {
              animation: none;
            }

            .honey-level,
            .wave {
              transition: none;
            }
          }

          @media (max-width: 600px) {
            .honey-pot-card {
              padding: 28px 14px 24px;
              border-radius: 23px;
            }

            .honey-pot-svg {
              max-width: 350px;
            }
          }
        `}
      </style>
    </section>
  );
}

type MetricProps = {
  label: string;
  value: number;
};

function Metric({
  label,
  value,
}: MetricProps) {
  return (
    <div className="honey-metric">
      <p className="honey-metric-label">
        {label}
      </p>

      <strong className="honey-metric-value">
        {value.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}{" "}
        L
      </strong>
    </div>
  );
}