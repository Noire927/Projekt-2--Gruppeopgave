// Import Node.js tools
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

// Load the API key from the .env file
process.loadEnvFile(path.join(__dirname, "../.env"));
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
console.log("Weather API key loaded:", Boolean(WEATHER_API_KEY));

// Import backend classes
const UserManager = require("./user-manager");
const Authentication = require("./authentication");

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
const dislikeMessagesFile = path.join(
  __dirname,
  "..",
  "Vejrapp",
  "data",
  "dislike-messages.json",
);

// Load user data and weather data from the JSON files
const users = JSON.parse(fs.readFileSync(usersFile, "utf8"));
const weather = JSON.parse(fs.readFileSync(weatherFile, "utf8"));
const dislikeMessages = JSON.parse(
  fs.readFileSync(dislikeMessagesFile, "utf8"),
);

// Create the user manager
const userManager = new UserManager(users, usersFile);

// Create authentication
const authentication = new Authentication(userManager);

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
        const existingUser = userManager.findByEmail(userData.email);

        if (existingUser) {
          res.writeHead(400, {
            "Content-Type": "application/json",
          });

          res.end(JSON.stringify({ error: "User already exists" }));
          return;
        }

        // Register the new user
        userManager.addUser(userData);

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

  // Handle user login
  if (req.method === "POST" && req.url === "/api/login") {
    let body = "";

    // Receive incoming data
    req.on("data", (chunk) => {
      body += chunk;
    });

    // Process the data when the request is complete
    req.on("end", () => {
      try {
        const loginData = JSON.parse(body);

        // Check if email and password were provided
        if (!loginData.email || !loginData.password) {
          res.writeHead(400, {
            "Content-Type": "application/json",
          });

          res.end(JSON.stringify({ error: "Email and password are required" }));
          return;
        }

        // Convert the email address to lowercase
        loginData.email = loginData.email.toLowerCase();

        // Authenticate the user and generate a login token
        const token = authentication.login(loginData.email, loginData.password);

        // Check if the login was successful
        if (!token) {
          res.writeHead(401, {
            "Content-Type": "application/json",
          });

          res.end(JSON.stringify({ error: "Invalid email or password" }));
          return;
        }

        // Send the token to the frontend
        res.writeHead(200, {
          "Content-Type": "application/json",
        });

        res.end(
          JSON.stringify({
            message: "Login successful",
            token: token,
          }),
        );
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
    const url = new URL(req.url, `http://${req.headers.host}`);
    const city = url.searchParams.get("city");

    // Check if a city was provided
    if (!city) {
      res.writeHead(400, {
        "Content-Type": "application/json",
      });

      res.end(JSON.stringify({ error: "Please provide a city" }));
      return;
    }

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

  // Handle coordinate requests from location.js.
  if (req.method === "GET" && req.url.startsWith("/api/location?")) {
    // Read the coordinates from the request.
    const url = new URL(req.url, "http://localhost");
    const lat = Number(url.searchParams.get("lat")?.trim() || NaN);
    const lon = Number(url.searchParams.get("lon")?.trim() || NaN);

    res.setHeader("Content-Type", "application/json");

    // Reject missing or invalid coordinates.
    if (
      !Number.isFinite(lat) ||
      Math.abs(lat) > 90 ||
      !Number.isFinite(lon) ||
      Math.abs(lon) > 180
    ) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "Invalid coordinates" }));
      return;
    }

    try {
      // Ask OpenWeather for the nearest city.
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${WEATHER_API_KEY}`,
      );
      const cities = await response.json();

      if (!response.ok || !cities[0]?.name) {
        throw new Error("City lookup failed");
      }

      // Return the city name expected by location.js.
      res.end(JSON.stringify({ city: cities[0].name }));
    } catch {
      // Return an error if the lookup fails.
      res.statusCode = 502;
      res.end(JSON.stringify({ error: "Could not find a city" }));
    }

    return; // Stop before the static-file handler.
  }

  // Handle requests for clothing recommendations
  if (req.method === "GET" && req.url.startsWith("/api/clothing")) {
    // Get the login token from the request header
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    // Set the default clothing preferences for guests
    let preferences = {
      ageGroup: "voksen",
      gender: "other",
      style: "classy",
      likedClothes: [],
      dislikedClothes: [],
    };

    // Check if the user is logged in
    if (token && authentication.verifyToken(token)) {
      // Get the user associated with the login token
      const userId = authentication.getUserId(token);
      const user = userManager.findById(userId);

      // Get the user's saved preferences
      if (user && user.preferences) {
        preferences = {
          ...preferences,
          ...user.preferences,
          ageGroup: user.preferences.ageGroup || "voksen",
          gender: user.preferences.gender || "other",
          style: user.preferences.style || "classy",
        };
      }
    }

    // Get the city from the URL
    const url = new URL(req.url, `http://${req.headers.host}`);
    const city = url.searchParams.get("city");

    // Check if a city was provided
    if (!city) {
      res.writeHead(400, {
        "Content-Type": "application/json",
      });

      res.end(JSON.stringify({ error: "Please provide a city" }));
      return;
    }

    try {
      // Request current weather for the specified city
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

      // Get the weather condition ID
      const weatherId = weatherData.weather[0].id;

      // Match the weather condition to a category in weather.json
      let weatherCategory;

      if (weatherId === 800) {
        weatherCategory = "sunny";
      } else if (weatherId >= 801 && weatherId <= 804) {
        weatherCategory = "cloudy";
      } else if (
        (weatherId >= 300 && weatherId <= 321) ||
        (weatherId >= 500 && weatherId <= 531)
      ) {
        weatherCategory = "rainy";
      } else if (weatherId >= 600 && weatherId <= 622) {
        weatherCategory = "snowy";
      } else if ([701, 711, 721, 741].includes(weatherId)) {
        weatherCategory = "foggy";
      } else if ([731, 751, 761, 762].includes(weatherId)) {
        weatherCategory = "dusty";
      } else if (
        (weatherId >= 200 && weatherId <= 232) ||
        weatherId === 771 ||
        weatherId === 781
      ) {
        weatherCategory = "stormy";
      }

      // Check if the weather condition has a matching category
      if (!weatherCategory) {
        res.writeHead(400, {
          "Content-Type": "application/json",
        });

        res.end(JSON.stringify({ error: "Unsupported weather condition" }));
        return;
      }

      // Find the clothing recommendation matching the weather and user preferences
      const recommendation =
        weather[weatherCategory].descriptions[preferences.ageGroup]?.[
          preferences.gender
        ]?.[preferences.style];

      // Check if a matching recommendation exists
      if (!recommendation) {
        res.writeHead(400, {
          "Content-Type": "application/json",
        });

        res.end(
          JSON.stringify({
            error: "Could not find a matching clothing recommendation",
          }),
        );
        return;
      }

      // Append only messages for clothes the user disliked.
      const personalizedNote = (preferences.dislikedClothes || [])
        .map((item) => dislikeMessages[item])
        .filter(Boolean)
        .join(" ");
      const finalRecommendation = personalizedNote
        ? recommendation + "<br><br>" + personalizedNote
        : recommendation;

      // Return the clothing recommendation
      res.writeHead(200, {
        "Content-Type": "application/json",
      });

      res.end(
        JSON.stringify({
          category: weatherCategory,
          recommendation: finalRecommendation,
        }),
      );
    } catch (error) {
      console.error(error);
      res.writeHead(500, {
        "Content-Type": "application/json",
      });

      res.end(
        JSON.stringify({ error: "Could not retrieve clothing recommendation" }),
      );
    }
    return;
  }

  // Handle requests for weather forecasts
  if (req.method === "GET" && req.url.startsWith("/api/forecast")) {
    // Get the city from the URL
    const url = new URL(req.url, `http://${req.headers.host}`);
    const city = url.searchParams.get("city");

    // Check if a city was provided
    if (!city) {
      res.writeHead(400, {
        "Content-Type": "application/json",
      });

      res.end(JSON.stringify({ error: "Please provide a city" }));
      return;
    }

    try {
      // Request the weather forecast for the specified city
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)},DK&units=metric&lang=da&appid=${WEATHER_API_KEY}`,
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

  // Handle requests for user preferences
  if (req.method === "GET" && req.url === "/api/preferences") {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    // Verify the login token
    if (!authentication.verifyToken(token)) {
      res.writeHead(401, {
        "Content-Type": "application/json",
      });

      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }

    // Find the user associated with the login token
    const userId = authentication.getUserId(token);
    const user = userManager.findById(userId);

    // Return the user's preferences
    res.writeHead(200, {
      "Content-Type": "application/json",
    });

    res.end(JSON.stringify(user.preferences || {}));
    return;
  }

  // Handle requests to save user preferences
  if (req.method === "POST" && req.url === "/api/preferences") {
    // Get the login token from the request header
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    // Verify the login token
    if (!authentication.verifyToken(token)) {
      res.writeHead(401, {
        "Content-Type": "application/json",
      });

      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }

    let body = "";

    // Receive incoming data
    req.on("data", (chunk) => {
      body += chunk;
    });

    // Process the data when the request is complete
    req.on("end", () => {
      try {
        const preferences = JSON.parse(body);

        // Get the user ID associated with the login token
        const userId = authentication.getUserId(token);

        // Save the user's preferences
        const updated = userManager.updatePreferences(userId, preferences);

        if (!updated) {
          res.writeHead(404, {
            "Content-Type": "application/json",
          });

          res.end(JSON.stringify({ error: "User not found" }));
          return;
        }

        res.writeHead(200, {
          "Content-Type": "application/json",
        });

        res.end(JSON.stringify({ message: "Preferences saved" }));
      } catch (error) {
        res.writeHead(400, {
          "Content-Type": "application/json",
        });

        res.end(JSON.stringify({ error: "Invalid JSON data" }));
      }
    });

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

    // Send the file with the corresponding content type
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
