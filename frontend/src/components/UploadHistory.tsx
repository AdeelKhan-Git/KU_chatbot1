import { FileRecordItem } from "@/api/document";
import { shrinkText } from "@/lib/utils";

type UploadHistoryProps = {
  data: FileRecordItem[];
};

const UploadHistory = ({ data }: UploadHistoryProps) => {
  return (
    <div className="border p-4 rounded-lg">
      <div className="space-y-3">
        {(data?.length ? data : []).map((item, index) => (
          <div
            key={index}
            className="border rounded-lg p-4 flex justify-between items-center hover:shadow-md transition"
          >
            <div>
              <p className="text-cyan-400 font-medium">
                {shrinkText(item?.name, 30)}
              </p>
              <p className="text-gray-500 text-sm">
                {new Date(item?.uploaded_at).toLocaleDateString()}
              </p>
            </div>
            <div className="text-sm text-white-700 text-right">
              <p>
                <span className="font-semibold">By:</span> {item?.admin_name}
              </p>
            </div>
          </div>
        ))}

        {data.length === 0 && (
          <p className="text-center text-gray-500 text-sm">
            No upload history found.
          </p>
        )}
      </div>
    </div>
  );
};

export default UploadHistory;
