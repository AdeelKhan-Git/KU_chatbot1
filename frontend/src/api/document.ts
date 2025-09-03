import { AxiosError } from "axios";
import toast from "react-hot-toast";
import { apiClient } from "./axios";

export const uploadJsonFile = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post("api/upload_file/", formData);
    return response;
  } catch (error) {
    if (error instanceof AxiosError) {
      toast.error(
        error.response?.data?.error ||
          "Failed to upload JSON file. Please try again."
      );
    } else {
      toast.error("Unexpected error occurred. Please try again.");
    }
    console.error("Failed to upload JSON file:", error);
    throw error;
  }
};

export interface FileRecordItem {
  file_name: string;
  uploaded_by: string;
  uploaded_at: string;
  inserted_count?: number;
  skipped_count?: number;
}

export interface FileRecord {
  message: FileRecordItem[];
}
export const getFileRecords = async (): Promise<FileRecord> => {
  try {
    const response = await apiClient.get("api/file_records");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch file records:", error);
    throw error;
  }
};
