import React, {ChangeEvent, FormEvent, useState} from 'react';
import axios from 'axios';
import {ClipLoader} from 'react-spinners';

const FileUpload: React.FC = () => {
  const [fileDocx, setFileDocx] = useState<File | null>(null);
  const [fileExcel, setFileExcel] = useState<File | null>(null);
  const [message, setMessage] = useState<string>('');
  const [templateFileName, setTemplateFileName] = useState<string>('');
  const [dataFileName, setDataFileName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

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
    } else if (isExcel) {
      setFileExcel(file);
      setMessage('');
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
        `https://e2877c54-da8e-49d1-9eae-0a26fa70f398.dev-fkt.cloud.genez.io/upload-${fileType}`,
        // `http://localhost:3000/upload-${fileType}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
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
    } catch (error) {
      setMessage(`Error uploading the ${fileType === 'docx' ? 'DOCX' : 'Excel'} file.`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateData = async () => {
    const defaultTemplate = 'sample-template.docx';
    const defaultData = 'sample-data.xlsx';

    const template = fileDocx ? templateFileName : defaultTemplate;
    const data = fileExcel ? dataFileName : defaultData;

    if (!fileDocx && !fileExcel) {
      setMessage('Please upload both template and data files.');
      return;
    }

    try {
      setLoading(true);

      const uploadDefaultFile = async (fileName: string, fileType: 'docx' | 'excel') => {
        const response = await fetch(`/${fileName}`);
        const fileBlob = await response.blob();
        const formData = new FormData();
        formData.append('file', fileBlob, fileName);

        return await axios.post(
          `https://e2877c54-da8e-49d1-9eae-0a26fa70f398.dev-fkt.cloud.genez.io/upload-${fileType}`,
          // `http://localhost:3000/upload-${fileType}`,
          formData,
          {headers: {'Content-Type': 'multipart/form-data'}}
        );
      };

      let response;
      if (template === defaultTemplate && data === defaultData) {
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

        response = await axios.get(
          `https://e2877c54-da8e-49d1-9eae-0a26fa70f398.dev-fkt.cloud.genez.io/generate?template=${uploadTemplateResponse.data.fileName}&data=${uploadDataResponse.data.fileName}`,
          // `http://localhost:3000/generate?template=${uploadTemplateResponse.data.fileName}&data=${uploadDataResponse.data.fileName}`
        );
      } else {
        response = await axios.get(
          `https://e2877c54-da8e-49d1-9eae-0a26fa70f398.dev-fkt.cloud.genez.io/generate?template=${template}&data=${data}`,
          // `http://localhost:3000/generate?template=${template}&data=${data}`
        );
      }

      if (response.data.status === 200) {
        const pathName = response.data.pathName;
        const downloadResponse = await axios.get(
          `https://e2877c54-da8e-49d1-9eae-0a26fa70f398.dev-fkt.cloud.genez.io/download?pathName=${pathName}&template=${templateFileName}&data=${dataFileName}`,
          // `http://localhost:3000/download?pathName=${pathName}&template=${templateFileName}&data=${dataFileName}`,
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
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">File Upload</h1>
      {message && (
        <p
          className={`mt-4 p-2 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </p>
      )}
      {loading && (
        <div className="flex justify-center mb-6">
          <ClipLoader size={35} color={"#123abc"} loading={loading}/>
        </div>
      )}
      <div className="mb-6">
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
        <button onClick={() => handleDownloadSample('docx')}
                className="w-full px-4 py-2 mt-2 bg-gray-500 text-white rounded-md hover:bg-gray-600">
          Download Sample DOCX
        </button>
      </div>
      <div className="mb-6">
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
        <button onClick={() => handleDownloadSample('excel')}
                className="w-full px-4 py-2 mt-2 bg-gray-500 text-white rounded-md hover:bg-gray-600">
          Download Sample Excel
        </button>
      </div>
      <button onClick={handleGenerateData}
              className="w-full px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600">
        Generate Data
      </button>
    </div>
  );
};

export default FileUpload;
