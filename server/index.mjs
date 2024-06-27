import express from 'express';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';
import XLSX from 'xlsx';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import serverless from 'serverless-http';
import bodyParser from "body-parser";
import {v4 as uuidv4} from 'uuid';
import archiver from 'archiver';

const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({extended: false}));

const storage = multer.memoryStorage();
const upload = multer({storage: storage});

const generateData = async (input, fileNameTemplateDocx, folderName) => {
    try {
        const templatePath = `/tmp/templates/${fileNameTemplateDocx}`;
        console.log(`Checking template at ${templatePath}`);
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template file not found at ${templatePath}`);
        }
        const content = fs.readFileSync(templatePath, "binary");
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true, linebreaks: true,
        });

        doc.render(input);

        const buf = doc.getZip().generate({
            type: "nodebuffer", compression: "DEFLATE",
        });

        const dataDir = `/tmp/${folderName}`
        console.log(`Creating directory ${dataDir}`);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, {recursive: true});
        }

        const uuid = uuidv4();
        const fileName = `${dataDir}/${uuid}.docx`;
        console.log(`Writing data to ${fileName}`);
        fs.writeFileSync(fileName, buf);
    } catch (error) {
        console.error("Error generating data: ", error);
        throw error;
    }
};

const generateViaXLSX = async (fileNameTemplateDocx, fileNameDataExcel) => {
    try {
        const dataPath = `/tmp/data/${fileNameDataExcel}`;
        console.log(`Checking data file at ${dataPath}`);
        if (!fs.existsSync(dataPath)) {
            throw new Error(`Data file not found at ${dataPath}`);
        }
        const workbook = XLSX.readFile(dataPath);
        const sheet_name_list = workbook.SheetNames;
        const xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);

        const uuid = uuidv4();
        for (const data of xlData) {
            await generateData(data, fileNameTemplateDocx, uuid);
        }

        console.log("Generated data successfully!");
        return {status: 200, pathName: `${uuid}`};
    } catch (error) {
        console.error("Error generating data: ", error);
        throw error;
    }
};

const uploadExcel = async (fileBuffer) => {
    try {
        console.log("Uploading Excel file...");
        const buffer = Buffer.from(fileBuffer);
        const new_uuid = uuidv4();
        const filePath = `/tmp/data/${new_uuid}_diplomas.xlsx`
        if (!fs.existsSync('/tmp/data')) {
            fs.mkdirSync('/tmp/data', {recursive: true});
        }
        fs.writeFileSync(filePath, buffer);
        console.log(`File uploaded successfully to ${filePath}`);
        return {
            status: 200, message: `Excel file uploaded successfully!`, fileName: `${new_uuid}_diplomas.xlsx`,
        }
    } catch (error) {
        console.error("Error uploading file: ", error);
        throw error;
    }
};

const uploadDocx = async (fileBuffer) => {
    try {
        console.log("Uploading DOCX template...");
        const buffer = Buffer.from(fileBuffer);
        const new_uuid = uuidv4();
        const filePath = `/tmp/templates/${new_uuid}_template.docx`;

        if (!fs.existsSync('/tmp/templates')) {
            fs.mkdirSync('/tmp/templates', {recursive: true});
        }
        fs.writeFileSync(filePath, buffer);

        console.log(`File uploaded successfully to ${filePath}`);
        return {
            status: 200, message: `DOCX template uploaded successfully!`, fileName: `${new_uuid}_template.docx`,
        };
    } catch (error) {
        console.error("Error uploading DOCX template: ", error);
        throw error;
    }
};

app.post('/upload-docx', upload.single('file'), async (req, res) => {
    console.log('Received file for /upload-docx:', req.file)
    try {
        if (!req.file) {
            throw new Error('File not provided');
        }
        console.log('File received for /upload-docx:', req.file);
        const response = await uploadDocx(req.file.buffer);
        res.send(response);
    } catch (error) {
        console.log("Error uploading DOCX file: ", error)
        res.status(500).send({error: `${error}`});
    }
});

app.post('/upload-excel', upload.single('file'), async (req, res) => {
    try {
        console.log('Received file for /upload-excel:', req.file)
        if (!req.file) {
            throw new Error('File not provided');
        }
        console.log('File received for /upload-excel:', req.file);
        const response = await uploadExcel(req.file.buffer);
        res.send(response);
    } catch (error) {
        console.log("Error uploading Excel file: ", error)
        res.status(500).send({error: `${error}`});
    }
});

app.get('/generate', async (req, res) => {
    try {
        const fileNameTemplateDocx = req.query.template;
        const fileNameDataExcel = req.query.data;

        if (!fileNameTemplateDocx || !fileNameDataExcel) {
            res.status(400).send({error:`Missing required parameters: template or data`});
            return;
        }

        const response = await generateViaXLSX(fileNameTemplateDocx, fileNameDataExcel);
        res.send({status: 200, message: `Successfully generated data!`, pathName: response.pathName});
    } catch (error) {
        console.log("Error generating data: ", error)
        res.status(500).send({error: `${error}`});
    }
});

app.get('/download', async (req, res) => {
    const dataDir = req.query.pathName;
    const templateFileToDelete = req.query.template;
    const excelFileToDelete = req.query.data;
    console.log(`Creating zip for ${dataDir}`);
    console.log(`Deleting template file ${templateFileToDelete}`);
    console.log(`Deleting excel file ${excelFileToDelete}`);

    const zipFilePath = `/tmp/${dataDir}.zip`;
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', {
        zlib: { level: 9 }
    });

    output.on('close', function () {
        console.log(archive.pointer() + ' total bytes');
        console.log('Archiver has been finalized and the output file descriptor has closed.');

        res.download(zipFilePath, `${dataDir}.zip`, function (err) {
            if (err) {
                res.status(500).send({ error: `Error downloading ZIP file: ${err}` });
            } else {
                console.log("Downloaded ZIP file successfully!");

                fs.rmdirSync(`/tmp/${dataDir}`, { recursive: true });
                fs.unlinkSync(zipFilePath);
                fs.unlinkSync(`/tmp/templates/${templateFileToDelete}`);
                fs.unlinkSync(`/tmp/data/${excelFileToDelete}`);
            }
        });
    });

    archive.on('error', function (err) {
        console.error("Error creating archive: ", err);
        res.status(500).send({ error: `Error creating archive: ${err}` });
    });

    archive.pipe(output);

    console.log(`Adding files from ${dataDir} to archive`);
    archive.directory(`/tmp/${dataDir}`, false);

    await archive.finalize();
});


app.get('/', (req, res) => {
    res.send('Hello World!');
})


app.listen(3000, () => {
    console.log('Server listening on port 3000');
});


export const handler = serverless(app);
