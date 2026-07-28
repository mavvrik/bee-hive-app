"use client";

import { useMemo } from "react";

type DonorMeadowProps = {
  weeklyCurrentLiters: number;
  weeklyTarget: number;
  dayName: string;
  totalFlowers?: number;
};

type FlowerState =
  | "bud"
  | "blooming"
  | "bloomed"
  | "golden";

export default function DonorMeadow({
  weeklyCurrentLiters,
  weeklyTarget,
  dayName,
  totalFlowers = 12,
}: DonorMeadowProps) {
  const percentage =
    weeklyTarget > 0
      ? (weeklyCurrentLiters / weeklyTarget) * 100
      : 0;

  const cappedPercentage = Math.min(
    Math.max(percentage, 0),
    100,
  );

  const flowersUnlocked = useMemo(() => {
    if (percentage >= 100) {
      return totalFlowers;
    }

    if (percentage >= 75) {
      return Math.ceil(totalFlowers * 0.75);
    }

    if (percentage >= 50) {
      return Math.ceil(totalFlowers * 0.5);
    }

    if (percentage >= 25) {
      return Math.ceil(totalFlowers * 0.25);
    }

    return Math.min(1, totalFlowers);
  }, [percentage, totalFlowers]);

  const performanceLevel = getPerformanceLevel(
    percentage,
  );

  const flowerStates = Array.from(
    { length: totalFlowers },
    (_, index): FlowerState => {
      if (percentage >= 100 && index >= totalFlowers - 3) {
        return "golden";
      }

      if (index < flowersUnlocked) {
        return "bloomed";
      }

      if (index === flowersUnlocked) {
        return "blooming";
      }

      return "bud";
    },
  );

  return (
    <section
      className={`liter-meadow meadow-${performanceLevel}`}
      aria-label={`Weekly liter progress meadow at ${Math.round(
        percentage,
      )}%`}
    >
      <header className="meadow-header">
        <div>
          <p className="meadow-eyebrow">
            Weekly Liter Ecosystem
          </p>

          <h2>The Production Meadow</h2>

          <p className="meadow-subtitle">
            {getMeadowMessage(
              percentage,
              dayName,
            )}
          </p>
        </div>

        <div className="meadow-progress-summary">
          <strong>
            {Math.round(percentage)}%
          </strong>

          <span>weekly target</span>
        </div>
      </header>

      <div className="meadow-scene">
        <div className="meadow-sun">
          <div className="sun-core" />
          <div className="sun-rays" />
        </div>

        <div className="cloud cloud-one">
          <span />
          <span />
          <span />
        </div>

        <div className="cloud cloud-two">
          <span />
          <span />
          <span />
        </div>

        <div className="meadow-performance-label">
          <span>{dayName}</span>

          <strong>
            {getLevelLabel(percentage)}
          </strong>
        </div>

        <div className="bee-flight bee-flight-one">
          <MiniBee />
        </div>

        {percentage >= 50 && (
          <div className="bee-flight bee-flight-two">
            <MiniBee />
          </div>
        )}

        {percentage >= 75 && (
          <div className="bee-flight bee-flight-three">
            <MiniBee />
          </div>
        )}

        <div className="flower-field">
          {flowerStates.map((state, index) => (
            <Flower
              key={index}
              index={index}
              state={state}
            />
          ))}
        </div>

        {percentage >= 100 && (
          <>
            <div className="goal-glow" />

            <div className="goal-achieved-banner">
              <span>Hive Goal Achieved</span>

              <strong>
                Weekly Target Complete
              </strong>
            </div>

            <div className="pollen-field">
              {Array.from({ length: 14 }).map(
                (_, index) => (
                  <span
                    key={index}
                    style={{
                      left: `${5 + index * 7}%`,
                      animationDelay: `${
                        (index % 7) * 0.35
                      }s`,
                      animationDuration: `${
                        4.8 + (index % 4) * 0.6
                      }s`,
                    }}
                  />
                ),
              )}
            </div>
          </>
        )}

        <div className="meadow-ground meadow-ground-back" />
        <div className="meadow-ground meadow-ground-front" />

        <div className="meadow-progress-track">
          <div
            className="meadow-progress-fill"
            style={{
              width: `${cappedPercentage}%`,
            }}
          />

          <div className="meadow-progress-labels">
            <span>
              {formatLiters(
                weeklyCurrentLiters,
              )}
            </span>

            <span>
              Goal: {formatLiters(weeklyTarget)}
            </span>
          </div>
        </div>
      </div>

      <style>
        {`
          .liter-meadow {
            position: relative;
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 100%;
            min-width: 0;
            min-height: 0;
            overflow: hidden;
            border: 1px solid #b9cf72;
            border-radius: 22px;
            background:
              linear-gradient(
                180deg,
                #f9fdf4 0%,
                #eef8d8 46%,
                #dcecae 100%
              );
            box-shadow:
              0 10px 24px
                rgba(72, 99, 30, 0.12),
              inset 0 1px 0
                rgba(255, 255, 255, 0.92);
            box-sizing: border-box;
          }

          .liter-meadow.meadow-strong,
          .liter-meadow.meadow-achieved,
          .liter-meadow.meadow-exceeding {
            border-color: #d7b84f;
            background:
              linear-gradient(
                180deg,
                #fffdf1 0%,
                #f3f5c3 43%,
                #d4e99b 100%
              );
          }

          .meadow-header {
            position: relative;
            z-index: 15;
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 16px;
            flex: 0 0 auto;
            padding: 14px 18px 8px;
          }

          .meadow-eyebrow {
            margin: 0 0 4px;
            color: #66852d;
            font-size: clamp(
              0.62rem,
              0.7vw,
              0.78rem
            );
            font-weight: 900;
            letter-spacing: 0.13em;
            text-transform: uppercase;
          }

          .meadow-header h2 {
            margin: 0;
            color: #314417;
            font-size: clamp(
              1.3rem,
              1.65vw,
              1.75rem
            );
            line-height: 1;
          }

          .meadow-subtitle {
            max-width: 520px;
            margin: 6px 0 0;
            color: #647342;
            font-size: clamp(
              0.66rem,
              0.72vw,
              0.8rem
            );
            font-weight: 700;
          }

          .meadow-progress-summary {
            flex: 0 0 auto;
            min-width: 94px;
            padding: 8px 12px;
            border: 1px solid
              rgba(104, 133, 46, 0.35);
            border-radius: 14px;
            background:
              rgba(255, 255, 255, 0.72);
            text-align: center;
            box-shadow:
              0 5px 12px
                rgba(74, 96, 30, 0.08);
          }

          .meadow-progress-summary strong {
            display: block;
            color: #40591c;
            font-size: clamp(
              1.35rem,
              1.7vw,
              1.8rem
            );
            line-height: 1;
          }

          .meadow-progress-summary span {
            display: block;
            margin-top: 3px;
            color: #72834b;
            font-size: 0.55rem;
            font-weight: 900;
            letter-spacing: 0.05em;
            text-transform: uppercase;
          }

          .meadow-scene {
            position: relative;
            flex: 1;
            min-height: 0;
            overflow: hidden;
          }

          .meadow-sun {
            position: absolute;
            z-index: 1;
            top: 1%;
            right: 9%;
            width: 76px;
            height: 76px;
            animation:
              sunlightPulse
              7s ease-in-out infinite;
          }

          .sun-core {
            position: absolute;
            inset: 17px;
            border-radius: 50%;
            background:
              radial-gradient(
                circle at 35% 35%,
                #fffbd1,
                #f4d34f 64%,
                #dda91e
              );
            box-shadow:
              0 0 24px
                rgba(243, 205, 66, 0.48);
          }

          .sun-rays {
            position: absolute;
            inset: 0;
            border-radius: 50%;
            background:
              repeating-conic-gradient(
                from 0deg,
                rgba(237, 198, 55, 0.24)
                  0deg 8deg,
                transparent 8deg 24deg
              );
            animation:
              sunRotate
              30s linear infinite;
          }

          .cloud {
            position: absolute;
            z-index: 2;
            display: flex;
            align-items: flex-end;
            opacity: 0.6;
            animation:
              cloudDrift
              26s linear infinite;
          }

          .cloud span {
            display: block;
            margin: 0 -5px;
            border-radius: 50%;
            background:
              rgba(255, 255, 255, 0.84);
            box-shadow:
              0 3px 9px
                rgba(83, 105, 55, 0.08);
          }

          .cloud span:nth-child(1) {
            width: 34px;
            height: 24px;
          }

          .cloud span:nth-child(2) {
            width: 44px;
            height: 34px;
          }

          .cloud span:nth-child(3) {
            width: 31px;
            height: 22px;
          }

          .cloud-one {
            top: 19%;
            left: 7%;
          }

          .cloud-two {
            top: 8%;
            left: 42%;
            transform: scale(0.72);
            animation-duration: 34s;
            animation-delay: -12s;
          }

          .meadow-performance-label {
            position: absolute;
            z-index: 9;
            top: 28%;
            left: 5%;
            padding: 6px 10px;
            border: 1px solid
              rgba(88, 117, 38, 0.26);
            border-radius: 10px;
            background:
              rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(3px);
          }

          .meadow-performance-label span {
            display: block;
            color: #7e8d57;
            font-size: 0.5rem;
            font-weight: 900;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          .meadow-performance-label strong {
            display: block;
            margin-top: 2px;
            color: #40551e;
            font-size: 0.72rem;
          }

          .flower-field {
            position: absolute;
            z-index: 7;
            right: 3%;
            bottom: 24px;
            left: 3%;
            display: grid;
            grid-template-columns:
              repeat(12, minmax(0, 1fr));
            align-items: end;
            height: 67%;
          }

          .flower {
            position: relative;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            height: 100%;
            transform-origin: bottom center;
            animation:
              flowerSway
              var(--sway-duration)
              ease-in-out infinite;
            animation-delay:
              var(--sway-delay);
          }

          .flower-stem {
            position: absolute;
            bottom: 0;
            width: 4px;
            height: var(--stem-height);
            border-radius: 999px;
            background:
              linear-gradient(
                90deg,
                #4b7e2c,
                #78a849,
                #3f6f27
              );
            box-shadow:
              inset 1px 0 0
                rgba(255, 255, 255, 0.24);
          }

          .flower-leaf {
            position: absolute;
            bottom:
              calc(
                var(--stem-height) * 0.38
              );
            width: 19px;
            height: 10px;
            border-radius:
              100% 0 100% 0;
            background:
              linear-gradient(
                135deg,
                #6b9b3d,
                #3f7326
              );
          }

          .flower-leaf-left {
            right: 50%;
            transform:
              rotate(22deg)
              translateX(1px);
          }

          .flower-leaf-right {
            left: 50%;
            transform:
              scaleX(-1)
              rotate(22deg)
              translateX(1px);
          }

          .flower-head {
            position: absolute;
            bottom:
              calc(
                var(--stem-height) - 10px
              );
            width: var(--flower-size);
            height: var(--flower-size);
            transition:
              transform 900ms
                cubic-bezier(
                  0.22,
                  1,
                  0.36,
                  1
                ),
              opacity 700ms ease,
              filter 700ms ease;
          }

          .flower-head.state-bud {
            transform: scale(0.38);
            opacity: 0.72;
            filter: saturate(0.65);
          }

          .flower-head.state-blooming {
            transform: scale(0.72);
            opacity: 0.9;
            animation:
              flowerBloom
              2.8s ease-in-out infinite;
          }

          .flower-head.state-bloomed,
          .flower-head.state-golden {
            transform: scale(1);
            opacity: 1;
          }

          .flower-head.state-golden {
            filter:
              drop-shadow(
                0 0 7px
                rgba(237, 190, 40, 0.72)
              );
            animation:
              goldenFlowerPulse
              3.2s ease-in-out infinite;
          }

          .flower-petal {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 49%;
            height: 49%;
            border-radius:
              75% 25% 75% 25%;
            background:
              var(--petal-color);
            transform-origin: 0 0;
            box-shadow:
              inset 1px 1px 2px
                rgba(255, 255, 255, 0.38);
          }

          .flower-petal:nth-child(1) {
            transform:
              rotate(0deg)
              translate(2px, -50%);
          }

          .flower-petal:nth-child(2) {
            transform:
              rotate(60deg)
              translate(2px, -50%);
          }

          .flower-petal:nth-child(3) {
            transform:
              rotate(120deg)
              translate(2px, -50%);
          }

          .flower-petal:nth-child(4) {
            transform:
              rotate(180deg)
              translate(2px, -50%);
          }

          .flower-petal:nth-child(5) {
            transform:
              rotate(240deg)
              translate(2px, -50%);
          }

          .flower-petal:nth-child(6) {
            transform:
              rotate(300deg)
              translate(2px, -50%);
          }

          .flower-center {
            position: absolute;
            z-index: 4;
            top: 50%;
            left: 50%;
            width: 34%;
            height: 34%;
            border: 2px solid
              rgba(125, 81, 11, 0.3);
            border-radius: 50%;
            background:
              radial-gradient(
                circle at 35% 30%,
                #fff09a,
                #d99d16 75%
              );
            transform:
              translate(-50%, -50%);
            box-shadow:
              0 2px 3px
                rgba(87, 57, 9, 0.15);
          }

          .bee-flight {
            position: absolute;
            z-index: 12;
            width: 34px;
            height: 24px;
            pointer-events: none;
          }

          .bee-flight-one {
            top: 34%;
            left: 17%;
            animation:
              beeMissionOne
              12s ease-in-out infinite;
          }

          .bee-flight-two {
            top: 44%;
            right: 20%;
            animation:
              beeMissionTwo
              15s ease-in-out infinite;
          }

          .bee-flight-three {
            top: 21%;
            left: 48%;
            animation:
              beeMissionThree
              18s ease-in-out infinite;
          }

          .mini-bee {
            position: relative;
            width: 34px;
            height: 24px;
          }

          .mini-bee-body {
            position: absolute;
            top: 8px;
            left: 7px;
            width: 23px;
            height: 14px;
            border: 2px solid #59420e;
            border-radius: 50%;
            background:
              repeating-linear-gradient(
                90deg,
                #f2bd2d 0 5px,
                #4f390c 5px 9px
              );
          }

          .mini-bee-head {
            position: absolute;
            z-index: 3;
            top: 8px;
            left: 2px;
            width: 14px;
            height: 14px;
            border: 2px solid #59420e;
            border-radius: 50%;
            background: #e9b62c;
          }

          .mini-bee-wing {
            position: absolute;
            top: 1px;
            width: 16px;
            height: 12px;
            border: 1px solid
              rgba(78, 109, 124, 0.4);
            border-radius: 50%;
            background:
              rgba(229, 248, 252, 0.82);
            animation:
              wingFlutter
              0.18s ease-in-out infinite alternate;
          }

          .mini-bee-wing-left {
            left: 9px;
            transform: rotate(-20deg);
          }

          .mini-bee-wing-right {
            left: 18px;
            transform: rotate(24deg);
          }

          .goal-glow {
            position: absolute;
            z-index: 3;
            inset: 20% 10% 5%;
            border-radius: 50%;
            background:
              radial-gradient(
                ellipse,
                rgba(255, 221, 85, 0.34),
                transparent 67%
              );
            animation:
              goalGlowPulse
              3.4s ease-in-out infinite;
          }

          .goal-achieved-banner {
            position: absolute;
            z-index: 20;
            top: 36%;
            left: 50%;
            min-width: 230px;
            padding: 9px 18px;
            border: 1px solid
              rgba(185, 125, 6, 0.52);
            border-radius: 999px;
            background:
              linear-gradient(
                90deg,
                rgba(255, 250, 207, 0.95),
                rgba(255, 214, 77, 0.95)
              );
            text-align: center;
            transform:
              translate(-50%, -50%);
            box-shadow:
              0 8px 24px
                rgba(145, 95, 5, 0.22);
            animation:
              goalBannerEntrance
              6s ease-in-out infinite;
          }

          .goal-achieved-banner span {
            display: block;
            color: #865d08;
            font-size: 0.52rem;
            font-weight: 900;
            letter-spacing: 0.09em;
            text-transform: uppercase;
          }

          .goal-achieved-banner strong {
            display: block;
            margin-top: 2px;
            color: #3f2a03;
            font-size: 0.88rem;
          }

          .pollen-field {
            position: absolute;
            z-index: 17;
            inset: 0;
            overflow: hidden;
            pointer-events: none;
          }

          .pollen-field span {
            position: absolute;
            top: -8px;
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: #f5c936;
            box-shadow:
              0 0 6px
                rgba(247, 202, 54, 0.7);
            animation:
              pollenFall
              5s linear infinite;
          }

          .meadow-ground {
            position: absolute;
            right: -5%;
            bottom: -36px;
            left: -5%;
            border-radius:
              50% 50% 0 0;
          }

          .meadow-ground-back {
            z-index: 4;
            height: 88px;
            background:
              linear-gradient(
                180deg,
                #8fba55,
                #6f9d3a
              );
          }

          .meadow-ground-front {
            z-index: 6;
            bottom: -50px;
            height: 92px;
            background:
              linear-gradient(
                180deg,
                #6d9b3b,
                #467525
              );
          }

          .meadow-progress-track {
            position: absolute;
            z-index: 25;
            right: 18px;
            bottom: 10px;
            left: 18px;
            height: 12px;
            overflow: visible;
            border: 2px solid
              rgba(255, 255, 255, 0.74);
            border-radius: 999px;
            background:
              rgba(60, 87, 30, 0.26);
            box-shadow:
              inset 0 2px 4px
                rgba(44, 66, 18, 0.18),
              0 3px 8px
                rgba(49, 73, 20, 0.12);
          }

          .meadow-progress-fill {
            height: 100%;
            border-radius: inherit;
            background:
              linear-gradient(
                90deg,
                #79aa3e,
                #aed34f,
                #efc33d
              );
            box-shadow:
              0 0 10px
                rgba(194, 212, 64, 0.36);
            transition:
              width 1.1s
                cubic-bezier(
                  0.22,
                  1,
                  0.36,
                  1
                );
          }

          .meadow-progress-labels {
            position: absolute;
            right: 2px;
            bottom: 16px;
            left: 2px;
            display: flex;
            justify-content: space-between;
            color: #405722;
            font-size: 0.55rem;
            font-weight: 900;
            text-shadow:
              0 1px 0
                rgba(255, 255, 255, 0.72);
          }

          @keyframes flowerSway {
            0%,
            100% {
              transform: rotate(-1.4deg);
            }

            50% {
              transform: rotate(1.7deg);
            }
          }

          @keyframes flowerBloom {
            0%,
            100% {
              transform: scale(0.72);
            }

            50% {
              transform: scale(0.86);
            }
          }

          @keyframes goldenFlowerPulse {
            0%,
            100% {
              transform: scale(1);
            }

            50% {
              transform: scale(1.07);
            }
          }

          @keyframes wingFlutter {
            from {
              transform:
                rotate(-24deg)
                scaleY(0.62);
            }

            to {
              transform:
                rotate(12deg)
                scaleY(1);
            }
          }

          @keyframes beeMissionOne {
            0%,
            100% {
              transform:
                translate(0, 0)
                rotate(-4deg);
            }

            25% {
              transform:
                translate(80px, -18px)
                rotate(5deg);
            }

            52% {
              transform:
                translate(190px, 24px)
                rotate(-3deg);
            }

            76% {
              transform:
                translate(94px, 46px)
                rotate(6deg);
            }
          }

          @keyframes beeMissionTwo {
            0%,
            100% {
              transform:
                translate(0, 0)
                rotate(5deg);
            }

            32% {
              transform:
                translate(-105px, -25px)
                rotate(-6deg);
            }

            68% {
              transform:
                translate(-185px, 35px)
                rotate(5deg);
            }
          }

          @keyframes beeMissionThree {
            0%,
            100% {
              transform:
                translate(0, 0)
                rotate(-4deg);
            }

            30% {
              transform:
                translate(128px, 28px)
                rotate(5deg);
            }

            60% {
              transform:
                translate(-78px, 54px)
                rotate(-5deg);
            }
          }

          @keyframes cloudDrift {
            0% {
              transform:
                translateX(-20px);
            }

            50% {
              transform:
                translateX(46px);
            }

            100% {
              transform:
                translateX(-20px);
            }
          }

          @keyframes sunlightPulse {
            0%,
            100% {
              opacity: 0.78;
              transform: scale(1);
            }

            50% {
              opacity: 1;
              transform: scale(1.05);
            }
          }

          @keyframes sunRotate {
            to {
              transform: rotate(360deg);
            }
          }

          @keyframes goalGlowPulse {
            0%,
            100% {
              opacity: 0.45;
              transform: scale(0.96);
            }

            50% {
              opacity: 0.9;
              transform: scale(1.06);
            }
          }

          @keyframes goalBannerEntrance {
            0%,
            14% {
              opacity: 0;
              transform:
                translate(-50%, -38%)
                scale(0.88);
            }

            24%,
            76% {
              opacity: 1;
              transform:
                translate(-50%, -50%)
                scale(1);
            }

            88%,
            100% {
              opacity: 0;
              transform:
                translate(-50%, -60%)
                scale(0.96);
            }
          }

          @keyframes pollenFall {
            0% {
              opacity: 0;
              transform:
                translateY(-8px)
                rotate(0deg);
            }

            15% {
              opacity: 1;
            }

            100% {
              opacity: 0;
              transform:
                translateY(240px)
                rotate(280deg);
            }
          }

          @media (max-width: 1200px) {
            .flower-field {
              grid-template-columns:
                repeat(6, minmax(0, 1fr));
              row-gap: 0;
            }

            .flower:nth-child(n + 7) {
              display: none;
            }
          }

          @media (
            prefers-reduced-motion: reduce
          ) {
            .flower,
            .bee-flight,
            .mini-bee-wing,
            .cloud,
            .meadow-sun,
            .sun-rays,
            .goal-glow,
            .goal-achieved-banner,
            .pollen-field span {
              animation: none;
            }
          }
        `}
      </style>
    </section>
  );
}

