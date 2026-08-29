import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

// The route: `app.post("/api/bookings", (req, res) => {`
content = content.replace('app.post("/api/bookings", (req, res) => {', 'app.post("/api/bookings", async (req, res) => {');

// The status route: `app.post("/api/bookings/:id/status", (req, res) => {`
content = content.replace('app.post("/api/bookings/:id/status", (req, res) => {', 'app.post("/api/bookings/:id/status", async (req, res) => {');

// Wait, what about `app.post("/api/bookings/:id/slip", async (req, res) => {`? It's already async.

fs.writeFileSync('server.ts', content);
