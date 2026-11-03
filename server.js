// Load the API key from the .env file
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
console.log("Weather API key loaded:", Boolean(WEATHER_API_KEY));

// Import Node.js tools that are already included in the installed Node.js version
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

// Define paths to the frontend and JSON data files
const publicFolder = path.join(__dirname, "Vejrapp", "public");
const usersFile = path.join(__dirname, "Vejrapp", "data", "users.json");
const weatherFile = path.join(__dirname, "Vejrapp", "data", "weather.json");

// Load user data and clothing recommendations
const users = JSON.parse(fs.readFileSync(usersFile, "utf8"));
const weather = JSON.parse(fs.readFileSync(weatherFile, "utf8"));

// Display loaded data in the terminal (Temporary for debugging)
console.log("Users loaded:", users.length);
console.log("Weather categories:", Object.keys(weather));

// Define the server port
const port = 3000;

// Define content types for files that can be sent to the browser
const contentTypes = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
};

// Create the actual HTTP server
const server = http.createServer((req, res) => {
  // Handle requests for clothing recommendations
  if (req.method === "GET" && req.url === "/api/clothing") {
    res.writeHead(200, {
      "Content-Type": "application/json",
    });

    res.end(JSON.stringify(weather));
    return;
  }

  // Get the requested file path
  let pathname = req.url;

  // Serve index.html when the root address is requested
  if (pathname === "/") {
    pathname = "/index.html";
  }

  // Find the requested file inside the frontend folder
  const filePath = path.join(publicFolder, pathname);

  // Read the requested file from the computer
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(err.code === "ENOENT" ? 404 : 500);
      res.end("File not found");
      return;
    }

    // Identify the file type using its extension
    const fileExtension = path.extname(filePath);
    const contentType =
      contentTypes[fileExtension] || "application/octet-stream";

    // Send the file with its corresponding content type
    res.writeHead(200, {
      "Content-Type": contentType,
    });

    res.end(data);
  });
});

// Start the server and listen for incoming requests
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
