const http = require('http');

// Function to make a simple HTTP request and log the response
function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

// Test server endpoints
async function checkServer() {
  console.log('Carbon Prospect Server Test\n');
  console.log('Checking if server is running on port 3001...\n');
  
  try {
    // 1. Test health endpoint
    console.log('1. Testing /api/health endpoint');
    const healthResult = await makeRequest('http://localhost:3001/api/health');
    
    if (healthResult.statusCode === 200) {
      console.log('✅ Server is running! Health check passed.\n');
    } else {
      console.log(`❌ Health check failed with status ${healthResult.statusCode}\n`);
    }
    
    // 2. Test auth endpoint existence
    console.log('2. Testing if /api/auth routes are accessible');
    
    // We expect a 404 or 405 but not a connection refused
    try {
      const authResult = await makeRequest('http://localhost:3001/api/auth/register');
      
      if (authResult.statusCode === 404) {
        console.log('❌ Auth endpoint not found (404). Your API routes are not set up correctly.\n');
      } else if (authResult.statusCode === 405 || authResult.statusCode === 400) {
        console.log('✅ Auth endpoint exists but requires POST method (good).\n');
      } else {
        console.log(`⚠️ Auth endpoint returned status ${authResult.statusCode}\n`);
      }
    } catch (err) {
      console.log('❌ Could not connect to auth endpoint:', err.message, '\n');
    }
    
    // 3. Test API documentation
    console.log('3. Testing API documentation endpoint');
    try {
      const docsResult = await makeRequest('http://localhost:3001/api');
      
      if (docsResult.statusCode === 200) {
        console.log('✅ API documentation endpoint is accessible.\n');
        
        try {
          // Parse the JSON to check for endpoints
          const docs = JSON.parse(docsResult.data);
          const authEndpoints = docs.endpoints.filter(e => e.path.includes('/api/auth'));
          
          if (authEndpoints.length > 0) {
            console.log('✅ Auth endpoints are correctly listed in API documentation:');
            authEndpoints.forEach(e => {
              console.log(`   - ${e.method} ${e.path}: ${e.description}`);
            });
          } else {
            console.log('❌ No auth endpoints found in API documentation.');
          }
        } catch (e) {
          console.log('⚠️ API documentation endpoint returned non-JSON data');
        }
      } else {
        console.log(`❌ API documentation endpoint failed with status ${docsResult.statusCode}\n`);
      }
    } catch (err) {
      console.log('❌ Could not connect to API documentation endpoint:', err.message, '\n');
    }
    
    console.log('\nTest complete! If you see any failures, check your server.js and route setup.');
    
  } catch (error) {
    console.error('❌ Server is not running or not accessible:', error.message);
    console.log('\nMake sure to start your server with:');
    console.log('  node server.js');
  }
}

// Run the test
checkServer();