type FlowerProps = {
  index: number;
  state: FlowerState;
};

function Flower({
  index,
  state,
}: FlowerProps) {
  const flowerColors = [
    "#ef6b68",
    "#e99bc5",
    "#8b85df",
    "#efb14d",
    "#e56f95",
    "#77a9de",
  ];

  const petalColor =
    state === "golden"
      ? "#f2c742"
      : flowerColors[
          index % flowerColors.length
        ];

  const stemHeight =
    62 + (index % 4) * 11;

  const flowerSize =
    32 + (index % 3) * 5;

  return (
    <div
      className="flower"
      style={
        {
          "--stem-height": `${stemHeight}px`,
          "--flower-size": `${flowerSize}px`,
          "--petal-color": petalColor,
          "--sway-duration": `${
            3.8 + (index % 5) * 0.45
          }s`,
          "--sway-delay": `-${
            (index % 6) * 0.38
          }s`,
        } as React.CSSProperties
      }
    >
      <div className="flower-stem" />

      <div className="flower-leaf flower-leaf-left" />
      <div className="flower-leaf flower-leaf-right" />

      <div
        className={`flower-head state-${state}`}
      >
        {Array.from({ length: 6 }).map(
          (_, petalIndex) => (
            <span
              className="flower-petal"
              key={petalIndex}
            />
          ),
        )}

        <span className="flower-center" />
      </div>
    </div>
  );
}

