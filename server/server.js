require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const app = express();
const componentsPath = path.join(__dirname, 'components.json');
const customCssPath = path.join(__dirname, '../src', 'custom.css'); // Updated path for `custom.css`

// Rate limiter configuration
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(express.static('public'));
app.use(limiter);
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'], // Add your specific CDNs
            styleSrc: ["'self'", 'https://cdn.jsdelivr.net'],
            fontSrc: ["'self'", 'https://cdn.jsdelivr.net'],
            imgSrc: ["'self'", 'data:'],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
        }
    }
}));

// Endpoint: Update CSS Variables in custom.css
app.post('/api/update-css', async (req, res) => {
    try {
        const { cssVariables } = req.body;

        if (!cssVariables || typeof cssVariables !== 'object') {
            return res.status(400).json({ error: 'Invalid CSS variables payload.' });
        }

        // Convert the CSS variables object to valid CSS syntax
        const cssContent = Object.entries(cssVariables)
            .map(([key, value]) => `${key}: ${value};`)
            .join('\n');

        // Write the CSS variables to custom.css
        const cssFileContent = `:root {\n${cssContent}\n}`;
        fs.writeFileSync(customCssPath, cssFileContent, 'utf8');

        console.log('CSS updated successfully in custom.css');
        res.status(200).json({ message: 'CSS updated successfully!' });
    } catch (error) {
        console.error('Error updating CSS:', error);
        res.status(500).json({ error: 'Error updating CSS.' });
    }
});

// CRUD for Components
app.get('/api/components', (req, res) => {
    try {
        if (fs.existsSync(componentsPath)) {
            const components = JSON.parse(fs.readFileSync(componentsPath));
            res.json(components);
        } else {
            res.json([]);
        }
    } catch (error) {
        console.error('Error reading components file:', error);
        res.status(500).json({ error: 'Error reading components data.' });
    }
});

app.post('/api/components', (req, res) => {
    try {
        const { name, html } = req.body;
        if (!name || !html) {
            return res.status(400).json({ error: 'Name and HTML are required.' });
        }

        const components = fs.existsSync(componentsPath) ? JSON.parse(fs.readFileSync(componentsPath)) : [];
        const newComponent = { id: components.length + 1, name, html };
        components.push(newComponent);
        fs.writeFileSync(componentsPath, JSON.stringify(components));
        res.status(201).send();
    } catch (error) {
        console.error('Error adding new component:', error);
        res.status(500).json({ error: 'Error adding new component.' });
    }
});

app.get('/api/components/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    let components = JSON.parse(fs.readFileSync(componentsPath));
    const component = components.find(c => c.id === id);
    if (component) {
        res.json(component);
    } else {
        res.status(404).json({ error: 'Component not found.' });
    }
});

app.put('/api/components/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const { name, html } = req.body;

        if (!name || !html) {
            return res.status(400).json({ error: 'Name and HTML are required.' });
        }

        let components = JSON.parse(fs.readFileSync(componentsPath));
        const index = components.findIndex(c => c.id === id);

        if (index !== -1) {
            components[index] = { id, name, html };
            fs.writeFileSync(componentsPath, JSON.stringify(components));
            res.status(200).send();
        } else {
            res.status(404).json({ error: 'Component not found.' });
        }
    } catch (error) {
        console.error('Error updating component:', error);
        res.status(500).json({ error: 'Error updating component.' });
    }
});

app.delete('/api/components/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        let components = JSON.parse(fs.readFileSync(componentsPath));
        const index = components.findIndex(c => c.id === id);

        if (index !== -1) {
            components.splice(index, 1);
            fs.writeFileSync(componentsPath, JSON.stringify(components));
            res.status(200).send();
        } else {
            res.status(404).json({ error: 'Component not found.' });
        }
    } catch (error) {
        console.error('Error deleting component:', error);
        res.status(500).json({ error: 'Error deleting component.' });
    }
});

app.get('/api/components/:id/download', (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const components = JSON.parse(fs.readFileSync(componentsPath));
        const component = components.find(c => c.id === id);

        if (component) {
            res.setHeader('Content-Disposition', `attachment; filename=component_${id}.html`);
            res.setHeader('Content-Type', 'text/html');
            res.send(component.html);
        } else {
            res.status(404).json({ error: 'Component not found.' });
        }
    } catch (error) {
        console.error('Error downloading component:', error);
        res.status(500).json({ error: 'Error downloading component.' });
    }
});

// Start Server
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
