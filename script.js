// Variables to store the image data and LSB count
let coverImageData;
let resultCanvas = document.getElementById("resultCanvas");
let resultCtx = resultCanvas.getContext("2d");
let lsbCount;

// Function to open the file input dialog
function selectImage() {
    document.getElementById("imageInput").click();
}

// Load the image when selected
document.getElementById("imageInput").addEventListener("change", function (e) {
    let file = e.target.files[0];
    if (!file) {
        alert("No file selected. Please select a BMP image file.");
        return;
    }
    
    let coverCanvas = document.getElementById("coverCanvas");
    let coverCtx = coverCanvas.getContext("2d");
    let img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = function () {
        coverCanvas.width = img.width;
        coverCanvas.height = img.height;
        coverCtx.drawImage(img, 0, 0);
        coverImageData = coverCtx.getImageData(0, 0, img.width, img.height);
        
        // Set up result canvas
        resultCanvas.width = img.width;
        resultCanvas.height = img.height;
        resultCtx.putImageData(coverImageData, 0, 0);
    };
});

// Convert text to binary
function textToBinary(text) {
    return text
        .split("")
        .map((char) => char.charCodeAt(0).toString(2).padStart(8, "0"))
        .join("");
}

// Convert binary to text
function binaryToText(binary) {
    return binary
        .match(/.{1,8}/g)
        .map((byte) => String.fromCharCode(parseInt(byte, 2)))
        .join("");
}

// Hide the text within the image using LSB encoding
function hideText() {
    if (!coverImageData) {
        alert("Please select an image first.");
        return;
    }

    let text = document.getElementById("secretText").value;
    if (!text) {
        alert("Please enter the text to hide.");
        return;
    }

    lsbCount = parseInt(document.getElementById("lsbCount").value);
    let binaryText = textToBinary(text) + "00000000"; // End marker
    let data = new Uint8ClampedArray(coverImageData.data);
    let binaryIndex = 0;

    for (let i = 0; i < data.length; i += 4) {
        if (binaryIndex >= binaryText.length) break;

        for (let j = 0; j < 3; j++) { // RGB channels only
            if (binaryIndex >= binaryText.length) break;
            data[i + j] = (data[i + j] & ~((1 << lsbCount) - 1)) | parseInt(binaryText.slice(binaryIndex, binaryIndex + lsbCount), 2);
            binaryIndex += lsbCount;
        }
    }

    let resultImageData = new ImageData(data, coverImageData.width, coverImageData.height);
    resultCtx.putImageData(resultImageData, 0, 0);
}

// Restore the text from the image
function restoreText() {
    if (!coverImageData) {
        alert("Please hide the text in an image first.");
        return;
    }

    lsbCount = parseInt(document.getElementById("lsbCount").value);
    let data = resultCtx.getImageData(0, 0, resultCanvas.width, resultCanvas.height).data;
    let binaryText = "";

    for (let i = 0; i < data.length; i += 4) {
        for (let j = 0; j < 3; j++) {
            binaryText += (data[i + j] & ((1 << lsbCount) - 1)).toString(2).padStart(lsbCount, "0");
        }
    }

    let extractedText = binaryToText(binaryText).split("\x00")[0];
    document.getElementById("restoredText").value = extractedText;
}

// Save the result image
function saveImage() {
    let link = document.createElement("a");
    link.download = "result_image.bmp";
    link.href = resultCanvas.toDataURL("image/bmp");
    link.click();
}
