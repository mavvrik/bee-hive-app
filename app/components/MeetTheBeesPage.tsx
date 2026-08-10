"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

export type MeetTheBeesProfile = {
  id: number;

  name: string;
  preferredName: string | null;

  role: string;
  profileTitle: string | null;

  bio: string | null;
  funFact: string | null;

  photoUrl: string | null;

  isEmployeeOfMonth: boolean;
  recognitionMessage: string | null;
};

type MeetTheBeesPageProps = {
  centerName: string;
  bees: MeetTheBeesProfile[];
};

function getDisplayName(
  bee: MeetTheBeesProfile,
) {
  return (
    bee.preferredName ||
    bee.name
  );
}

function getProfileTitle(
  bee: MeetTheBeesProfile,
) {
  if (bee.profileTitle) {
    return bee.profileTitle;
  }

  if (
    bee.role
      .toLowerCase()
      .includes("management")
  ) {
    return "Hive Leadership";
  }

  if (
    bee.role
      .toLowerCase()
      .includes("lead")
  ) {
    return "Hive Team Lead";
  }

  if (
    bee.role
      .toLowerCase()
      .includes("phlebotomist")
  ) {
    return "Donor Experience Team";
  }

  return bee.role;
}

export default function MeetTheBeesPage({
  centerName,
  bees,
}: MeetTheBeesPageProps) {
  /*
   * Employee of the Month appears first,
   * followed by normal display order.
   */
  const orderedBees =
    useMemo(() => {
      return [...bees].sort(
        (a, b) =>
          Number(
            b.isEmployeeOfMonth,
          ) -
          Number(
            a.isEmployeeOfMonth,
          ),
      );
    }, [bees]);

  const [
    activeBeeIndex,
    setActiveBeeIndex,
  ] = useState(0);

  /*
   * Each employee remains on screen for
   * five seconds.
   *
   * With eight profiles, a complete pass
   * takes about 40 seconds — fitting nicely
   * inside the main Hive dashboard's
   * configurable page rotation.
   */
  useEffect(() => {
    setActiveBeeIndex(0);

    if (
      orderedBees.length <= 1
    ) {
      return;
    }

    const timer =
      window.setInterval(() => {
        setActiveBeeIndex(
          (current) =>
            (current + 1) %
            orderedBees.length,
        );
      }, 5000);

    return () => {
      window.clearInterval(
        timer,
      );
    };
  }, [orderedBees.length]);

  const activeBee =
    orderedBees[
      activeBeeIndex
    ] ?? null;

  if (!activeBee) {
    return (
      <section className="meet-bees-page empty-beach">
        <BeachBackground />

        <div className="empty-beach-card">
          <span className="empty-bee">
            🐝
          </span>

          <p className="beach-eyebrow">
            Riviera BEEch
          </p>

          <h1>
            Meet the Bees
          </h1>

          <p>
            Worker Bee profiles will
            appear here once they are
            enabled in Administration.
          </p>
        </div>

        <MeetTheBeesStyles />
      </section>
    );
  }

  const displayName =
    getDisplayName(
      activeBee,
    );

  const profileTitle =
    getProfileTitle(
      activeBee,
    );

  return (
    <section className="meet-bees-page">
      <BeachBackground />

      <div
        className="sun-glow"
        aria-hidden="true"
      />

      <div
        className="floating-bee bee-a"
        aria-hidden="true"
      >
        🐝
      </div>

      <div
        className="floating-bee bee-b"
        aria-hidden="true"
      >
        🐝
      </div>

      <div
        className="floating-bee bee-c"
        aria-hidden="true"
      >
        🐝
      </div>

      <header className="meet-bees-header">
        <div>
          <p className="beach-eyebrow">
            Welcome to Riviera BEEch
          </p>

          <h1>
            Meet the Bees
          </h1>

          <p className="center-name">
            {centerName}
          </p>
        </div>

        <div className="beach-brand">
          <span className="brand-bee">
            🐝
          </span>

          <div>
            <strong>
              RIVIERA BEEch
            </strong>

            <small>
              Where the Hive meets
              the shore
            </small>
          </div>
        </div>
      </header>

      <main className="bee-profile-stage">
        <section
          className={`bee-photo-panel ${
            activeBee.isEmployeeOfMonth
              ? "featured-worker"
              : ""
          }`}
        >
          {activeBee.isEmployeeOfMonth && (
            <div className="employee-ribbon">
              <span>🏆</span>

              Employee of the Month
            </div>
          )}

          <div className="photo-frame">
            {activeBee.photoUrl ? (
              <img
                src={
                  activeBee.photoUrl
                }
                alt={displayName}
                className="worker-photo"
              />
            ) : (
              <div className="photo-placeholder">
                <div className="placeholder-bee">
                  🐝
                </div>

                <span>
                  Photo Coming Soon
                </span>
              </div>
            )}

            <div
              className="photo-honeycomb"
              aria-hidden="true"
            >
              <span />
              <span />
              <span />
            </div>
          </div>

          <div className="name-plate">
            <p>
              Worker Bee
            </p>

            <h2>
              {displayName}
            </h2>

            <strong>
              {profileTitle}
            </strong>
          </div>
        </section>

        <section className="bee-story-panel">
          <div className="story-top">
            <p className="story-eyebrow">
              Meet Your Hive
            </p>

            <h2>
              Say hello to{" "}
              {displayName}
            </h2>
          </div>

          <div className="bio-card">
            <span className="card-icon">
              🍯
            </span>

            <div>
              <p className="card-label">
                About This Bee
              </p>

              <p className="bio-copy">
                {activeBee.bio ||
                  `${displayName} is a valued member of the ${centerName} Hive, helping create a welcoming and successful donor experience every day.`}
              </p>
            </div>
          </div>

          <div className="story-card-grid">
            <article className="story-card">
              <span className="story-icon">
                🐝
              </span>

              <div>
                <p className="card-label">
                  Role
                </p>

                <strong>
                  {
                    activeBee.role
                  }
                </strong>
              </div>
            </article>

            <article className="story-card">
              <span className="story-icon">
                🌴
              </span>

              <div>
                <p className="card-label">
                  Fun Fact
                </p>

                <strong>
                  {activeBee.funFact ||
                    "More buzz coming soon!"}
                </strong>
              </div>
            </article>
          </div>

          {activeBee.isEmployeeOfMonth ? (
            <div className="recognition-card">
              <div className="recognition-badge">
                🏆
              </div>

              <div>
                <p className="recognition-label">
                  Hive Recognition
                </p>

                <h3>
                  Employee of the
                  Month
                </h3>

                <p>
                  {activeBee.recognitionMessage ||
                    `${displayName} is being recognized for an outstanding contribution to the Hive.`}
                </p>
              </div>
            </div>
          ) : (
            <div className="hive-message">
              <span>
                💛
              </span>

              <div>
                <strong>
                  One Team. One Hive.
                </strong>

                <p>
                  Every Worker Bee helps
                  make Riviera BEEch a
                  better donor experience.
                </p>
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="meet-bees-footer">
        <div className="profile-progress">
          <span>
            Bee{" "}
            {activeBeeIndex + 1}{" "}
            of{" "}
            {
              orderedBees.length
            }
          </span>

          <div className="profile-dots">
            {orderedBees.map(
              (bee, index) => (
                <span
                  key={bee.id}
                  className={
                    index ===
                    activeBeeIndex
                      ? "profile-dot active"
                      : "profile-dot"
                  }
                />
              ),
            )}
          </div>
        </div>

        <div className="shoreline-message">
          🌊 Riviera BEEch •{" "}
          <strong>
            Where Every Bee
            Matters
          </strong>
        </div>
      </footer>

      <MeetTheBeesStyles />
    </section>
  );
}

function BeachBackground() {
  return (
    <div
      className="beach-background"
      aria-hidden="true"
    >
      <div className="sky-layer" />

      <div className="ocean-layer">
        <div className="wave wave-one" />
        <div className="wave wave-two" />
        <div className="wave wave-three" />
      </div>

      <div className="sand-layer" />

      <div className="palm-tree">
        <div className="palm-trunk" />

        <span className="palm-leaf leaf-one" />
        <span className="palm-leaf leaf-two" />
        <span className="palm-leaf leaf-three" />
        <span className="palm-leaf leaf-four" />
        <span className="palm-leaf leaf-five" />
      </div>
    </div>
  );
}

function MeetTheBeesStyles() {
  return (
    <style>
      {`
        .meet-bees-page {
          position: relative;

          width: 100%;
          height: 100%;

          min-width: 0;
          min-height: 0;

          overflow: hidden;

          padding: clamp(
            18px,
            2vw,
            34px
          );

          background: #dff7ff;

          font-family:
            Arial,
            Helvetica,
            sans-serif;

          color: #382707;

          box-sizing: border-box;
        }

        .beach-background {
          position: absolute;

          inset: 0;

          overflow: hidden;

          pointer-events: none;
        }

        .sky-layer {
          position: absolute;

          inset: 0 0 38% 0;

          background:
            radial-gradient(
              circle at 76% 17%,
              rgba(
                255,
                238,
                132,
                0.98
              )
              0 6%,
              rgba(
                255,
                238,
                132,
                0.27
              )
              7% 15%,
              transparent 27%
            ),
            linear-gradient(
              180deg,
              #bdeeff 0%,
              #e9fbff 100%
            );
        }

        .sun-glow {
          position: absolute;

          top: -7vw;
          right: -4vw;

          width: 25vw;
          height: 25vw;

          border-radius: 50%;

          background:
            radial-gradient(
              circle,
              rgba(
                255,
                224,
                80,
                0.42
              ),
              transparent 68%
            );

          pointer-events: none;
        }

        .ocean-layer {
          position: absolute;

          right: 0;
          bottom: 12%;
          left: 0;

          height: 34%;

          background:
            linear-gradient(
              180deg,
              #58cbe2,
              #1589ad
            );
        }

        .wave {
          position: absolute;

          left: -5%;

          width: 110%;
          height: 36px;

          border-radius: 50%;

          background:
            rgba(
              255,
              255,
              255,
              0.72
            );
        }

        .wave-one {
          top: -13px;

          animation:
            beachWaveOne
            5s ease-in-out
            infinite alternate;
        }

        .wave-two {
          top: 15px;

          opacity: 0.46;

          animation:
            beachWaveTwo
            6.5s ease-in-out
            infinite alternate;
        }

        .wave-three {
          top: 42px;

          opacity: 0.25;

          animation:
            beachWaveOne
            8s ease-in-out
            infinite alternate-reverse;
        }

        @keyframes beachWaveOne {
          from {
            transform:
              translateX(-2%);
          }

          to {
            transform:
              translateX(2%);
          }
        }

        @keyframes beachWaveTwo {
          from {
            transform:
              translateX(2%);
          }

          to {
            transform:
              translateX(-3%);
          }
        }

        .sand-layer {
          position: absolute;

          right: 0;
          bottom: 0;
          left: 0;

          height: 17%;

          background:
            linear-gradient(
              180deg,
              #f4d488,
              #dcb36b
            );
        }

        .palm-tree {
          position: absolute;

          right: 4%;
          bottom: 10%;

          width: 170px;
          height: 260px;

          opacity: 0.14;

          transform:
            rotate(3deg);
        }

        .palm-trunk {
          position: absolute;

          right: 70px;
          bottom: 0;

          width: 25px;
          height: 190px;

          border-radius:
            60% 50% 20% 30%;

          background: #694211;

          transform:
            rotate(8deg);
        }

        .palm-leaf {
          position: absolute;

          top: 35px;
          right: 73px;

          width: 105px;
          height: 24px;

          border-radius:
            100% 0 100% 0;

          background: #267a40;

          transform-origin:
            right center;
        }

        .leaf-one {
          transform:
            rotate(-45deg);
        }

        .leaf-two {
          transform:
            rotate(-15deg);
        }

        .leaf-three {
          transform:
            rotate(20deg);
        }

        .leaf-four {
          transform:
            rotate(55deg);
        }

        .leaf-five {
          transform:
            rotate(88deg);
        }

        .meet-bees-header {
          position: relative;
          z-index: 5;

          display: flex;

          align-items:
            flex-start;

          justify-content:
            space-between;

          gap: 30px;

          height: 15%;

          min-height: 105px;
        }

        .beach-eyebrow {
          margin: 0 0 4px;

          color: #c18100;

          font-size: clamp(
            0.68rem,
            0.9vw,
            1rem
          );

          font-weight: 1000;

          letter-spacing:
            0.18em;

          text-transform:
            uppercase;
        }

        .meet-bees-header h1 {
          margin: 0;

          color: #3b2905;

          font-size: clamp(
            2.3rem,
            4.3vw,
            4.7rem
          );

          line-height: 0.95;

          letter-spacing:
            -0.04em;
        }

        .center-name {
          margin: 8px 0 0;

          color: #6f5b2b;

          font-size: clamp(
            0.9rem,
            1.3vw,
            1.35rem
          );

          font-weight: 800;
        }

        .beach-brand {
          display: flex;

          align-items: center;

          gap: 13px;

          padding:
            12px 17px;

          border:
            1px solid
            rgba(
              194,
              143,
              17,
              0.42
            );

          border-radius: 17px;

          background:
            rgba(
              255,
              255,
              255,
              0.78
            );

          box-shadow:
            0 8px 26px
            rgba(
              37,
              98,
              111,
              0.09
            );

          backdrop-filter:
            blur(10px);
        }

        .brand-bee {
          font-size: clamp(
            1.8rem,
            2.5vw,
            2.8rem
          );
        }

        .beach-brand strong,
        .beach-brand small {
          display: block;
        }

        .beach-brand strong {
          color: #ba7800;

          font-size: clamp(
            0.9rem,
            1.25vw,
            1.3rem
          );
        }

        .beach-brand small {
          margin-top: 2px;

          color: #52727a;

          font-weight: 700;
        }

        .bee-profile-stage {
          position: relative;
          z-index: 4;

          display: grid;

          grid-template-columns:
            minmax(300px, 0.9fr)
            minmax(0, 1.4fr);

          gap: clamp(
            22px,
            3vw,
            46px
          );

          height: 72%;

          min-height: 0;

          align-items: stretch;
        }

        .bee-photo-panel,
        .bee-story-panel {
          min-width: 0;
          min-height: 0;
        }

        .bee-photo-panel {
          position: relative;

          display: flex;

          flex-direction:
            column;

          align-items: center;

          justify-content:
            center;

          padding: 18px;

          border:
            1px solid
            rgba(
              206,
              155,
              25,
              0.48
            );

          border-radius: 28px;

          background:
            linear-gradient(
              150deg,
              rgba(
                255,
                255,
                255,
                0.94
              ),
              rgba(
                255,
                243,
                184,
                0.88
              )
            );

          box-shadow:
            0 18px 42px
            rgba(
              61,
              82,
              67,
              0.16
            );

          backdrop-filter:
            blur(9px);
        }

        .bee-photo-panel.featured-worker {
          border:
            3px solid
            rgba(
              210,
              148,
              0,
              0.82
            );

          box-shadow:
            0 0 36px
              rgba(
                255,
                194,
                27,
                0.25
              ),
            0 18px 42px
              rgba(
                61,
                82,
                67,
                0.16
              );
        }

        .employee-ribbon {
          position: absolute;
          z-index: 5;

          top: 14px;
          left: 14px;

          display: flex;

          align-items: center;

          gap: 7px;

          padding:
            8px 12px;

          border-radius: 999px;

          background:
            linear-gradient(
              135deg,
              #ffde67,
              #d89500
            );

          color: #533700;

          font-size: clamp(
            0.62rem,
            0.8vw,
            0.82rem
          );

          font-weight: 1000;

          text-transform:
            uppercase;

          box-shadow:
            0 5px 13px
            rgba(
              131,
              83,
              0,
              0.2
            );
        }

        .photo-frame {
          position: relative;

          display: grid;

          place-items: center;

          width: min(
            100%,
            350px
          );

          aspect-ratio: 1 / 1;

          overflow: hidden;

          border:
            7px solid #fff9dc;

          border-radius: 50%;

          background:
            linear-gradient(
              135deg,
              #fff7c6,
              #c9f2f9
            );

          box-shadow:
            0 13px 30px
            rgba(
              47,
              83,
              85,
              0.16
            );
        }

        .worker-photo {
          width: 100%;
          height: 100%;

          object-fit: cover;
        }

        .photo-placeholder {
          display: flex;

          flex-direction:
            column;

          align-items: center;

          justify-content:
            center;

          gap: 9px;

          width: 100%;
          height: 100%;

          color: #836415;

          font-size: 0.78rem;
          font-weight: 900;

          text-transform:
            uppercase;
        }

        .placeholder-bee {
          font-size: clamp(
            4rem,
            7vw,
            7rem
          );

          animation:
            beachBeeFloat
            3.4s ease-in-out
            infinite;
        }

        .photo-honeycomb {
          position: absolute;

          right: 6%;
          bottom: 9%;

          display: flex;

          gap: 3px;
        }

        .photo-honeycomb span {
          width: 16px;
          height: 14px;

          background:
            rgba(
              236,
              174,
              24,
              0.68
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
        }

        .name-plate {
          width: 100%;

          margin-top: 13px;

          text-align: center;
        }

        .name-plate p {
          margin: 0;

          color: #ba7c00;

          font-size: 0.62rem;
          font-weight: 1000;

          letter-spacing:
            0.15em;

          text-transform:
            uppercase;
        }

        .name-plate h2 {
          margin: 3px 0 2px;

          overflow: hidden;

          color: #342407;

          font-size: clamp(
            1.7rem,
            2.5vw,
            2.8rem
          );

          line-height: 1;

          text-overflow:
            ellipsis;

          white-space: nowrap;
        }

        .name-plate strong {
          color: #567078;

          font-size: clamp(
            0.75rem,
            1vw,
            1rem
          );

          text-transform:
            uppercase;
        }

        .bee-story-panel {
          display: flex;

          flex-direction:
            column;

          justify-content:
            center;

          gap: 12px;

          padding:
            clamp(
              14px,
              1.8vw,
              24px
            );

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.78
            );

          border-radius: 28px;

          background:
            rgba(
              255,
              255,
              255,
              0.78
            );

          box-shadow:
            0 18px 42px
            rgba(
              46,
              82,
              88,
              0.12
            );

          backdrop-filter:
            blur(14px);
        }

        .story-eyebrow,
        .card-label,
        .recognition-label {
          margin: 0;

          color: #b87c00;

          font-size: clamp(
            0.55rem,
            0.7vw,
            0.72rem
          );

          font-weight: 1000;

          letter-spacing:
            0.12em;

          text-transform:
            uppercase;
        }

        .story-top h2 {
          margin: 3px 0 0;

          color: #352608;

          font-size: clamp(
            1.5rem,
            2.5vw,
            2.8rem
          );

          line-height: 1;
        }

        .bio-card,
        .story-card,
        .hive-message,
        .recognition-card {
          border:
            1px solid
            rgba(
              214,
              185,
              97,
              0.44
            );

          border-radius: 16px;

          background:
            rgba(
              255,
              252,
              238,
              0.9
            );
        }

        .bio-card {
          display: grid;

          grid-template-columns:
            auto 1fr;

          gap: 12px;

          align-items:
            flex-start;

          padding: 14px;
        }

        .card-icon,
        .story-icon {
          font-size: clamp(
            1.4rem,
            2vw,
            2rem
          );
        }

        .bio-copy {
          margin: 5px 0 0;

          color: #625633;

          font-size: clamp(
            0.78rem,
            1.02vw,
            1.08rem
          );

          font-weight: 650;

          line-height: 1.45;
        }

        .story-card-grid {
          display: grid;

          grid-template-columns:
            repeat(
              2,
              minmax(0, 1fr)
            );

          gap: 10px;
        }

        .story-card {
          display: grid;

          grid-template-columns:
            auto 1fr;

          gap: 10px;

          align-items: center;

          min-width: 0;

          padding: 13px;
        }

        .story-card strong {
          display: block;

          margin-top: 4px;

          overflow: hidden;

          color: #493714;

          font-size: clamp(
            0.72rem,
            0.92vw,
            0.98rem
          );

          line-height: 1.2;

          text-overflow:
            ellipsis;
        }

        .recognition-card {
          display: grid;

          grid-template-columns:
            auto 1fr;

          gap: 13px;

          align-items: center;

          padding: 14px;

          border-color:
            #deb039;

          background:
            linear-gradient(
              135deg,
              #fff4b9,
              #ffe393
            );

          box-shadow:
            0 7px 18px
            rgba(
              184,
              125,
              0,
              0.12
            );
        }

        .recognition-badge {
          display: grid;

          width: 54px;
          height: 54px;

          place-items: center;

          border-radius: 15px;

          background:
            rgba(
              255,
              255,
              255,
              0.7
            );

          font-size: 1.8rem;
        }

        .recognition-card h3 {
          margin: 3px 0;

          color: #5e4200;

          font-size: clamp(
            1rem,
            1.35vw,
            1.35rem
          );
        }

        .recognition-card p:not(
          .recognition-label
        ) {
          margin: 0;

          color: #75591a;

          font-size: clamp(
            0.72rem,
            0.88vw,
            0.94rem
          );

          font-weight: 700;

          line-height: 1.35;
        }

        .hive-message {
          display: flex;

          align-items: center;

          gap: 11px;

          padding: 13px 14px;

          background:
            linear-gradient(
              135deg,
              #fff8da,
              #f4fbef
            );
        }

        .hive-message > span {
          font-size: 1.6rem;
        }

        .hive-message strong {
          display: block;

          color: #574007;

          font-size: clamp(
            0.8rem,
            1vw,
            1rem
          );
        }

        .hive-message p {
          margin: 3px 0 0;

          color: #746640;

          font-size: clamp(
            0.65rem,
            0.8vw,
            0.82rem
          );
        }

        .meet-bees-footer {
          position: relative;
          z-index: 5;

          display: flex;

          align-items: center;

          justify-content:
            space-between;

          gap: 20px;

          height: 10%;

          min-height: 55px;

          color: #4c4d34;

          font-size: clamp(
            0.66rem,
            0.85vw,
            0.9rem
          );

          font-weight: 800;
        }

        .profile-progress {
          display: flex;

          align-items: center;

          gap: 12px;
        }

        .profile-dots {
          display: flex;

          align-items: center;

          gap: 5px;
        }

        .profile-dot {
          width: 7px;
          height: 7px;

          border-radius: 50%;

          background:
            rgba(
              110,
              89,
              33,
              0.25
            );

          transition:
            transform 0.25s ease,
            background 0.25s ease;
        }

        .profile-dot.active {
          background: #d59600;

          transform:
            scale(1.45);
        }

        .shoreline-message strong {
          color: #916400;
        }

        .floating-bee {
          position: absolute;
          z-index: 3;

          font-size: clamp(
            1rem,
            1.7vw,
            1.8rem
          );

          pointer-events: none;
        }

        .bee-a {
          top: 19%;
          left: 46%;

          animation:
            flyingBeeOne
            7s ease-in-out
            infinite;
        }

        .bee-b {
          right: 9%;
          bottom: 23%;

          animation:
            flyingBeeTwo
            8.5s ease-in-out
            infinite;
        }

        .bee-c {
          left: 4%;
          bottom: 18%;

          opacity: 0.65;

          animation:
            flyingBeeTwo
            10s ease-in-out
            infinite reverse;
        }

        @keyframes beachBeeFloat {
          0%,
          100% {
            transform:
              translateY(4px)
              rotate(-2deg);
          }

          50% {
            transform:
              translateY(-8px)
              rotate(3deg);
          }
        }

        @keyframes flyingBeeOne {
          0%,
          100% {
            transform:
              translate(0, 0)
              rotate(-8deg);
          }

          50% {
            transform:
              translate(
                45px,
                -25px
              )
              rotate(12deg);
          }
        }

        @keyframes flyingBeeTwo {
          0%,
          100% {
            transform:
              translate(0, 0);
          }

          50% {
            transform:
              translate(
                -28px,
                -18px
              );
          }
        }

        .empty-beach {
          display: grid;

          place-items: center;
        }

        .empty-beach-card {
          position: relative;
          z-index: 10;

          max-width: 560px;

          padding: 42px;

          border:
            1px solid
            rgba(
              205,
              167,
              58,
              0.5
            );

          border-radius: 28px;

          background:
            rgba(
              255,
              255,
              255,
              0.88
            );

          text-align: center;

          box-shadow:
            0 20px 45px
            rgba(
              36,
              80,
              87,
              0.14
            );
        }

        .empty-bee {
          display: block;

          margin-bottom: 12px;

          font-size: 4rem;
        }

        .empty-beach-card h1 {
          margin: 0;

          color: #3c2a07;

          font-size: 2.8rem;
        }

        .empty-beach-card p:last-child {
          color: #746541;

          line-height: 1.5;
        }

        @media (
          max-width: 950px
        ) {
          .meet-bees-page {
            overflow: auto;
          }

          .meet-bees-header {
            height: auto;
          }

          .bee-profile-stage {
            grid-template-columns:
              1fr;

            height: auto;
          }

          .photo-frame {
            width: 270px;
          }

          .meet-bees-footer {
            height: auto;

            padding-top: 18px;
          }
        }

        @media (
          max-width: 650px
        ) {
          .meet-bees-header,
          .meet-bees-footer {
            align-items:
              flex-start;

            flex-direction:
              column;
          }

          .beach-brand {
            display: none;
          }

          .story-card-grid {
            grid-template-columns:
              1fr;
          }

          .shoreline-message {
            display: none;
          }
        }

        @media (
          prefers-reduced-motion:
            reduce
        ) {
          .wave,
          .floating-bee,
          .placeholder-bee {
            animation: none;
          }
        }
      `}
    </style>
  );
}