import { AxiosError } from "axios";
import toast from "react-hot-toast";
import { apiClient } from "./axios";

export const uploadJsonFile = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post("bot/upload-file/", formData);
    return response;
  } catch (error) {
    if (error instanceof AxiosError) {
      toast.error(
        error.response?.data?.error ||
          "Failed to upload PDF file. Please try again."
      );
    } else {
      toast.error("Unexpected error occurred. Please try again.");
    }
    console.error("Failed to upload JSON file:", error);
    throw error;
  }
};

export interface FileRecordItem {
  name: string;
  admin_name: string;
  uploaded_at: string;
}

export interface FileRecord {
  message: FileRecordItem[];
}

export interface UploadStatusResponse {
  id: number;
  status: "processing" | "completed" | "failed";
  file: string;
}

export const getFileRecords = async (): Promise<FileRecord> => {
  try {
    const response = await apiClient.get("bot/file-records");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch file records:", error);
    throw error;
  }
};

export const getUploadStatus = (id: number) => {
  return apiClient.get<UploadStatusResponse>(`bot/upload-status/${id}/`);
};
