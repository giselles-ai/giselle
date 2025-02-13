"use client";

import type React from "react";
import { useState } from "react";

// biome-ignore lint: lint/suspicious/noExplicitAny
export function GoogleSheetsSelection({ data }: { data: any }) {
	const [selectedDrive, setSelectedDrive] = useState("");
	const [selectedSpreadsheet, setSelectedSpreadsheet] = useState("");
	const [selectedSheet, setSelectedSheet] = useState("");

	const handleDriveChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setSelectedDrive(e.target.value);
		setSelectedSpreadsheet("");
		setSelectedSheet("");
	};

	const handleSpreadsheetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setSelectedSpreadsheet(e.target.value);
		setSelectedSheet("");
	};

	const handleSheetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setSelectedSheet(e.target.value);
	};

	// biome-ignore lint: lint/suspicious/noExplicitAny
	const drives = data.map((drive: any) => ({
		id: drive.driveId,
		name: drive.driveName,
	}));

	const selectedDriveData = data.find(
		// biome-ignore lint: lint/suspicious/noExplicitAny
		(drive: any) => drive.driveId === selectedDrive,
	);

	// biome-ignore lint: lint/suspicious/noExplicitAny
	const spreadsheets = selectedDriveData?.spreadsheets.map((sheet: any) => ({
		id: sheet.sheetId,
		name: sheet.sheetName,
	}));

	const selectedSpreadsheetData = selectedDriveData?.spreadsheets.find(
		// biome-ignore lint: lint/suspicious/noExplicitAny
		(sheet: any) => sheet.sheetId === selectedSpreadsheet,
	);

	// biome-ignore lint: lint/suspicious/noExplicitAny
	const sheets = selectedSpreadsheetData?.sheets.map((sheet: any) => ({
		id: sheet.properties.sheetId,
		title: sheet.properties.title,
	}));

	return (
		<div className="p-4 space-y-4">
			<div>
				<label
					htmlFor="drive-select"
					className="block text-sm font-medium text-gray-700 mb-1"
				>
					Select a Drive
				</label>
				<select
					id="drive-select"
					value={selectedDrive}
					onChange={handleDriveChange}
					className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
				>
					<option value="">Choose a drive</option>
					{
						// biome-ignore lint: lint/suspicious/noExplicitAny
						drives.map((drive: any) => (
							<option key={drive.id} value={drive.id}>
								{drive.name}
							</option>
						))
					}
				</select>
			</div>

			{selectedDrive && (
				<div>
					<label
						htmlFor="sheet-select"
						className="block text-sm font-medium text-gray-700 mb-1"
					>
						Select a SpreadSheet
					</label>
					<select
						id="sheet-select"
						value={selectedSpreadsheet}
						onChange={handleSpreadsheetChange}
						className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
					>
						<option value="">Choose a sheet</option>
						{
							// biome-ignore lint: lint/suspicious/noExplicitAny
							spreadsheets.map((spreadsheet: any) => (
								<option key={spreadsheet.id} value={spreadsheet.id}>
									{spreadsheet.name}
								</option>
							))
						}
					</select>
				</div>
			)}

			{selectedSpreadsheet && (
				<div>
					<label
						htmlFor="worksheet-select"
						className="block text-sm font-medium text-gray-700 mb-1"
					>
						Select a sheet
					</label>
					<select
						id="worksheet-select"
						value={selectedSheet}
						onChange={handleSheetChange}
						className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
					>
						<option value="">Choose a sheet</option>
						{
							// biome-ignore lint: lint/suspicious/noExplicitAny
							sheets.map((sheet: any) => (
								<option key={sheet.id} value={sheet.id}>
									{sheet.title}
								</option>
							))
						}
					</select>
				</div>
			)}
		</div>
	);
}
