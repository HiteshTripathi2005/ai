import app from "./app.js";
import {config} from "dotenv";

config();

const PORT = process.env.PORT || 5000;

// Start server without MCP initialization
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
