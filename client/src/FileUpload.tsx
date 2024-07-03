import React, { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import axios from 'axios';
import { ClipLoader } from 'react-spinners';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

const FileUpload: React.FC = () => {
  const [fileDocx, setFileDocx] = useState<File | null>(null);
  const [fileExcel, setFileExcel] = useState<File | null>(null);
  const [message, setMessage] = useState<string>('');
  const [templateFileName, setTemplateFileName] = useState<string>('');
  const [dataFileName, setDataFileName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [docxPreview, setDocxPreview] = useState<string>('');
  const [excelPreview, setExcelPreview] = useState<string>('');

  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    previewSampleFiles();
  }, []);

  const previewSampleFiles = async () => {
    await previewFile('docx', '/sample-template.docx');
    await previewFile('excel', '/sample-data.xlsx');
  };

  const previewFile = async (fileType: 'docx' | 'excel', url: string) => {
    const response = await fetch(url);
    const fileBlob = await response.blob();
    const arrayBuffer = await fileBlob.arrayBuffer();

    if (fileType === 'docx') {
      const result = await mammoth.convertToHtml({ arrayBuffer });
      setDocxPreview(result.value);
    } else if (fileType === 'excel') {
      const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const html = XLSX.utils.sheet_to_html(worksheet);
      setExcelPreview(html);
    }
  };

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
    fileType: 'docx' | 'excel'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isDocx = fileType === 'docx' && file.name.endsWith('.docx');
    const isExcel = fileType === 'excel' && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'));

    if (isDocx) {
      setFileDocx(file);
      setMessage('');
      previewFile('docx', URL.createObjectURL(file));
    } else if (isExcel) {
      setFileExcel(file);
      setMessage('');
      previewFile('excel', URL.createObjectURL(file));
    } else {
      setMessage(`Error: Please select a file with the ${fileType === 'docx' ? '.docx' : '.xlsx'} extension.`);
    }
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
    fileType: 'docx' | 'excel'
  ) => {
    event.preventDefault();
    const file = fileType === 'docx' ? fileDocx : fileExcel;

    if (!file) {
      setMessage(`Error: Please select a ${fileType === 'docx' ? 'DOCX' : 'Excel'} file.`);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      const response = await axios.post(
        `${apiUrl}/upload-${fileType}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (response.data.status === 200) {
        if (fileType === 'docx') {
          setTemplateFileName(response.data.fileName);
        } else {
          setDataFileName(response.data.fileName);
        }
        setMessage(response.data.message);
      } else {
        setMessage(`Error uploading the ${fileType === 'docx' ? 'DOCX' : 'Excel'} file.`);
      }
    } catch {
      setMessage(`Error uploading the ${fileType === 'docx' ? 'DOCX' : 'Excel'} file.`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateData = async () => {
    const defaultTemplate = 'sample-template.docx';
    const defaultData = 'sample-data.xlsx';

    const uploadDefaultFile = async (fileName: string, fileType: 'docx' | 'excel') => {
      const response = await fetch(`/${fileName}`);
      const fileBlob = await response.blob();
      const formData = new FormData();
      formData.append('file', fileBlob, fileName);

      return await axios.post(
        `${apiUrl}/upload-${fileType}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
    };

    try {
      setLoading(true);

      if (fileDocx && !fileExcel) {
        setMessage('Error: Please upload an Excel file.');
        return;
      }

      if (!fileDocx && fileExcel) {
        setMessage('Error: Please upload a DOCX file.');
        return;
      }

      if (!fileDocx && !fileExcel) {
        const uploadTemplateResponse = await uploadDefaultFile(defaultTemplate, 'docx');
        if (uploadTemplateResponse.data.status !== 200) {
          setMessage('Error uploading sample DOCX file.');
          return;
        }
        setTemplateFileName(uploadTemplateResponse.data.fileName);

        const uploadDataResponse = await uploadDefaultFile(defaultData, 'excel');
        if (uploadDataResponse.data.status !== 200) {
          setMessage('Error uploading sample Excel file.');
          return;
        }
        setDataFileName(uploadDataResponse.data.fileName);

        const response = await axios.get(
          `${apiUrl}/generate?template=${uploadTemplateResponse.data.fileName}&data=${uploadDataResponse.data.fileName}`
        );

        if (response.data.status === 200) {
          const pathName = response.data.pathName;
          const downloadResponse = await axios.get(
            `${apiUrl}/download?pathName=${pathName}&template=${uploadTemplateResponse.data.fileName}&data=${uploadDataResponse.data.fileName}`,
            { responseType: 'blob' }
          );

          const blob = new Blob([downloadResponse.data], { type: 'application/zip' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `${pathName}.zip`);
          document.body.appendChild(link);
          link.click();
          link.parentNode?.removeChild(link);

          setMessage('Data have been successfully generated and downloaded.');

          location.reload();
        } else {
          setMessage('Error generating data.');
        }
      } else {
        const response = await axios.get(
          `${apiUrl}/generate?template=${templateFileName}&data=${dataFileName}`
        );

        if (response.data.status === 200) {
          const pathName = response.data.pathName;
          const downloadResponse = await axios.get(
            `${apiUrl}/download?pathName=${pathName}&template=${templateFileName}&data=${dataFileName}`,
            { responseType: 'blob' }
          );

          const blob = new Blob([downloadResponse.data], { type: 'application/zip' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `${pathName}.zip`);
          document.body.appendChild(link);
          link.click();
          link.parentNode?.removeChild(link);

          setMessage('Data have been successfully generated and downloaded.');

          location.reload();
        } else {
          setMessage('Error generating data.');
        }
      }
    } catch (error) {
      console.error(error);
      setMessage('Error generating or downloading data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSample = (fileType: 'docx' | 'excel') => {
    const sampleFile = fileType === 'docx' ? '/sample-template.docx' : '/sample-data.xlsx';
    const link = document.createElement('a');
    link.href = sampleFile;
    link.setAttribute('download', sampleFile);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">File Upload</h1>
      {message && (
        <p className={`mt-4 p-2 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </p>
      )}
      {loading && (
        <div className="flex justify-center mb-6">
          <ClipLoader size={35} color={"#123abc"} loading={loading} />
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="col-span-1">
          <h2 className="text-xl font-semibold mb-4">Upload DOCX File</h2>
          <form onSubmit={(e) => handleSubmit(e, 'docx')} className="space-y-4">
            <input
              type="file"
              onChange={(e) => handleFileChange(e, 'docx')}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <button type="submit" className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
              Upload DOCX
            </button>
          </form>
          <button onClick={() => handleDownloadSample('docx')} className="w-full px-4 py-2 mt-2 bg-gray-500 text-white rounded-md hover:bg-gray-600">
            Download Sample DOCX
          </button>
          {docxPreview && (
            <div className="mt-4 p-4 border rounded max-h-64 overflow-y-auto">
              <h3 className="text-lg font-semibold mb-2">DOCX Preview:</h3>
              <div dangerouslySetInnerHTML={{ __html: docxPreview }} />
            </div>
          )}
        </div>
        <div className="col-span-1">
          <h2 className="text-xl font-semibold mb-4">Upload Excel File</h2>
          <form onSubmit={(e) => handleSubmit(e, 'excel')} className="space-y-4">
            <input
              type="file"
              onChange={(e) => handleFileChange(e, 'excel')}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
            <button type="submit" className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">
              Upload Excel
            </button>
          </form>
          <button onClick={() => handleDownloadSample('excel')} className="w-full px-4 py-2 mt-2 bg-gray-500 text-white rounded-md hover:bg-gray-600">
            Download Sample Excel
          </button>
          {excelPreview && (
            <div className="mt-4 p-4 border rounded max-h-64 overflow-y-auto">
              <h3 className="text-lg font-semibold mb-2">Excel Preview:</h3>
              <div dangerouslySetInnerHTML={{ __html: excelPreview }} />
            </div>
          )}
        </div>
      </div>
      <button onClick={handleGenerateData} className="w-full px-4 py-2 mt-6 bg-purple-500 text-white rounded-md hover:bg-purple-600">
        Generate Data
      </button>
    </div>
  );
};

export default FileUpload;
