import { cn } from "@/lib/utils";
import {
  uploadFile,
  UploadStatus,
  revertUpload as cancelUploadFromServer,
} from "@/utils/uploadUtils";
import React, {
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
  useCallback,
} from "react";
import { GrRevert } from "react-icons/gr";
import { IoClose } from "react-icons/io5";
import { MdOutlineFileUpload } from "react-icons/md";
import { CircularProgress } from "./CircularProgress";
import { FaFileAlt, FaFileUpload, FaRegFileAlt } from "react-icons/fa";
import { AttachmentSource } from "@/types/courses";

export interface VideoUploaderProps {
  maxFiles?: number;
  acceptedTypes?: string[];
  onUploadComplete?: (id: string) => void;
  onRevert?: (id: string) => void;
  onRevertWithoutId?: () => void;
  containerStyle?: string;
  previewContainerStyle?: string;
  instantUpload?: boolean;
  maxSize?: number;
  initialFiles?: AttachmentSource[];
  onInitialRemove?: () => void;
  disabled?: boolean;
}

export interface VideoUploaderRef {
  clear: () => void;
  getUploadedFiles: () => Array<{ id: string; url: string; file?: File }>; // stay away 
}

interface FileState {
  file?: File;
  url: string;
  id?: string;
  mime_type?: string;
  isInitial: boolean;
  status: UploadStatus;
  progress?: number;
  controller?: AbortController;
}

