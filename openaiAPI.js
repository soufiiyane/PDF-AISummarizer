const express = require('express');
const app = express();
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();
const cors = require('cors');

app.use(cors());

app.get('/api/summarize', async (req, res) => {
    try {
        const { prompt } = req.query; // Extract prompt from query parameter

        if (!prompt) {
            // Check if prompt is provided
            return res.status(400).json({
                error: 'Prompt is required',
            });
        }

        const configuration = new Configuration({
            apiKey: process.env.OPEN_API_KEY,
        });
        const openai = new OpenAIApi(configuration);
        const comp = await openai.createCompletion({
            model: 'text-davinci-003',
            max_tokens: 2048,
            prompt: `I want you to act like a pdf text summarizer. I will input text from a pdf and your job is to convert it into a useful summary of a few sentences. Do not repeat sentences and make them clear and concise, : "${prompt}"`, // Use prompt from query parameter
        });
        res.header('Access-Control-Allow-Origin', '*');
        res.status(200).json({
            summary: comp.data.choices[0].text,
        });
    } catch (error) {
        // Handle errors
        console.error(error);
        res.status(500).json({
            error: 'Failed to summarize text',
        });
    }
});

app.use(express.static('public'));

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
