
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;

const publicFolder = path.join(__dirname, "public");
const filePath = path.join(publicFolder, "index.html");
const itemsFile = path.join(__dirname, "items.json");

// Create items.json automatically if it doesn't exist
if (!fs.existsSync(itemsFile)) {
    fs.writeFileSync(itemsFile, "[]", "utf8");
}

function readItems() {
    try {
        return JSON.parse(fs.readFileSync(itemsFile, "utf8"));
    } catch (error) {
        console.error("Error reading items:", error.message);
        return [];
    }
}

function saveItems(items) {
    fs.writeFileSync(itemsFile, JSON.stringify(items, null, 2), "utf8");
}

const server = http.createServer((req, res) => {
    // Allow cross-origin requests
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, DELETE, OPTIONS"
    );
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }

    // Get all saved items
    if (req.url === "/api/items" && req.method === "GET") {
        res.writeHead(200, {
            "Content-Type": "application/json; charset=utf-8"
        });
        res.end(JSON.stringify(readItems()));
        return;
    }

    // Add a new item
    if (req.url === "/api/items" && req.method === "POST") {
        let body = "";

        req.on("data", chunk => {
            body += chunk;

            if (body.length > 100000) {
                res.writeHead(413, {
                    "Content-Type": "application/json"
                });
                res.end(JSON.stringify({
                    error: "Item data is too large."
                }));
                req.destroy();
            }
        });

        req.on("end", () => {
            try {
                const newItem = JSON.parse(body);

                if (
                    !newItem.name ||
                    typeof newItem.name !== "string" ||
                    !newItem.category ||
                    typeof newItem.category !== "string"
                ) {
                    res.writeHead(400, {
                        "Content-Type": "application/json"
                    });
                    res.end(JSON.stringify({
                        error: "Item name and category are required."
                    }));
                    return;
                }

                const items = readItems();

                newItem.id = Date.now();
                newItem.available = true;

                items.push(newItem);
                saveItems(items);

                res.writeHead(201, {
                    "Content-Type": "application/json; charset=utf-8"
                });
                res.end(JSON.stringify({
                    message: "Item saved successfully!",
                    item: newItem
                }));
            } catch (error) {
                res.writeHead(400, {
                    "Content-Type": "application/json"
                });
                res.end(JSON.stringify({
                    error: "Invalid item data."
                }));
            }
        });

        return;
    }

    // Delete an item
    const deleteMatch = req.url.match(/^\/api\/items\/(\d+)$/);

    if (deleteMatch && req.method === "DELETE") {
        const itemId = Number(deleteMatch[1]);
        const items = readItems();
        const updatedItems = items.filter(
            item => Number(item.id) !== itemId
        );

        if (updatedItems.length === items.length) {
            res.writeHead(404, {
                "Content-Type": "application/json"
            });
            res.end(JSON.stringify({
                error: "Saved item not found."
            }));
            return;
        }

        saveItems(updatedItems);

        res.writeHead(200, {
            "Content-Type": "application/json"
        });
        res.end(JSON.stringify({
            message: "Item deleted successfully."
        }));
        return;
    }

    // Display the website
    if (req.url === "/" || req.url === "/index.html") {
        fs.readFile(filePath, "utf8", (err, data) => {
            if (err) {
                console.error("File error:", err.message);
                res.writeHead(500, {
                    "Content-Type": "text/plain"
                });
                res.end("Error loading LendLink website.");
                return;
            }

            res.writeHead(200, {
                "Content-Type": "text/html; charset=utf-8"
            });
            res.end(data);
        });

        return;
    }

    // Unknown URL
    res.writeHead(404, {
        "Content-Type": "application/json"
    });
    res.end(JSON.stringify({
        error: "Page not found."
    }));
});

// Start the server exactly once
server.listen(PORT, "0.0.0.0", () => {
    console.log(`LendLink running on port ${PORT}`);
});

server.on("error", err => {
    console.error("Server error:", err.message);
});
