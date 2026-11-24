import "dotenv/config";
import { app } from "./app.js";

const PORT = Number(process.env.PORT ?? 3000);

app.listen(PORT, "0.0.0.0", (error) => {
    if (error) {
        console.error("Failed to start API:", error);
        process.exit(1);
    }

    console.log(`API running on port ${PORT}`);
});