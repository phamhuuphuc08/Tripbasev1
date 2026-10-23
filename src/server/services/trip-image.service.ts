import { mkdir, writeFile } from "fs/promises";
import path from "path";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export async function uploadTripCoverImage(
  userId: string,
  file: File,
) {
  if (
    !ALLOWED_TYPES.includes(
      file.type,
    )
  ) {
    throw new Error(
      "INVALID_IMAGE_TYPE",
    );
  }

  if (
    file.size >
    MAX_FILE_SIZE
  ) {
    throw new Error(
      "IMAGE_TOO_LARGE",
    );
  }

  const extension =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase() ||
    "jpg";

  const filename =
    `${crypto.randomUUID()}.${extension}`;

  const relativeDirectory =
    path.join(
      "uploads",
      "trip-covers",
      userId,
    );

  const publicDirectory =
    path.join(
      process.cwd(),
      "public",
      relativeDirectory,
    );

  await mkdir(
    publicDirectory,
    {
      recursive: true,
    },
  );

  const bytes =
    await file.arrayBuffer();

  const buffer =
    Buffer.from(bytes);

  await writeFile(
    path.join(
      publicDirectory,
      filename,
    ),
    buffer,
  );

  return `/${relativeDirectory.replaceAll("\\", "/")}/${filename}`;
}