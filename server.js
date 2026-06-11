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

const upload = multer({
    dest: "uploads/",
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

app.post("/convert", upload.single("excel"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send("No file uploaded");
        }

        const workbook = XLSX.readFile(req.file.path, {
            dense: true
        });

        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        const data = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            raw: false
        });

        fs.unlink(req.file.path, () => {});

        const doc = new PDFDocument({
            margin: 20,
            size: "A4",
            compress: true
        });

        const pdfName =
            path.parse(req.file.originalname).name + ".pdf";

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${pdfName}"`
        );

        res.setHeader(
            "Content-Type",
            "application/pdf"
        );

        doc.pipe(res);

        doc.fontSize(8);

        const MAX_ROWS = 15000;

        for (
            let i = 0;
            i < Math.min(data.length, MAX_ROWS);
            i++
        ) {
            const row = data[i];

            doc.text(
                row
                    .map(cell =>
                        cell === undefined ? "" : String(cell)
                    )
                    .join(" | "),
                {
                    width: 550
                }
            );
        }

        doc.end();
    } catch (err) {
        console.error(err);
        res.status(500).send("Conversion Failed");
    }
});

app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "public", "index.html")
    );
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Server Running On Port ${PORT}`);
});