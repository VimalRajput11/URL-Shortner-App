import http from "http";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const PORT = process.env.PORT || 3000;
// In-memory storage for links (simulate persistent storage)
const links = {};

// Helper function to serve static files
const serveFile = async (res, filename, contentType) => {
  try {
    const data = await fs.promises.readFile(filename);
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  } catch (error) {
    res.writeHead(404, { "Content-Type": "text/html" });
    res.end("<h1>404 - Page Not Found</h1>");
  }
};

// Create the server
const server = http.createServer(async (req, res) => {
  if (req.method === "GET") {
    if (req.url === "/") {
      // Serve the index.html file
      return serveFile(res, path.join("index.html"), "text/html");
    } else if (req.url === "/style.css") {
      // Serve the style.css file
      return serveFile(res, path.join( "style.css"), "text/css");
    } else if (req.url.startsWith("/")) {
      // Handle short URL redirection
      const shortCode = req.url.slice(1);
      if (links[shortCode]) {
        res.writeHead(301, { Location: links[shortCode] });
        res.end();
      } else {
        res.writeHead(404, { "Content-Type": "text/html" });
        res.end("<h1>404 - Shortcode not found</h1>");
      }
    }
  }

  if (req.method === "POST" && req.url === "/shorten") {
    let body = "";

    // Collect data from POST request
    req.on("data", (data) => {
      body += data;
    });

    req.on("end", () => {
      try {
        const { shortCode, url } = JSON.parse(body);

        if (!url) {
          res.writeHead(400, { "Content-Type": "text/plain" });
          return res.end("URL is required");
        }

        // Generate a short code if not provided
        const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");

        if (links[finalShortCode]) {
          res.writeHead(400, { "Content-Type": "text/plain" });
          return res.end("Short code already exists. Please choose another.");
        }

        // Store the URL in the links object
        links[finalShortCode] = url;

        // Send back the success response with shortCode and URL
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, shortCode: finalShortCode, url }));
      } catch (error) {
        console.error("Error processing POST request:", error);
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Server error");
      }
    });
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
