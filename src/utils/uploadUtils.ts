// uploadUtils.ts
export interface UploadOptions {
  chunkSize?: number;
  endpoint?: string;
  onProgress?: (progress: number) => void;
  onStatusChange?: (status: UploadStatus) => void;
}

export type UploadStatus =
  | "pending"
  | "uploading"
  | "success"
  | "error"
  | "canceled";

export const createChunks = (file: File, chunkSize: number) => {
  const totalChunks = Math.ceil(file.size / chunkSize);
  const chunks: { blob: Blob; offset: number }[] = [];

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    chunks.push({
      blob: file.slice(start, end),
      offset: start,
    });
  }

  return chunks;
};

/**
 * Utility function for making HTTP requests using XMLHttpRequest, with support for uploading files in chunks.
 * Handles file upload progress tracking and supports various types of body data.
 *
 * @param method - The HTTP method to use for the request (e.g., "GET", "POST", "PATCH", "DELETE").
 * @param url - The URL endpoint to send the request to.
 * @param headers - A record of headers to include in the request.
 * @param body - The body of the request, which can be a string, Blob, FormData, ArrayBuffer, or ReadableStream.
 * @param onProgress - A callback function to track the upload progress (optional). It receives the progress percentage (0–100).
 * @param signal - An AbortSignal to allow canceling the request (optional).
 *
 * @returns A promise that resolves with the response data from the request, or rejects with an error if the request fails.
 *
 * @throws Error if the request fails (e.g., network error, status code not in the range [200, 300]).
 *
 * @example
 * const response = await xhrRequest('POST', '/upload', {
 *   'Content-Type': 'application/json',
 *   'Authorization': 'Bearer token',
 * }, JSON.stringify({ data: 'some data' }), (progress) => {
 *   console.log(`Upload progress: ${progress}%`);
 * });
 */
const xhrRequest = <T>(
  method: string, // HTTP method (e.g., GET, POST, PATCH)
  url: string, // URL of the request
  headers: Record<string, string>, // Request headers
  body?: BodyInit, // Body of the request (string, Blob, FormData, ArrayBuffer, ReadableStream)
  onProgress?: (progress: number) => void, // Progress callback (optional)
  signal?: AbortSignal // AbortSignal for request cancellation (optional)
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest(); // Create a new XMLHttpRequest instance
    xhr.open(method, url, true); // Initialize the request with method and URL

    // Set custom headers for the request
    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value);
    }

    // Set up the progress tracking callback (if provided)
    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        /**
         * The ProgressEvent.lengthComputable read-only property is a boolean flag
         * indicating if the resource concerned by the ProgressEvent has a length that can be calculated.
         * If not, the ProgressEvent.total property has no significant value.
         */
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress); // Invoke progress callback with percentage
        }
      };
    }

    // Handle the response when the request completes
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response =
            xhr.responseType === "text" || xhr.responseType === ""
              ? xhr.responseText
              : xhr.response;
          resolve(response as T); // Resolve the promise with the response data
        } catch (err) {
          reject(new Error("Failed to parse response: " + err)); // Reject if parsing fails
        }
      } else {
        reject(new Error(`Request failed with status ${xhr.status}`)); // Reject on error status
      }
    };

    // Handle network errors
    xhr.onerror = () => {
      reject(new Error("Request failed")); // Reject on network error
    };

    // Handle request abortion
    if (signal) {
      signal.addEventListener("abort", () => {
        xhr.abort(); // Abort the request
        reject(new Error("Request aborted")); // Reject if aborted
      });
    }

    // If body is a ReadableStream, we need to convert it to a Blob before sending
    if (body instanceof ReadableStream) {
      const reader = body.getReader(); // Create a reader for the ReadableStream
      const chunks: Blob[] = []; // Array to collect the chunks of data

      reader.read().then(function processResult(result) {
        if (result.done) {
          const finalBlob = new Blob(chunks); // Convert the chunks into a single Blob
          xhr.send(finalBlob); // Send the Blob in the request body
          return;
        }
        chunks.push(result.value); // Add chunk to the array
        reader.read().then(processResult); // Continue reading the next chunk
      });
    } else if (
      body instanceof Blob ||
      body instanceof ArrayBuffer ||
      body instanceof FormData
    ) {
      // If body is a Blob, ArrayBuffer, or FormData, send it directly
      xhr.send(body);
    } else {
      // If the body is a string or JSON-like object, send it as-is
      xhr.send(body);
    }
  });
};

export const uploadFile = async (
  file: File,
  options: UploadOptions = {},
  signal?: AbortSignal
): Promise<string | undefined> => {
  const {
    chunkSize = 80 * 1024 * 1024, // Default 80MB chunks
    endpoint = "/filepond",
    onProgress,
    onStatusChange,
  } = options;

  const fileName = file.name;
  let id: string | undefined;

  // 1. Initialize upload session
  try {
    id = await xhrRequest<string>(
      "POST",
      endpoint,
      {
        "Upload-Length": file.size.toString(),
        "Upload-Name": encodeURIComponent(fileName),
        Accept: "text/plain",
      },
      undefined, // <--- this is the 'body'
      undefined, // <--- this is the 'onProgress'
      signal
    );

    if (!id) throw new Error("Missing upload ID");
    onStatusChange?.("uploading");
  } catch (err) {
    console.error("Upload initialization failed:", err);
    onStatusChange?.("error");
    return;
  }

  const uploadUrl = `${endpoint}?patch=${id}`;
  const chunks = createChunks(file, chunkSize);
  let uploadedSize = 0;

  // 2. Upload each chunk
  for (const [index, chunk] of chunks.entries()) {
    if (signal?.aborted) {
      onStatusChange?.("canceled");
      return;
    }

    try {
      await xhrRequest<void>(
        "PATCH",
        uploadUrl,
        {
          "Content-Type": "application/offset+octet-stream",
          "Upload-Offset": chunk.offset.toString(),
          "Upload-Length": file.size.toString(),
          "Upload-Name": encodeURIComponent(fileName),
        },
        chunk.blob,
        (progress) => {
          // Calculate the progress of this chunk
          const chunkProgressSize = (progress / 100) * chunk.blob.size;
          uploadedSize += chunkProgressSize; // Update the total uploaded size for correct progress tracking

          const overallProgress = Math.min(
            100,
            Math.round((uploadedSize / file.size) * 100)
          );
          onProgress?.(overallProgress);
        },
        signal
      );
    } catch (err) {
      console.error(`Chunk ${index + 1} upload error:`, err);
      onStatusChange?.("error");
      return;
    }
  }

  // Successfully uploaded all chunks
  onStatusChange?.("success");
  return id;
};

export const revertUpload = async (endpoint = "/filepond", id: string) => {
  try {
    await xhrRequest<void>("DELETE", endpoint, {}, id, undefined);
  } catch (err) {
    console.error("Cancel upload failed:", err);
  }
};
