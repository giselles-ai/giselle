/**
 * Storage Migration Tool
 *
 * This script migrates files from Vercel Blob storage to Supabase storage.
 * It lists files with a specific prefix from Vercel Blob, downloads each file,
 * and uploads it to Supabase storage with a modified path.
 *
 * Example usage:
 *
 * Option 1: Using environment variables directly
 * ```bash
 * # Set required environment variables
 * export SUPABASE_URL="https://your-project.supabase.co"
 * export SUPABASE_SERVICE_KEY="your-service-key"
 * export VERCEL_BLOB_KEY="your-vercel-blob-key"
 * export DRY_RUN="true" # Optional: Set to true for dry run
 *
 * # Run the migration script
 * node --experimental-strip-types ./index.ts
 * ```
 *
 * Option 2: Using a .env file (Node.js v22.14+ built-in support)
 * ```bash
 * # Create a .env file with the following content:
 * # SUPABASE_URL=https://your-project.supabase.co
 * # SUPABASE_SERVICE_KEY=your-service-key
 * # VERCEL_BLOB_KEY=your-vercel-blob-key
 * # DRY_RUN=true # Optional: Set to true for dry run
 *
 * # Run with built-in env file support
 * node --env-file=.env --experimental-strip-types ./index.ts
 * ```
 *
 * Environment variables required:
 * - SUPABASE_URL: Supabase project URL
 * - SUPABASE_SERVICE_KEY: Supabase service role key
 * - VERCEL_BLOB_KEY: Vercel Blob read access token
 * - DRY_RUN: (Optional) Set to "true" to simulate migration without uploading
 */

import { createClient } from "@supabase/supabase-js";
import { head, list } from "@vercel/blob";
import { migratePathname } from "./migrate-pathname.ts";

// ANSI color codes for terminal output
const colors = {
	reset: "\x1b[0m",
	bright: "\x1b[1m",
	dim: "\x1b[2m",
	underscore: "\x1b[4m",
	blink: "\x1b[5m",
	reverse: "\x1b[7m",
	hidden: "\x1b[8m",

	fg: {
		black: "\x1b[30m",
		red: "\x1b[31m",
		green: "\x1b[32m",
		yellow: "\x1b[33m",
		blue: "\x1b[34m",
		magenta: "\x1b[35m",
		cyan: "\x1b[36m",
		white: "\x1b[37m",
		crimson: "\x1b[38m",
	},

	bg: {
		black: "\x1b[40m",
		red: "\x1b[41m",
		green: "\x1b[42m",
		yellow: "\x1b[43m",
		blue: "\x1b[44m",
		magenta: "\x1b[45m",
		cyan: "\x1b[46m",
		white: "\x1b[47m",
		crimson: "\x1b[48m",
	},
};

// Get environment variables for API connections
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const vercelBlobKey = process.env.VERCEL_BLOB_KEY;
const isDryRun = process.env.DRY_RUN === "true";

// Validate required environment variables
if (!(supabaseUrl && supabaseKey && vercelBlobKey)) {
	throw new Error("Missing Supabase URL or key");
}

console.log(
	`${colors.bright}${colors.fg.cyan}=== Starting storage migration from Vercel Blob to Supabase ${isDryRun ? "(DRY RUN)" : ""} ===${colors.reset}`,
);
// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {});

// Track migration progress
let cursor: string | undefined; // Pagination cursor for listing blobs
let totalProcessed = 0; // Total number of files processed
let successCount = 0; // Successfully migrated files
let alreadyCount = 0; // Files that already exist in Supabase
let errorCount = 0; // Files that failed to migrate
let batchNumber = 0; // Current batch number

// Main processing loop - continues until there are no more files to process
do {
	batchNumber++;
	console.log(
		`\n${colors.fg.blue}▶ Processing batch #${batchNumber}${colors.reset}`,
	);

	// List files from Vercel Blob storage with pagination
	const listResult = await list({
		cursor, // Pagination token for next batch
		limit: 20, // Number of files to process per batch
		prefix: "private-beta", // Only process files with this prefix
		token: vercelBlobKey, // Vercel Blob API token
	});

	console.log(
		`${colors.fg.yellow}Found ${listResult.blobs.length} blobs in this batch${colors.reset}`,
	);

	// Process all files in this batch in parallel
	await Promise.all(
		listResult.blobs.map(async (blob) => {
			// Extract original path and create new path (removing first segment)
			const originalPathname = blob.pathname;
			const newPathname = migratePathname(blob.pathname);

			try {
				const metadata = await head(blob.url, {
					token: vercelBlobKey, // Vercel Blob API token
				});
				// Download the file from Vercel Blob
				const file = await fetch(blob.downloadUrl).then((res) => res.blob());

				if (isDryRun) {
					// In dry run mode, log what would happen but don't actually upload
					console.log(
						` ├ ${colors.fg.cyan}🔍 DRY RUN: Would upload ${originalPathname} -> ${newPathname} (${metadata.size}, ${metadata.contentType})${colors.reset}`,
					);
					successCount++; // Count as success in dry run mode
				} else {
					// Upload the file to Supabase storage bucket in non-dry-run mode
					const result = await supabase.storage
						.from("app") // Target bucket name
						.upload(newPathname, file, {
							contentType: metadata.contentType,
						});
					const _data = result.data;
					const error = result.error;

					if (error) {
						// Handle case where file already exists in Supabase
						if (error.message === "The resource already exists") {
							console.log(
								` ├ ${colors.dim}The resource already exists: ${newPathname}${colors.reset}`,
							);
							alreadyCount++;
						} else {
							// Handle other upload errors
							console.error(
								` ├ ${colors.fg.red}✘ Error uploading ${newPathname}:${colors.reset}`,
								error,
							);
							errorCount++;
						}
					} else {
						// Log successful migration
						console.log(
							` ├ ${colors.fg.green}✓ Successfully migrated: ${newPathname}${colors.reset}`,
						);
						successCount++;
					}
				}
			} catch (error) {
				// Handle unexpected errors (network issues, etc.)
				console.error(
					` ├ ${colors.fg.red}✘ Exception processing ${newPathname}:${colors.reset}`,
					error,
				);
				errorCount++;
			}

			// Increment total files processed counter
			totalProcessed++;
		}),
	);

	// Store cursor for next batch of files
	cursor = listResult.cursor;

	// Display batch summary statistics
	console.log(
		`${colors.fg.magenta}Batch #${batchNumber} complete - ${colors.fg.green}Success: ${successCount}${colors.reset}, ${colors.dim}Already: ${alreadyCount}${colors.reset}, ${colors.fg.red}Errors: ${errorCount}${colors.reset}, ${colors.fg.blue}Total: ${totalProcessed}${colors.reset}`,
	);

	// If there are more files to process, display cursor information
	if (cursor) {
		console.log(
			`${colors.fg.cyan}Continuing to next batch with cursor: ${cursor}...${colors.reset}`,
		);
	}
} while (cursor);

// Display final summary when all batches have been processed
console.log(
	`\n${colors.bright}${colors.fg.green}✅ Storage migration complete!${colors.reset}`,
);
console.log(
	`${colors.bright}${colors.fg.cyan}Final results: ${colors.reset}${colors.fg.blue}Processed ${totalProcessed} files ${colors.reset}(${colors.fg.green}${successCount} successful${colors.reset}, ${colors.fg.red}${errorCount} failed${colors.reset}, ${colors.dim}${alreadyCount} already existed${colors.reset})${isDryRun ? ` ${colors.bright}${colors.fg.yellow}[DRY RUN]${colors.reset}` : ""}`,
);
