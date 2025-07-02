import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { db, oauthCredentials, supabaseUserMappings } from "@/drizzle";
import { getSession, signIn, signOut } from "./_utils/auth";
import { GoogleSheetsSelection } from "./google-sheets-selection";

type UserInfo = {
	sub: string;
	name: string;
	given_name: string;
	family_name: string;
	picture: string;
	email: string;
	email_verified: boolean;
	hd: string;
};

async function getUserInfo(accessToken: string): Promise<UserInfo> {
	const response = await fetch(
		"https://www.googleapis.com/oauth2/v3/userinfo",
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		},
	);

	if (!response.ok) {
		throw new Error("Failed to fetch user info");
	}

	const userInfo = await response.json();
	return userInfo;
}

async function fetchDrives(accessToken: string) {
	// Use Google Drive API to get a list of user's shared drives
	const url = "https://www.googleapis.com/drive/v3/drives";

	const res = await fetch(url, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	});

	if (!res.ok) {
		const errorDetail = await res.json();
		console.error("Error fetching team drives:", errorDetail);
		return [];
	}

	const { drives } = await res.json();
	return drives;
}

async function fetchSpreadSheets(accessToken: string, driveId: string) {
	// Use Google Drive API to get a list of files in the shared drive
	const res = await fetch(
		`https://www.googleapis.com/drive/v3/files?q='${driveId}'+in+parents&includeItemsFromAllDrives=true&supportsAllDrives=true`,
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		},
	);

	if (!res.ok) {
		const errorDetail = await res.json();
		console.error("Error fetching files:", errorDetail);

		return [];
	}

	const { files } = await res.json();

	const spreadsheets = files.filter(
		// biome-ignore lint: lint/suspicious/noExplicitAny
		(file: any) => file.mimeType === "application/vnd.google-apps.spreadsheet",
	);

	return spreadsheets;
}

async function fetchSheets(accessToken: string, sheetId: string) {
	// Use Google Sheets API to get a list of sheets in the spreadsheet
	// https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets/get
	const res = await fetch(
		`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`,
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		},
	);

	if (!res.ok) {
		const errorDetail = await res.json();
		console.error("Error fetching sheets:", errorDetail);
		return [];
	}

	const { sheets } = await res.json();

	return sheets;
}

export default async function ConnectSpreadsheetPage() {
	const { userId, accessToken } = await getSession();

	let userInfo = null;
	let data = null;

	if (accessToken) {
		userInfo = await getUserInfo(accessToken);

		const drives = await fetchDrives(accessToken);

		const drivesWithSpreadsheets = await Promise.all(
			// biome-ignore lint: lint/suspicious/noExplicitAny
			drives.map(async (drive: any) => {
				const driveId = drive.id;
				const driveName = drive.name;

				const spreadsheets = await fetchSpreadSheets(accessToken, driveId);

				return { driveId, driveName, spreadsheets };
			}),
		);

		// Since drivesWithSpreadsheets contains spreadsheets, loop through them to get a list of sheets
		data = await Promise.all(
			drivesWithSpreadsheets.map(async (driveWithSpreadsheets) => {
				const { driveId, driveName, spreadsheets } = driveWithSpreadsheets;

				const spreadsheetsWithSheets = await Promise.all(
					// biome-ignore lint: lint/suspicious/noExplicitAny
					spreadsheets.map(async (spreadsheet: any) => {
						const sheetId = spreadsheet.id;
						const sheetName = spreadsheet.name;

						const sheets = await fetchSheets(accessToken, sheetId);

						return { sheetId, sheetName, sheets };
					}),
				);

				return { driveId, driveName, spreadsheets: spreadsheetsWithSheets };
			}),
		);
	}

	return (
		<div className="flex flex-col gap-8 p-8">
			<div>Hello Connect Spreadsheet!</div>

			{userInfo && data ? (
				<div className="flex flex-col gap-4">
					<div className="flex justify-between items-center p-4 w-1/2 border border-gray-200 rounded-sm">
						<div className="flex flex-col gap-1">
							<div className="flex items-center">
								Connected to Google Spreadsheet
							</div>
							<div className="flex items-center gap-1 text-sm text-gray-200">
								<img
									src={userInfo.picture}
									alt=""
									height={20}
									width={20}
									className="rounded-full"
								/>
								{userInfo.name}({userInfo.email})
							</div>
						</div>

						<form
							action={async () => {
								"use server";

								await db
									.delete(oauthCredentials)
									.where(eq(oauthCredentials.userId, userId));

								await signOut();
							}}
						>
							<Button type="submit">Disconnect</Button>
						</form>
					</div>

					<GoogleSheetsSelection data={data} />
				</div>
			) : (
				<div className="flex justify-between items-center p-4 h-20 w-1/2 border border-gray-200 rounded-sm">
					<div>Not connect to Google Spreadsheet</div>

					<form
						action={async () => {
							"use server";
							await signIn("google");
						}}
					>
						<Button type="submit">Connect</Button>
					</form>
				</div>
			)}
		</div>
	);
}
