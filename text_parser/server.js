const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Large limit for image data

// Veryfi API configuration
const VERYFI_CONFIG = {
  clientId: 'vrfjuzJUEiI0dmHvzCGc9MzBsA1rEnzm6ZnUna1',
  apiKey: 'jordanaking77:4e5b6cc249a3bd9b200d4c50cb342f38',
  baseUrl: 'https://api.veryfi.com/api/v8/partner/documents'
};

// Proxy endpoint for Veryfi uploads
app.post('/api/veryfi-upload', async (req, res) => {
  console.log('📤 Proxying Veryfi upload request...');

  try {
    const response = await axios({
      method: 'post',
      url: VERYFI_CONFIG.baseUrl,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'CLIENT-ID': VERYFI_CONFIG.clientId,
        'AUTHORIZATION': `apikey ${VERYFI_CONFIG.apiKey}`,
        'User-Agent': 'VeryfiProxy/1.0'
      },
      data: req.body,
      timeout: 60000 // 60 second timeout for image processing
    });

    console.log('✅ Veryfi upload successful:', response.status);
    res.json(response.data);

  } catch (error) {
    console.error('❌ Veryfi upload failed:', error.message);

    if (error.response) {
      console.error('📡 Status:', error.response.status);
      console.error('📡 Data:', error.response.data);
      res.status(error.response.status).json({
        error: error.response.data?.error || 'Veryfi API error',
        details: error.response.data
      });
    } else {
      res.status(500).json({
        error: 'Network error connecting to Veryfi',
        message: error.message
      });
    }
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Veryfi proxy server is running' });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log('🚀 Veryfi proxy server running on http://localhost:' + PORT);
  console.log('📋 Available endpoints:');
  console.log('   POST /api/veryfi-upload - Upload receipts to Veryfi');
  console.log('   GET  /api/health - Health check');
  console.log('💡 Update your React app to use: http://localhost:' + PORT + '/api/veryfi-upload');
}); 