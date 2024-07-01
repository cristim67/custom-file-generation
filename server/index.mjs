import express from 'express';
import multer from 'multer';
import cors from 'cors';
import bodyParser from 'body-parser';
import serverless from 'serverless-http';
import {uploadExcel, uploadDocx, generateViaXLSX, createZipAndCleanup} from "./services/fileHandler.mjs";

const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/upload-docx', upload.single('file'), uploadDocx);

app.post('/upload-excel', upload.single('file'), uploadExcel);

app.get('/generate', generateViaXLSX);

app.get('/download', createZipAndCleanup);

if (process.env.NODE_ENV === "dev") {
    app.listen(8080, () => {
        console.log(
            "Server is running on port 8080. Check the app on http://localhost:8080"
        );
    });
}

export const handler = serverless(app);
