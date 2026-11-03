// Load the API key from the .env file
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
console.log("Weather API key loaded:", Boolean(WEATHER_API_KEY));

// Import Node.js tools that are already included in the installed Node.js version
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

// Import backend classes
const User = require("./user");

// Define paths to the frontend and JSON data files
const publicFolder = path.join(__dirname, "..", "Vejrapp", "public");
const usersFile = path.join(__dirname, "..", "Vejrapp", "data", "users.json");
const weatherFile = path.join(
  __dirname,
  "..",
  "Vejrapp",
  "data",
  "weather.json",
);

// Load user data and weather data from the JSON files
const users = JSON.parse(fs.readFileSync(usersFile, "utf8"));
const weather = JSON.parse(fs.readFileSync(weatherFile, "utf8"));

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
const server = http.createServer(async (req, res) => {
  // Handle user registration
  if (req.method === "POST" && req.url === "/api/register") {
    let body = "";

    // Receive incoming data
    req.on("data", (chunk) => {
      body += chunk;
    });

    // Process the data when the request is complete
    req.on("end", () => {
      try {
        const userData = JSON.parse(body);

        // Check if email and password were provided
        if (!userData.email || !userData.password) {
          res.writeHead(400, {
            "Content-Type": "application/json",
          });

          res.end(JSON.stringify({ error: "Email and password are required" }));
          return;
        }

        // Convert the email address to lowercase
        userData.email = userData.email.toLowerCase();

        // Check if the email has a valid format
        const emailPattern = /^\S+@\S+\.\S+$/;

        if (!emailPattern.test(userData.email)) {
          res.writeHead(400, {
            "Content-Type": "application/json",
          });

          res.end(
            JSON.stringify({ error: "Please provide a valid email address" }),
          );
          return;
        }

        // Check if the email is already registered
        const existingUser = users.find(
          (user) => user.email.toLowerCase() === userData.email,
        );

        if (existingUser) {
          res.writeHead(400, {
            "Content-Type": "application/json",
          });

          res.end(JSON.stringify({ error: "User already exists" }));
          return;
        }
        userData.id = users.length + 1;
        const user = new User(userData);
        users.push(user);
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

        res.writeHead(200, {
          "Content-Type": "application/json",
        });

        res.end(JSON.stringify({ message: "Registration data received" }));
      } catch (error) {
        res.writeHead(400, {
          "Content-Type": "application/json",
        });

        res.end(JSON.stringify({ error: "Invalid JSON data" }));
      }
    });

    return;
  }

  // Handle requests for current weather
  if (req.method === "GET" && req.url.startsWith("/api/weather")) {
    const urlParts = req.url.split("?");

    // Check if a city was provided
    if (!urlParts[1]) {
      res.writeHead(400, {
        "Content-Type": "application/json",
      });

      res.end(JSON.stringify({ error: "Please provide a city" }));
      return;
    }

    const city = urlParts[1].split("=")[1];

    try {
      // Request current weather for the city provided by the user
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)},DK&units=metric&appid=${WEATHER_API_KEY}`,
      );

      // Check if the request was successful
      if (!response.ok) {
        res.writeHead(response.status, {
          "Content-Type": "application/json",
        });

        res.end(JSON.stringify({ error: "Could not retrieve weather data" }));
        return;
      }

      // Convert the response into a JavaScript object
      const weatherData = await response.json();

      // Send the weather data back to the browser
      res.writeHead(200, {
        "Content-Type": "application/json",
      });

      res.end(JSON.stringify(weatherData));
    } catch (error) {
      res.writeHead(500, {
        "Content-Type": "application/json",
      });

      res.end(JSON.stringify({ error: "Could not retrieve weather data" }));
    }

    return;
  }

  // Handle requests for clothing recommendations
  if (req.method === "GET" && req.url === "/api/clothing") {
    res.writeHead(200, {
      "Content-Type": "application/json",
    });

    res.end(JSON.stringify(weather));
    return;
  }

  // Handle requests for weather forecasts
  if (req.method === "GET" && req.url.startsWith("/api/forecast")) {
    const urlParts = req.url.split("?");

    // Check if a city was provided
    if (!urlParts[1]) {
      res.writeHead(400, {
        "Content-Type": "application/json",
      });

      res.end(JSON.stringify({ error: "Please provide a city" }));
      return;
    }

    const city = urlParts[1].split("=")[1];

    try {
      // Request the weather forecast for the specified city
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)},DK&units=metric&appid=${WEATHER_API_KEY}`,
      );

      // Check if the request was successful
      if (!response.ok) {
        res.writeHead(response.status, {
          "Content-Type": "application/json",
        });

        res.end(JSON.stringify({ error: "Could not retrieve forecast data" }));
        return;
      }

      // Convert the response into a JavaScript object
      const forecastData = await response.json();

      // Send the forecast data back to the browser
      res.writeHead(200, {
        "Content-Type": "application/json",
      });

      res.end(JSON.stringify(forecastData));
    } catch (error) {
      res.writeHead(500, {
        "Content-Type": "application/json",
      });

      res.end(JSON.stringify({ error: "Could not retrieve forecast data" }));
    }

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
