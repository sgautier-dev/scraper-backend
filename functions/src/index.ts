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
// import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

type FetchResult = {
	id: string;
	collector_id: string;
	trigger: {
		type: string;
		user: string;
		ip: string;
	};
	inputs: number;
	page_loads: number;
	data_lines: number;
	failed_pages: number;
	total_pages: number;
	created: string;
	finished: string;
	dataset_file: string;
	success: boolean;
	status?: string;
};

const fetchResults = async (id: string): Promise<FetchResult | null> => {
	const apiKey = process.env.BRIGHTDATA_API_KEY;

	const res = await fetch(`https://api.brightdata.com/dca/dataset?id=${id}`, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${apiKey}`,
		},
	});

	// console.log("Raw response:", await res.text());

	let data;
	if (res.ok) {
		try {
			data = await res.json();
		} catch (e) {
			console.error("Could not parse JSON:", e);
		}
	} else {
		console.error("Fetch was not successful:", res.status);
	}

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
				updatedAt: Timestamp.now(),
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
			updatedAt: Timestamp.now(),
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
// https://f17f-165-169-98-136.ngrok-free.app/data-scraper-8a73c/us-central1/onScraperComplete