const VideoUploader = forwardRef<VideoUploaderRef, VideoUploaderProps>(
  (
    {
      maxFiles = 1,
      acceptedTypes = ["video/mp4"],
      onUploadComplete,
      containerStyle,
      previewContainerStyle,
      instantUpload = false,
      initialFiles = [],
      maxSize = 2000,
      onRevert,
      onRevertWithoutId,
      onInitialRemove,
      disabled,
    },
    ref
  ) => {
    const maxFileSizeBytes = maxSize ? maxSize * 1024 * 1024 : Infinity;
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const [files, setFiles] = useState<FileState[]>([]);

    // Initialize with initialFiles
    useEffect(() => {
      if (initialFiles && initialFiles.length > 0) {
        const initialPreviews = initialFiles
          .filter((file) => acceptedTypes.includes(file.mime_type))
          .map((file) => ({
            url: `/storage/${file.url}`,
            id: file.id + "",
            mime_type: file.mime_type,
            isInitial: true,
            status: "success" as UploadStatus,
          }));

        setFiles(initialPreviews);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialFiles]);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      clear: () => {
        files.forEach((file) => {
          if (file.file) URL.revokeObjectURL(file.url);
          if (file.controller) file.controller.abort();
        });
        setFiles([]);
        if (inputRef.current) inputRef.current.value = "";
      },
      getUploadedFiles: () => {  // stay way
        return files.map((file) => ({
          id: file.id || "",
          url: file.url,
          file: file.file,
        }));
      },
    }));

    const handleFileChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        if (disabled) return;

        const newFiles = Array.from(e.target.files || [])
          .filter((file) => {
            const isValidType = acceptedTypes.some((type) => {
              if (type === file.type) return true;
              if (type.endsWith("/*")) {
                const mainType = type.split("/")[0];
                return file.type.startsWith(mainType + "/");
              }
              return false;
            });

            const isValidSize = file.size <= maxFileSizeBytes;

            return isValidType && isValidSize;
          })
          .slice(0, maxFiles - files.length);

        const newPreviews: FileState[] = newFiles.map((file) => ({
          file,
          url: URL.createObjectURL(file),
          mime_type: file.type,
          isInitial: false,
          status: instantUpload ? "pending" : ("idle" as UploadStatus),
          progress: 0,
        }));

        setFiles((prev) => [...prev, ...newPreviews]);
        if (inputRef.current) {
          inputRef.current.value = "";
        }
        if (instantUpload) {
          newPreviews.forEach((preview, i) => {
            const index = files.length + i;
            if (preview.file) {
              startUpload(preview.file, index);
            }
          });
        }
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [
        files.length,
        instantUpload,
        maxFiles,
        maxFileSizeBytes,
        disabled,
        acceptedTypes,
      ]
    );

    const onDrop = useCallback(
      (event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        setIsDragging(false);

        const droppedFiles = event.dataTransfer.files;
        if (inputRef.current) {
          const dt = new DataTransfer();
          Array.from(droppedFiles).forEach((file) => dt.items.add(file));
          inputRef.current.files = dt.files;

          const syntheticEvent = {
            target: { files: dt.files },
          } as React.ChangeEvent<HTMLInputElement>;
          handleFileChange(syntheticEvent);
        }
      },
      [handleFileChange]
    );
    const onDragOver = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        if (!isDragging) setIsDragging(true);
      },
      [isDragging]
    );

    const onDragLeave = useCallback(() => {
      setIsDragging(false);
    }, []);

    const removeFile = useCallback(
      async (index: number) => {
        if (disabled) return;

        const fileToRemove = files[index];

        // stop any ongoing upload
        if (fileToRemove.controller) {
          fileToRemove.controller.abort();
        }

        // revert the upload if it was an inital file
        if (fileToRemove.id && !fileToRemove.isInitial) {
          try {
            await cancelUploadFromServer("/filepond", fileToRemove.id);
            onRevert?.(fileToRemove.id);
          } catch (err) {
            console.error("Failed to cancel on server:", err);
          }
        }

        if (fileToRemove.isInitial) {
          onInitialRemove?.();
          if (!fileToRemove.id) {
            onRevertWithoutId?.();
          }
        }

        // clean up object URL if it was a local file
        if (fileToRemove.file) {
          URL.revokeObjectURL(fileToRemove.url);
        }

        // remove the file from state
        setFiles((prev) => prev.filter((_, i) => i !== index));
      },
      [files, disabled, onRevert, onInitialRemove, onRevertWithoutId]
    );

    const startUpload = useCallback(
      async (file: File, index: number) => {
        const controller = new AbortController();

        // update the file status to uploading
        setFiles((prev) =>
          prev.map((f, i) =>
            i === index
              ? {
                  ...f,
                  status: "uploading",
                  progress: 0,
                  controller,
                }
              : f
          )
        );

        try {
          const uploadedId = await uploadFile(
            file,
            {
              onProgress: (progress) => {
                setFiles((prev) =>
                  prev.map((f, i) => (i === index ? { ...f, progress } : f))
                );
              },
              onStatusChange: (status) => {
                setFiles((prev) =>
                  prev.map((f, i) => (i === index ? { ...f, status } : f))
                );
              },
            },
            controller.signal
          );

          if (uploadedId) {
            setFiles((prev) =>
              prev.map((f, i) =>
                i === index
                  ? {
                      ...f,
                      id: uploadedId,
                      status: "success",
                      progress: 100,
                    }
                  : f
              )
            );
            onUploadComplete?.(uploadedId);
          }
        } catch (error) {
          setFiles((prev) =>
            prev.map((f, i) => (i === index ? { ...f, status: "error" } : f))
          );
          console.error("Upload failed:", error);
        }
      },
      [onUploadComplete]
    );

    const statusShadows: Record<UploadStatus, string> = {
      success: "0px 0px 8px 2px rgba(34, 197, 94, 0.7)",
      error: "0px 0px 8px 2px rgba(255, 0, 0, 0.7)",
      canceled: "0px 0px 8px 2px rgba(255, 223, 0, 0.7)",
      pending: "0px 0px 8px 2px rgba(255, 159, 28, 0.7)",
      uploading: "0px 0px 8px 2px rgba(59, 130, 246, 0.7)",
    };

    return (
      <div
        className={cn(
          "w-max flex flex-col gap-4 p-4 rounded-xl bg-gray-300/60 backdrop-blur-sm",
          containerStyle
        )}
      >
        {files.length < maxFiles && (
          <div className="relative flex flex-col items-center justify-center w-full max-h-full p-6 bg-white rounded-xl shadow-md">
            <label
              htmlFor="video-upload"
              className="flex w-full h-full items-center justify-center text-center cursor-pointer bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200 transition px-6 py-3 rounded-lg text-sm font-semibold"
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
            >
              <MdOutlineFileUpload className="mx-2 text-lg" />
              اختر الملفات
            </label>

            <div className="mt-6 space-y-3 text-sm text-gray-700 *:gap-2">
              <div className="flex items-center flex-wrap">
                <FaFileAlt className="mr-2 text-gray-600" size={17} />
                <span className="break-words">
                  اقصى عدد للملفات هو {maxFiles}
                </span>
              </div>
              <div className="flex items-center flex-wrap">
                <FaFileUpload className="mr-2 text-lg text-blue-500" />
                <span className="break-words">
                  اقصى حجم للملف الواحد هو{" "}
                  {(maxFileSizeBytes / 1024 / 1024).toFixed()} ميجا بايت
                </span>
              </div>
              <div className="flex items-center flex-wrap">
                <FaRegFileAlt className="mr-2 text-lg text-green-500" />
                <span className="break-words">
                  الصيغ المسموح بها هي: {acceptedTypes.join(", ")}
                </span>
              </div>
            </div>

            <input
              id="video-upload"
              ref={inputRef}
              type="file"
              multiple={maxFiles > 1}
              accept={acceptedTypes.join(",")}
              onChange={handleFileChange}
              className="hidden"
              size={maxFileSizeBytes}
              disabled={disabled}
            />
          </div>
        )}
        {files.length > 0 && (
          <div
            className={cn(
              "flex z-[1] flex-col overflow-auto gap-4 mx-auto p-1",
              previewContainerStyle
            )}
          >
            {files.map((file, index) => (
              <div key={index} className="flex relative group">
                <div
                  className="flex transition-all rounded-xl overflow-hidden"
                  style={{ boxShadow: statusShadows[file.status] }}
                >
                  <video
                    src={file.url}
                    controls
                    className="bg-transparent w-full h-[300px] object-cover z-[1] rounded-xl"
                  />
                </div>

                {file.status === "uploading" && (
                  <CircularProgress
                    progress={file.progress || 0}
                    onClick={() => {
                      if (file.controller) {
                        file.controller.abort();
                      }
                    }}
                  />
                )}

                {["pending", "idle", "canceled", "error"].includes(
                  file.status
                ) &&
                  file.file && (
                    <button
                      type="button"
                      onClick={() => startUpload(file.file!, index)}
                      className="absolute cursor-pointer top-1 left-1  z-[2] bg-black/60 text-white p-1 rounded-full text-xs group-hover:opacity-100 opacity-100 transition w-max h-max"
                    >
                      <MdOutlineFileUpload size={20} />
                    </button>
                  )}

                {file.status === "success" && !file.isInitial && (
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute top-1 left-1 z-[2] cursor-pointer bg-black/60 text-white p-1 rounded-full text-xs group-hover:opacity-100 opacity-100 transition w-max h-max"
                  >
                    <GrRevert size={20} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1  z-[2] cursor-pointer bg-black/60 text-white p-1 rounded-full text-xs group-hover:opacity-100 opacity-100 transition w-max h-max"
                >
                  <IoClose size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

VideoUploader.displayName = "VideoUploader";

export default VideoUploader;
