"use client";

type BeezyProps = {
  size?: number;
  className?: string;
  alt?: string;
};

export default function Beezy({
  size = 150,
  className = "",
  alt = "Beezy - Riviera BEEch 115 mascot",
}: BeezyProps) {
  return (
    <img
      src="/images/beezy.png"
      alt={alt}
      className={className}
      style={{
        width: size,
        height: "auto",
        objectFit: "contain",
        display: "block",
      }}
    />
  );
}