const fs = require('fs');
const path = require('path');
const https = require('https');

// Helper to download file
const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to download: ${response.statusCode}`));
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
};

const run = async () => {
  try {
    // Roboto Regular
    console.log('Downloading Roboto-Regular...');
    await download(
      'https://cdnjs.cloudflare.com/ajax/libs/roboto-fontface/0.10.0/fonts/roboto/Roboto-Regular.ttf',
      path.join(__dirname, 'src', 'fonts', 'Roboto-Regular.ttf')
    );

    // Roboto Bold
    console.log('Downloading Roboto-Bold...');
    await download(
      'https://cdnjs.cloudflare.com/ajax/libs/roboto-fontface/0.10.0/fonts/roboto/Roboto-Bold.ttf',
      path.join(__dirname, 'src', 'fonts', 'Roboto-Bold.ttf')
    );

    console.log('Fonts downloaded!');
  } catch (error) {
    console.error('Error:', error.message);
  }
};

run();
