import {
  handleUpload,
  type HandleUploadBody,
} from "@vercel/blob/client";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
) {
  const body =
    (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse =
      await handleUpload({
        body,
        request,

        onBeforeGenerateToken: async (
          pathname,
        ) => {
          return {
            allowedContentTypes: [
              "image/jpeg",
              "image/png",
              "image/webp",
            ],

            maximumSizeInBytes:
              5 * 1024 * 1024,

            addRandomSuffix: true,

            tokenPayload:
              JSON.stringify({
                pathname,
              }),
          };
        },

        onUploadCompleted: async () => {
          /*
           * Nothing needs to be written to
           * Prisma here.
           *
           * WorkerPhotoUpload receives the
           * completed Blob URL in the browser
           * and places it into the worker
           * profile form's photoUrl field.
           *
           * The existing Save Profile action
           * then stores that URL in Collector.
           */
        },
      });

    return NextResponse.json(
      jsonResponse,
    );
  } catch (error) {
    console.error(
      "Worker photo upload failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to upload worker photo.",
      },
      {
        status: 400,
      },
    );
  }
}