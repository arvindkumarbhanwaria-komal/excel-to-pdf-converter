const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("excel");
const fileName = document.getElementById("fileName");
const msg = document.getElementById("msg");
const loader = document.getElementById("loader");
const progressContainer = document.getElementById("progressContainer");
const progressBar = document.getElementById("progressBar");

/* FILE SELECT */
fileInput.addEventListener("change", function () {
    if (this.files.length > 0) {
        const file = this.files[0];

        fileName.innerText =
            `📄 ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
    }
});

/* DRAG OVER */
dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
});

/* DRAG LEAVE */
dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
});

/* DROP */
dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");

    const files = e.dataTransfer.files;

    if (files.length > 0) {
        fileInput.files = files;

        const file = files[0];

        fileName.innerText =
            `📄 ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
    }
});

/* CONVERT */
async function uploadFile() {

    if (fileInput.files.length === 0) {
        msg.innerHTML = "⚠ Please select an Excel file";
        msg.style.color = "#ff6b6b";
        return;
    }

    const file = fileInput.files[0];

    loader.style.display = "block";
    progressContainer.style.display = "block";

    progressBar.style.width = "20%";

    msg.style.color = "#ffffff";
    msg.innerHTML = "📤 Uploading file...";

    let progress = 20;

    const progressInterval = setInterval(() => {

        if (progress < 85) {

            progress++;

            progressBar.style.width = progress + "%";

            msg.innerHTML =
                `📄 ${file.name}<br>⏳ Converting... ${progress}%`;
        }  else {

        msg.innerHTML =
            "🚀 Finalizing PDF... Please wait";
    }

    }, 150);

    const formData = new FormData();
    formData.append("excel", file);

    try {

        const response = await fetch("/convert", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error("Conversion failed");
        }

        const blob = await response.blob();

        clearInterval(progressInterval);

        const url = window.URL.createObjectURL(blob);

        const a = document.createElement("a");

        a.href = url;
        a.download = "converted.pdf";

        document.body.appendChild(a);

        progressBar.style.width = "100%";

        msg.style.color = "#22c55e";
        msg.innerHTML = "✅ PDF Downloaded Successfully! (100%)";

        a.click();
        a.remove();

        window.URL.revokeObjectURL(url);

    } catch (err) {

        clearInterval(progressInterval);

        console.error(err);

        msg.style.color = "#ff6b6b";
        msg.innerHTML = "❌ Conversion Failed";

    } finally {

        loader.style.display = "none";

        setTimeout(() => {

            progressContainer.style.display = "none";
            progressBar.style.width = "0%";

        }, 1500);
    }
}