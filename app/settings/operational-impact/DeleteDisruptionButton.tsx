"use client";

import { useState } from "react";

import {
  deleteOperationalDisruption,
} from "./actions";

type DeleteDisruptionButtonProps = {
  disruptionId: number;
  title: string;
};

export default function DeleteDisruptionButton({
  disruptionId,
  title,
}: DeleteDisruptionButtonProps) {
  const [confirming, setConfirming] =
    useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() =>
          setConfirming(true)
        }
        style={deleteButtonStyle}
      >
        Delete Record
      </button>
    );
  }

  return (
    <div style={confirmationBoxStyle}>
      <div>
        <strong>
          Permanently delete this
          record?
        </strong>

        <p style={messageStyle}>
          “{title}” will be removed
          from HIVE and cannot be
          restored.
        </p>
      </div>

      <div style={buttonRowStyle}>
        <form
          action={
            deleteOperationalDisruption
          }
        >
          <input
            type="hidden"
            name="disruptionId"
            value={disruptionId}
          />

          <button
            type="submit"
            style={
              confirmDeleteButtonStyle
            }
          >
            Yes, Delete Permanently
          </button>
        </form>

        <button
          type="button"
          onClick={() =>
            setConfirming(false)
          }
          style={cancelButtonStyle}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

const deleteButtonStyle = {
  padding: "9px 14px",
  borderRadius: "9px",
  cursor: "pointer",
  fontWeight: 800,
  border:
    "1px solid rgba(239, 68, 68, 0.5)",
  background:
    "rgba(127, 29, 29, 0.16)",
  color: "#fecaca",
} as const;

const confirmationBoxStyle = {
  marginTop: "8px",
  padding: "14px",
  borderRadius: "10px",
  border:
    "1px solid rgba(239, 68, 68, 0.45)",
  background:
    "rgba(127, 29, 29, 0.16)",
} as const;

const messageStyle = {
  margin: "5px 0 0",
  fontSize: "13px",
  lineHeight: 1.5,
  opacity: 0.8,
} as const;

const buttonRowStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginTop: "12px",
} as const;

const confirmDeleteButtonStyle = {
  padding: "9px 14px",
  borderRadius: "9px",
  border: 0,
  cursor: "pointer",
  fontWeight: 900,
  background: "#dc2626",
  color: "#ffffff",
} as const;

const cancelButtonStyle = {
  padding: "9px 14px",
  borderRadius: "9px",
  cursor: "pointer",
  fontWeight: 800,
  border:
    "1px solid rgba(148, 163, 184, 0.35)",
  background: "transparent",
  color: "inherit",
} as const;