function MiniBee() {
  return (
    <div
      className="mini-bee"
      aria-hidden="true"
    >
      <div className="mini-bee-wing mini-bee-wing-left" />
      <div className="mini-bee-wing mini-bee-wing-right" />
      <div className="mini-bee-body" />
      <div className="mini-bee-head" />
    </div>
  );
}

function getPerformanceLevel(
  percentage: number,
) {
  if (percentage >= 110) {
    return "exceeding";
  }

  if (percentage >= 100) {
    return "achieved";
  }

  if (percentage >= 75) {
    return "strong";
  }

  if (percentage >= 50) {
    return "on-pace";
  }

  if (percentage >= 25) {
    return "building";
  }

  return "starting";
}

function getLevelLabel(
  percentage: number,
) {
  if (percentage >= 110) {
    return "Exceeding Goal";
  }

  if (percentage >= 100) {
    return "Goal Achieved";
  }

  if (percentage >= 75) {
    return "Strong Progress";
  }

  if (percentage >= 50) {
    return "Building Strength";
  }

  if (percentage >= 25) {
    return "Momentum Building";
  }

  return "Week in Progress";
}

function getMeadowMessage(
  percentage: number,
  dayName: string,
) {
  if (percentage >= 110) {
    return `${dayName}: The hive is producing beyond its weekly target.`;
  }

  if (percentage >= 100) {
    return `${dayName}: The weekly liter goal has been achieved.`;
  }

  if (percentage >= 75) {
    return `${dayName}: The meadow is thriving as the hive approaches its target.`;
  }

  if (percentage >= 50) {
    return `${dayName}: Weekly production is building steadily.`;
  }

  if (percentage >= 25) {
    return `${dayName}: The first major production milestone is complete.`;
  }

  return `${dayName}: The hive is beginning its Sunday-to-Saturday journey.`;
}

function formatLiters(value: number) {
  return `${value.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} L`;
}