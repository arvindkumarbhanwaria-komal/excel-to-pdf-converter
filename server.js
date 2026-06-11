const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(express.static("public"));

if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
}

if (!fs.existsSync("pdfs")) {
    fs.mkdirSync("pdfs");
}

const upload = multer({
    dest: "uploads/",
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

app.post("/convert", upload.single("excel"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send("No file uploaded");
        }

        const workbook = XLSX.readFile(req.file.path);

        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        const data = XLSX.utils.sheet_to_json(sheet, {
            header: 1
        });

        const pdfName = Date.now() + ".pdf";
        const pdfPath = path.join("pdfs", pdfName);

        const doc = new PDFDocument();
        const stream = fs.createWriteStream(pdfPath);

        doc.pipe(stream);

        data.forEach((row) => {
            doc.text(row.join(" | "));
            doc.moveDown();
        });

        doc.end();

        stream.on("finish", () => {
            fs.unlinkSync(req.file.path);

            res.download(pdfPath, () => {
                if (fs.existsSync(pdfPath)) {
                    fs.unlinkSync(pdfPath);
                }
            });
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error converting file");
    }
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Server Running On Port ${PORT}`);
});