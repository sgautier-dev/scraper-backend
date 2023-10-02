/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

export const onScraperComplete = onRequest((request, response) => {
	console.log("SCRAPE COMPLETE: ", request.body);
	logger.info("Hello logs!", { structuredData: true });
	response.send("Hello from Firebase!");
});

// creating a ngrok tunnel
// on the terminal: ngrok http 5001
// https://f27b-165-169-98-136.ngrok-free.app/data-scraper-8a73c/us-central1/onScraperComplete
