import { FileRecordItem, getFileRecords, uploadJsonFile } from "@/api/document";
import Header from "@/components/Header";
import UploadHistory from "@/components/UploadHistory";
import UploadPdf from "@/components/UploadPdf";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const AdminPanel = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<FileRecordItem[]>([]);

  const handleUploadFile = async () => {
    if (!pdfFile || loading) return;
    try {
      setLoading(true);
      await uploadJsonFile(pdfFile);
      fetchRecords();
      setPdfFile(null);
      toast.success("Your file has been uploaded.")
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async () => {
    try {
      const response = await getFileRecords();
      setData(response.message || []);
    } catch (error) {
      console.error("Failed to fetch file records:", error);
      setData([]);
    }
  };
  useEffect(() => {
    fetchRecords();
  }, []);
  return (
    <section className="flex flex-col pb-4 min-h-screen bg-[#0C0E16]  ">
      <div className="text-white p-5 mb-5 border-b border-gray-100">
        <Header />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4 p-4">
        <div className="text-white">
          <div className="flex justify-between  mb-4">
            <div>
              <h2 className="text-lg font-semibold">Upload PDF</h2>
              <p className="text-sm text-gray-500 ">Upload a PDF file</p>
            </div>
            {/* <Button
              variant={"reserveOpposite"}
              disabled={!pdfFile || loading}
              className="cta"
              onClick={handleUploadFile}
            >
              Upload Now
            </Button> */}
          </div>
          <UploadPdf file={pdfFile} onUpload={setPdfFile} loading={loading} pdfFile={pdfFile} handleUploadFile={handleUploadFile} />
        </div>
        <div className="text-white">
          <h2 className="text-lg font-semibold">Upload History</h2>
          <p className="text-sm text-gray-500 mb-4">Recently uploaded files</p>
          <UploadHistory data={data} />
        </div>
      </div>
    </section>
  );
};

export default AdminPanel;
