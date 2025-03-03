const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());

// Route to scrape data
app.get('/scrape', async (req, res) => {
    const url = req.query.url; // Get the URL from the query parameter

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        // Fetch the HTML content of the page
        const { data } = await axios.get(url);

        // Load the HTML into cheerio
        const $ = cheerio.load(data);

        // Extract table data (only specific columns)
        const tableData = [];
        const uniqueTitles = new Set(); // To track unique titles

        $('table tr').each((i, row) => {
            const columns = $(row).find('td');

            // Check if the row has enough columns
            if (columns.length > 0) {
                const type = $(columns[4]).text().trim(); // Type column (index 4)
                console.log(`Type: ${type}`); // Debugging log

                // Filter rows where Type is "Issueable"
                if (type === 'Issueable') {
                    const title = $(columns[2]).text().trim();       // Title column (index 2)
                    const author = $(columns[3]).text().trim();      // Author column (index 3)
                    const publisher = $(columns[8]).text().trim();   // Publisher column (index 8)
                    const edition = $(columns[7]).text().trim();    // Edition column (index 7)
                    const callNo = $(columns[5]).text().trim();     // Call No. column (index 5)

                    console.log(`Title: ${title}, Author: ${author}, Publisher: ${publisher}, Edition: ${edition}, Call No.: ${callNo}`); // Debugging log

                    // Check if the title is already processed
                    if (!uniqueTitles.has(title)) {
                        uniqueTitles.add(title); // Add title to the set
                        tableData.push([title, author, publisher, edition, callNo]);
                    }
                }
            }
        });

        // If no books are found, return a message
        if (tableData.length === 0) {
            return res.json({ message: 'No books found' });
        }

        // Send the table data as a JSON response
        res.json(tableData);
    } catch (error) {
        console.error('Error scraping data:', error);
        res.status(500).json({ error: 'Failed to scrape data' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});