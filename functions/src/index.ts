/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onRequest } from "firebase-functions/v2/https";
import { adminDb } from "./firebaseAdmin";
import * as admin from "firebase-admin";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

const fetchResults: any = async (id: string) => {
	const apiKey = process.env.BRIGHTDATA_API_KEY;

	const res = await fetch(`https://api.brightdata.com/dca/dataset?id=${id}`, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${apiKey}`,
		},
	});
	const data = await res.json();
	if (data.status === "building" || data.status === "collecting") {
		console.log("Not complete yet, trying again...");
		return fetchResults(id);
	}
	return data;
};

export const onScraperComplete = onRequest(async (request, response) => {
	console.log("SCRAPE COMPLETE: ", request.body);

	const { success, id } = request.body;

	if (!success) {
		await adminDb.collection("searches").doc(id).set(
			{
				status: "error",
				updatedAt: admin.firestore.Timestamp.now(),
			},
			{
				merge: true,
			}
		);
	}

	const data = await fetchResults(id);

	await adminDb.collection("searches").doc(id).set(
		{
			status: "complete",
			updatedAt: admin.firestore.Timestamp.now(),
			results: data,
		},
		{
			merge: true,
		}
	);

	response.send("onScraperComplete finished!");
});

// creating a ngrok tunnel
// on the terminal: ngrok http 5001
// https://f27b-165-169-98-136.ngrok-free.app/data-scraper-8a73c/us-central1/onScraperComplete
