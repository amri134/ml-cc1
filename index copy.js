// Imports the Google Cloud client library
const vision = require('@google-cloud/vision');
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set the environment variable for authentication
process.env.GOOGLE_APPLICATION_CREDENTIALS = 'D:\\Bangkit\\Capstone\\percobaan\\ML\\byetrashfe7bd0081778.json';

// Creates a client
const client = new vision.ImageAnnotatorClient();

// Initialize Express app
const app = express();
const upload = multer({ dest: 'uploads/' });

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve the HTML form for uploading images or capturing from the camera
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/upload', upload.single('image'), async (req, res) => {
    let filePath;
    if (req.file) {
        filePath = path.join(__dirname, req.file.path);
    } else if (req.body.image) {
        const base64Data = req.body.image.replace(/^data:image\/png;base64,/, "");
        filePath = path.join(__dirname, 'uploads', 'camera_image.png');
        fs.writeFileSync(filePath, base64Data, 'base64');
    }

    try {
        // Performs label detection on the uploaded file
        const [result] = await client.labelDetection(filePath);
        const labels = result.labelAnnotations;

        // Expanded list of recyclable materials
        const recyclableLabels = [
            'Plastic', 'Paper', 'Glass', 'Metal', 'Cardboard', 'Aluminum', 'Steel', 'Tin', 'Copper', 'Electronics', 'Batteries'
        ];
        const isRecyclable = labels.some(label => recyclableLabels.includes(label.description));

        let message;
        if (isRecyclable) {
            message = 'The waste is recyclable. Put it into recycling.';
        } else {
            message = 'The waste cannot be recycled.';
        }

        // Send response with labels and prediction result
        res.send(`
            <h1>Prediction Result</h1>
            <p>${message}</p>
            <h2>Labels Detected:</h2>
            <ul>
                ${labels.map(label => `<li>${label.description} (${(label.score * 100).toFixed(2)}%)</li>`).join('')}
            </ul>
            <a href="/">Upload another image</a>
        `);
    } catch (error) {
        console.error('Error processing image:', error);
        res.status(500).send('Error processing image.');
    } finally {
        // Clean up the uploaded file
        if (req.file) {
            fs.unlinkSync(filePath);
        }
    }
});

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});