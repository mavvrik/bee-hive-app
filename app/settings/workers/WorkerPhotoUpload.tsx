"use client";

import {
  upload,
} from "@vercel/blob/client";

import {
  ChangeEvent,
  useState,
} from "react";

type WorkerPhotoUploadProps = {
  workerId: number;
  workerName: string;
  initialPhotoUrl:
    | string
    | null;
};

export default function WorkerPhotoUpload({
  workerId,
  workerName,
  initialPhotoUrl,
}: WorkerPhotoUploadProps) {
  const [
    photoUrl,
    setPhotoUrl,
  ] = useState(
    initialPhotoUrl ?? "",
  );

  const [
    selectedFile,
    setSelectedFile,
  ] = useState<File | null>(
    null,
  );

  const [
    previewUrl,
    setPreviewUrl,
  ] = useState(
    initialPhotoUrl ?? "",
  );

  const [
    isUploading,
    setIsUploading,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  function handleFileSelection(
    event:
      ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(
        file.type,
      )
    ) {
      setMessage(
        "Please choose a JPG, PNG, or WebP image.",
      );

      event.target.value = "";

      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setMessage(
        "Please choose an image smaller than 5 MB.",
      );

      event.target.value = "";

      return;
    }

    setSelectedFile(file);

    setPreviewUrl(
      URL.createObjectURL(
        file,
      ),
    );

    setMessage(
      "Photo selected. Click Upload Photo.",
    );
  }

  async function handleUpload() {
    if (!selectedFile) {
      setMessage(
        "Choose a photo first.",
      );

      return;
    }

    try {
      setIsUploading(true);

      setMessage(
        "Uploading photo...",
      );

      const extension =
        selectedFile.name
          .split(".")
          .pop()
          ?.toLowerCase() ??
        "jpg";

      const pathname =
        `worker-bees/${workerId}-${Date.now()}.${extension}`;

      const blob =
        await upload(
          pathname,
          selectedFile,
          {
            access: "public",

            handleUploadUrl:
              "/api/worker-photo/upload",
          },
        );

      setPhotoUrl(
        blob.url,
      );

      setPreviewUrl(
        blob.url,
      );

      setSelectedFile(
        null,
      );

      setMessage(
        "Photo uploaded. Click Save Profile to apply it to this Worker Bee.",
      );
    } catch (error) {
      console.error(
        error,
      );

      setMessage(
        "The photo could not be uploaded. Please try again.",
      );
    } finally {
      setIsUploading(
        false,
      );
    }
  }

  function removePhoto() {
    setPhotoUrl("");
    setPreviewUrl("");
    setSelectedFile(
      null,
    );

    setMessage(
      "Photo removed from the profile. Click Save Profile to confirm.",
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gap: "12px",

        padding: "14px",

        border:
          "1px solid #ead8a0",

        borderRadius:
          "14px",

        background:
          "#fffdf6",
      }}
    >
      {/*
       * This hidden field is submitted
       * with the existing Worker Bee
       * profile form.
       */}
      <input
        type="hidden"
        name="photoUrl"
        value={photoUrl}
      />

      <div
        style={{
          display: "flex",

          alignItems:
            "center",

          gap: "14px",

          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "grid",

            width: "100px",
            height: "100px",

            placeItems:
              "center",

            overflow:
              "hidden",

            flex:
              "0 0 100px",

            border:
              "3px solid #f1d87b",

            borderRadius:
              "50%",

            background:
              "#fff7d7",
          }}
        >
          {previewUrl ? (
            <img
              src={
                previewUrl
              }
              alt={`${workerName} profile`}
              style={{
                width:
                  "100%",

                height:
                  "100%",

                objectFit:
                  "cover",
              }}
            />
          ) : (
            <span
              style={{
                fontSize:
                  "2.6rem",
              }}
            >
              🐝
            </span>
          )}
        </div>

        <div
          style={{
            flex: "1 1 220px",
          }}
        >
          <strong
            style={{
              display:
                "block",

              marginBottom:
                "5px",

              color:
                "#5b430d",
            }}
          >
            Worker Bee Photo
          </strong>

          <p
            style={{
              margin:
                "0 0 9px",

              color:
                "#786c50",

              fontSize:
                "0.82rem",

              lineHeight:
                1.4,
            }}
          >
            Upload the photo
            displayed on the
            Meet the Bees screen.
            JPG, PNG, or WebP up
            to 5 MB.
          </p>

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={
              handleFileSelection
            }
            disabled={
              isUploading
            }
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",

          gap: "8px",

          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={
            handleUpload
          }
          disabled={
            !selectedFile ||
            isUploading
          }
          style={{
            padding:
              "9px 14px",

            border: 0,

            borderRadius:
              "9px",

            background:
              !selectedFile ||
              isUploading
                ? "#d7d0bd"
                : "#d4a017",

            color:
              "white",

            fontWeight:
              800,

            cursor:
              !selectedFile ||
              isUploading
                ? "not-allowed"
                : "pointer",
          }}
        >
          {isUploading
            ? "Uploading..."
            : "Upload Photo"}
        </button>

        {photoUrl && (
          <button
            type="button"
            onClick={
              removePhoto
            }
            disabled={
              isUploading
            }
            style={{
              padding:
                "9px 14px",

              border:
                "1px solid #c9b77e",

              borderRadius:
                "9px",

              background:
                "white",

              color:
                "#74591b",

              fontWeight:
                800,

              cursor:
                "pointer",
            }}
          >
            Remove Photo
          </button>
        )}
      </div>

      {message && (
        <p
          style={{
            margin: 0,

            color:
              message.includes(
                "could not",
              ) ||
              message.includes(
                "Please choose",
              )
                ? "#a43131"
                : "#6e5b25",

            fontSize:
              "0.8rem",

            fontWeight:
              700,
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}