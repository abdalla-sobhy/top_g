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

export interface ImageUploaderProps {
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
  onIinitalRemove?: () => void;
  id?: string;
  disabled?: boolean;
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

export interface AttachmentUploaderRef {
  clear: () => void;
  clearWithId: (id: string) => void;
  getUploadedFiles: () => Array<{ id: string; url: string; file?: File }>;
}

const AttachmentUploader = forwardRef<
  AttachmentUploaderRef,
  ImageUploaderProps
>(
  (
    {
      maxFiles = 5,
      acceptedTypes = ["image/*"],
      onUploadComplete,
      containerStyle,
      previewContainerStyle,
      instantUpload = true,
      maxSize = 5,
      initialFiles = [],
      onRevert,
      onRevertWithoutId,
      onIinitalRemove,
      id,
      disabled,
    },
    ref
  ) => {
    const maxFileSizeBytes = maxSize * 1024 * 1024;
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState<FileState[]>([]);

    useEffect(() => {
      if (initialFiles && initialFiles.length > 0) {
        const isAcceptedType = (type: string) => {
          return acceptedTypes.some((accepted) => {
            if (accepted.endsWith("/*")) {
              const baseType = accepted.split("/")[0];
              return type.startsWith(baseType + "/");
            }
            return type === accepted;
          });
        };

        const initialPreviews = initialFiles
          .filter((file) => {
            const accepted = isAcceptedType(file.mime_type);
            if (!accepted) {
              console.warn(
                "Skipped file due to unsupported mime type:",
                file.mime_type
              );
            }
            return accepted;
          })
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
        files.forEach((f) => {
          if (f.file) URL.revokeObjectURL(f.url);
          if (f.controller) f.controller.abort();
        });
        setFiles([]);
        if (inputRef.current) inputRef.current.value = "";
      },
      clearWithId: (id: string) => {
        if (id) {
          files.forEach((f) => {
            if (f.file) URL.revokeObjectURL(f.url);
            if (f.controller) f.controller.abort();
          });
          setFiles([]);
          if (inputRef.current) inputRef.current.value = "";
        }
      },
      getUploadedFiles: () => {
        return files.map((file) => ({
          id: file.id || "",
          url: file.url,
          file: file.file,
        }));
      },
    }));

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
          console.error("Upload failed:", error);
        }
      },
      [onUploadComplete]
    );

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
          // manually create a synthetic event for the input to reuse handleFileChange
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

        // Cancel any ongoing upload
        if (fileToRemove.controller) {
          fileToRemove.controller.abort();
        }

        // Revert the upload if it was successful
        if (fileToRemove.id && !fileToRemove.isInitial) {
          try {
            await cancelUploadFromServer("/filepond", fileToRemove.id);
            onRevert?.(fileToRemove.id);
          } catch (err) {
            console.error("Failed to cancel on server:", err);
          }
        }

        // Handle initial file removal
        if (fileToRemove.isInitial) {
          onIinitalRemove?.();
          if (!fileToRemove.id) {
            onRevertWithoutId?.();
          }
        }

        onRevertWithoutId?.();
        if (fileToRemove.id) onRevert?.(fileToRemove.id);
        // Clean up object URL if it was a local file
        if (fileToRemove.file) {
          URL.revokeObjectURL(fileToRemove.url);
        }

        // Remove the file from state
        setFiles((prev) => prev.filter((_, i) => i !== index));
      },
      [files, disabled, onRevert, onIinitalRemove, onRevertWithoutId]
    );

    const renderPreviewContent = useCallback(
      (preview: { url: string; mime_type?: string; file?: File }) => {
        const mimeType = preview.mime_type || preview.file?.type || "";

        if (mimeType.startsWith("image/")) {
          return (
            <img
              src={preview.url}
              alt="Preview"
              className="w-full h-auto object-contain"
            />
          );
        } else if (mimeType === "application/pdf") {
          return (
            <embed
              src={preview.url}
              type="application/pdf"
              className="w-full h-[300px]"
            />
          );
        } else {
          return (
            <div className="p-4 flex flex-col items-center justify-center h-full">
              <div className="text-lg font-medium">File Preview</div>
              <div className="text-sm text-gray-500 mt-2">
                {preview.file?.name || "Unknown file type"}
              </div>
            </div>
          );
        }
      },
      []
    );

    const statusShadows: Record<string, string> = {
      success: "0px 0px 8px 2px rgba(34, 197, 94, 0.7)",
      error: "0px 0px 8px 2px rgba(255, 0, 0, 0.7)",
      canceled: "0px 0px 8px 2px rgba(255, 223, 0, 0.7)",
      pending: "0px 0px 8px 2px rgba(255, 159, 28, 0.7)",
      uploading: "0px 0px 8px 2px rgba(59, 130, 246, 0.7)",
      idle: "0px 0px 8px 2px rgba(156, 163, 175, 0.7)",
    };

    return (
      <div
        className={cn(
          "max-h-[90vh] w-full flex flex-col gap-4 p-4 rounded-xl bg-gray-300/60 overflow-y-auto",
          containerStyle
        )}
      >
        {files.length < maxFiles && (
          <div className="relative flex flex-col items-center justify-center w-full p-6 bg-white rounded-xl shadow-md">
            <label
              htmlFor={`${
                id ? `${id}-attachment-upload` : "attachment-upload"
              }`}
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
                  اقصى حجم للملف الواحد هو {maxFileSizeBytes / 1024 / 1024}{" "}
                  ميجابايت
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
              id={`${id ? `${id}-attachment-upload` : "attachment-upload"}`}
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
              "flex flex-col w-full overflow-y-scroll overflow-x-hidden gap-4 p-1 pr-3",
              previewContainerStyle
            )}
          >
            <div className="max-w-[400px] mx-auto ">
              {files.map((file, index) => (
                <div key={index} className="relative space-y-2">
                  <div
                    className="p-[2px] rounded-xl transition-all"
                    style={{ boxShadow: statusShadows[file.status] }}
                  >
                    <div className="bg-white rounded-xl overflow-hidden">
                      {renderPreviewContent(file)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-600 truncate">
                      {file.file?.name || file.url.split("/").pop()}
                    </span>
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
                        className="absolute top-1 left-1 bg-black/60 text-white p-1 rounded-full cursor-pointer text-xs transition opacity-100 hover:opacity-80"
                      >
                        <MdOutlineFileUpload size={20} />
                      </button>
                    )}

                  {file.status === "success" && !file.isInitial && (
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute top-1 left-1 bg-black/60 cursor-pointer text-white p-1 rounded-full text-xs transition opacity-100 hover:opacity-80"
                    >
                      <GrRevert size={20} />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute top-1 right-1 cursor-pointer bg-black/60 text-white p-1 rounded-full text-xs transition opacity-100 hover:opacity-80"
                    disabled={disabled}
                  >
                    <IoClose size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);

AttachmentUploader.displayName = "AttachmentUploader";

export default AttachmentUploader;
