"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type Position = {
  x: number;
  y: number;
};

export default function BeezyStreakTour() {
  const containerRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const [
    activeIndex,
    setActiveIndex,
  ] = useState(0);

  const [
    position,
    setPosition,
  ] = useState<Position>({
    x: -130,
    y: 25,
  });

  const [
    visible,
    setVisible,
  ] = useState(false);

  const [
    highlighting,
    setHighlighting,
  ] = useState(false);

  /*
   * ==========================================
   * FIND ACTIVE STREAKERS
   * ==========================================
   */

  const getStreakers =
    useCallback(() => {
      return Array.from(
        document.querySelectorAll<HTMLElement>(
          '[data-streaker="true"]',
        ),
      );
    }, []);

  /*
   * ==========================================
   * CLEAR PREVIOUS HIGHLIGHT
   * ==========================================
   */

  const clearHighlights =
    useCallback(() => {
      const cards =
        document.querySelectorAll(
          ".worker-bee-card.beezy-highlight",
        );

      cards.forEach(
        (card) => {
          card.classList.remove(
            "beezy-highlight",
          );
        },
      );
    }, []);

  /*
   * ==========================================
   * POSITION BEEZY
   * ==========================================
   */

  const updatePosition =
    useCallback(() => {
      const container =
        containerRef.current;

      const streakers =
        getStreakers();

      if (
        !container ||
        streakers.length === 0
      ) {
        setVisible(
          false,
        );

        clearHighlights();

        return;
      }

      const safeIndex =
        activeIndex %
        streakers.length;

      const target =
        streakers[
          safeIndex
        ];

      const containerRect =
        container.getBoundingClientRect();

      const targetRect =
        target.getBoundingClientRect();

      /*
       * Beezy flies to the worker bee
       * side of the card rather than the
       * performance text side.
       */

      const x =
        targetRect.left -
        containerRect.left +
        targetRect.width *
          0.12;

      const y =
        targetRect.top -
        containerRect.top -
        22;

      setPosition({
        x,
        y,
      });

      setVisible(
        true,
      );

      setHighlighting(
        false,
      );

      clearHighlights();

      /*
       * Beezy lands first.
       * Then the streak ring flares.
       */

      const highlightTimer =
        window.setTimeout(
          () => {
            target.classList.add(
              "beezy-highlight",
            );

            setHighlighting(
              true,
            );
          },
          1450,
        );

      return () => {
        window.clearTimeout(
          highlightTimer,
        );
      };
    }, [
      activeIndex,
      clearHighlights,
      getStreakers,
    ]);

  /*
   * ==========================================
   * POSITION + RESIZE
   * ==========================================
   */

  useEffect(() => {
    const cleanup =
      updatePosition();

    const handleResize =
      () => {
        updatePosition();
      };

    window.addEventListener(
      "resize",
      handleResize,
    );

    return () => {
      cleanup?.();

      window.removeEventListener(
        "resize",
        handleResize,
      );
    };
  }, [
    updatePosition,
  ]);

  /*
   * ==========================================
   * TOUR LOOP
   * ==========================================
   *
   * Beezy visits each streaker for
   * roughly five seconds.
   */

  useEffect(() => {
    const timer =
      window.setInterval(
        () => {
          const streakers =
            getStreakers();

          if (
            streakers.length <= 1
          ) {
            return;
          }

          setActiveIndex(
            (current) =>
              (
                current + 1
              ) %
              streakers.length,
          );
        },
        5200,
      );

    return () => {
      window.clearInterval(
        timer,
      );

      clearHighlights();
    };
  }, [
    clearHighlights,
    getStreakers,
  ]);

  return (
    <div
      ref={
        containerRef
      }
      className="beezy-tour-layer"
      aria-hidden="true"
    >
      {visible && (
        <div
          className={`beezy-tour ${
            highlighting
              ? "beezy-tour-highlighting"
              : "beezy-tour-flying"
          }`}
          style={{
            transform: `translate3d(
              ${position.x}px,
              ${position.y}px,
              0
            )`,
          }}
        >
          <div className="beezy-flight-aura" />

          <img
            src="/images/beezy-flying.png"
            alt=""
            className="beezy-tour-image"
          />

          <div className="beezy-flight-trail">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>

          <div className="beezy-hex-trail">
            <span />
            <span />
            <span />
          </div>
        </div>
      )}

      <style>
        {`
          .beezy-tour-layer {
            position: absolute;

            z-index: 60;

            inset: 0;

            overflow: hidden;

            pointer-events: none;
          }

          .beezy-tour {
            position: absolute;

            top: 0;
            left: 0;

            width: 112px;

            transform-origin:
              center;

            transition:
              transform
              1.4s
              cubic-bezier(
                0.22,
                1,
                0.36,
                1
              );

            will-change:
              transform;
          }

          /*
           * ====================================
           * FLYING BEEZY
           * ====================================
           */

          .beezy-tour-image {
            position: relative;

            z-index: 5;

            display: block;

            width: 112px;
            height: auto;

            object-fit:
              contain;

            filter:
              drop-shadow(
                0 7px 8px
                rgba(
                  72,
                  42,
                  2,
                  0.34
                )
              )
              drop-shadow(
                0 0 14px
                rgba(
                  255,
                  177,
                  25,
                  0.38
                )
              );

            transform:
              rotate(
                -8deg
              );
          }

          /*
           * ====================================
           * AURA
           * ====================================
           */

          .beezy-flight-aura {
            position: absolute;

            z-index: 1;

            top: 48%;
            left: 49%;

            width: 100px;
            height: 72px;

            border-radius:
              50%;

            transform:
              translate(
                -50%,
                -50%
              );

            background:
              radial-gradient(
                ellipse,
                rgba(
                  255,
                  218,
                  84,
                  0.34
                ),
                rgba(
                  246,
                  166,
                  24,
                  0.16
                )
                45%,
                transparent
                72%
              );

            filter:
              blur(
                8px
              );

            opacity: 0.72;

            transition:
              opacity
              300ms ease,
              transform
              300ms ease;
          }

          /*
           * ====================================
           * FLYING STATE
           * ====================================
           */

          .beezy-tour-flying
          .beezy-tour-image {
            animation:
              beezyFlightBob
              0.56s
              ease-in-out
              infinite
              alternate;
          }

          .beezy-tour-flying
          .beezy-flight-aura {
            opacity: 0.56;
          }

          /*
           * ====================================
           * INSPECTION / HIGHLIGHT STATE
           * ====================================
           */

          .beezy-tour-highlighting
          .beezy-tour-image {
            animation:
              beezyInspectionHover
              1.35s
              ease-in-out
              infinite;
          }

          .beezy-tour-highlighting
          .beezy-flight-aura {
            opacity: 1;

            transform:
              translate(
                -50%,
                -50%
              )
              scale(
                1.15
              );
          }

          /*
           * ====================================
           * GOLDEN TRAIL
           * ====================================
           */

          .beezy-flight-trail {
            position: absolute;

            z-index: 2;

            top: 60%;
            right: 82%;

            display: flex;

            align-items:
              center;

            gap: 5px;

            transform:
              rotate(
                5deg
              );
          }

          .beezy-flight-trail span {
            display: block;

            border-radius:
              50%;

            background:
              linear-gradient(
                145deg,
                #fff2a5,
                #f5a61c
              );

            box-shadow:
              0 0 8px
              rgba(
                246,
                178,
                31,
                0.8
              );

            animation:
              trailPulse
              0.85s
              ease-in-out
              infinite;
          }

          .beezy-flight-trail span:nth-child(
            1
          ) {
            width: 7px;
            height: 7px;

            animation-delay:
              0s;
          }

          .beezy-flight-trail span:nth-child(
            2
          ) {
            width: 6px;
            height: 6px;

            opacity: 0.86;

            animation-delay:
              -0.12s;
          }

          .beezy-flight-trail span:nth-child(
            3
          ) {
            width: 5px;
            height: 5px;

            opacity: 0.72;

            animation-delay:
              -0.24s;
          }

          .beezy-flight-trail span:nth-child(
            4
          ) {
            width: 4px;
            height: 4px;

            opacity: 0.58;

            animation-delay:
              -0.36s;
          }

          .beezy-flight-trail span:nth-child(
            5
          ) {
            width: 3px;
            height: 3px;

            opacity: 0.42;

            animation-delay:
              -0.48s;
          }

          /*
           * ====================================
           * HEX PARTICLES
           * ====================================
           */

          .beezy-hex-trail {
            position: absolute;

            z-index: 2;

            top: 34%;
            right: 92%;

            display: flex;

            gap: 9px;

            align-items:
              center;
          }

          .beezy-hex-trail span {
            display: block;

            width: 10px;
            height: 9px;

            border:
              1px solid
              rgba(
                255,
                194,
                47,
                0.8
              );

            background:
              rgba(
                255,
                206,
                65,
                0.16
              );

            clip-path:
              polygon(
                25% 0,
                75% 0,
                100% 50%,
                75% 100%,
                25% 100%,
                0 50%
              );

            box-shadow:
              0 0 7px
              rgba(
                255,
                188,
                34,
                0.45
              );

            animation:
              hexFloat
              1.6s
              ease-in-out
              infinite;
          }

          .beezy-hex-trail span:nth-child(
            2
          ) {
            width: 8px;
            height: 7px;

            opacity: 0.68;

            animation-delay:
              -0.45s;
          }

          .beezy-hex-trail span:nth-child(
            3
          ) {
            width: 6px;
            height: 5px;

            opacity: 0.42;

            animation-delay:
              -0.8s;
          }

          /*
           * ====================================
           * ANIMATIONS
           * ====================================
           */

          @keyframes beezyFlightBob {
            from {
              margin-top:
                -3px;

              transform:
                rotate(
                  -10deg
                )
                scale(
                  0.98
                );
            }

            to {
              margin-top:
                4px;

              transform:
                rotate(
                  -6deg
                )
                scale(
                  1.02
                );
            }
          }

          @keyframes beezyInspectionHover {
            0%,
            100% {
              margin-top: 0;

              transform:
                rotate(
                  -4deg
                )
                translateY(
                  0
                );
            }

            50% {
              margin-top:
                -6px;

              transform:
                rotate(
                  2deg
                )
                translateY(
                  -2px
                );
            }
          }

          @keyframes trailPulse {
            0%,
            100% {
              opacity: 0.28;

              transform:
                scale(
                  0.62
                );
            }

            50% {
              opacity: 1;

              transform:
                scale(
                  1.22
                );
            }
          }

          @keyframes hexFloat {
            0%,
            100% {
              transform:
                translateY(
                  2px
                )
                rotate(
                  0deg
                );
            }

            50% {
              transform:
                translateY(
                  -5px
                )
                rotate(
                  12deg
                );
            }
          }

          /*
           * ====================================
           * RESPONSIVE
           * ====================================
           */

          @media (
            max-width: 1100px
          ) {
            .beezy-tour {
              width: 98px;
            }

            .beezy-tour-image {
              width: 98px;
            }
          }

          @media (
            max-width: 700px
          ) {
            .beezy-tour {
              width: 88px;
            }

            .beezy-tour-image {
              width: 88px;
            }

            .beezy-flight-trail,
            .beezy-hex-trail {
              display: none;
            }
          }

          @media (
            prefers-reduced-motion:
              reduce
          ) {
            .beezy-tour {
              transition: none;
            }

            .beezy-tour-image,
            .beezy-flight-trail span,
            .beezy-hex-trail span {
              animation: none !important;
            }
          }
        `}
      </style>
    </div>
  );
}