"use client";

import { useState } from "react";

export function SentryTestError() {
	const [count, setCount] = useState(0);

	const handleJavaScriptError = () => {
		// Intentional JavaScript error
		throw new Error("Test JavaScript Error: Button clicked!");
	};

	const handleTypeError = () => {
		// Intentional TypeError
		const obj: unknown = null;
		// biome-ignore lint/suspicious/noExplicitAny: Intentional error for testing
		(obj as any).someMethod();
	};

	const handleAsyncError = async () => {
		// Async error
		await new Promise((_resolve, reject) => {
			setTimeout(() => {
				reject(new Error("Test Async Error: Promise rejected!"));
			}, 1000);
		});
	};

	const handleNetworkError = async () => {
		// Network error simulation
		try {
			await fetch("/api/nonexistent-endpoint");
		} catch (error) {
			throw new Error(`Network Error: ${error}`);
		}
	};

	const handleUnhandledPromiseRejection = () => {
		// Unhandled promise rejection
		Promise.reject(new Error("Test Unhandled Promise Rejection"));
	};

	const handleRuntimeError = () => {
		// Runtime error with dynamic content
		const data = { message: "test" };
		// @ts-ignore - Intentional error
		console.log(data.nonExistentProperty.toString());
	};

	return (
		<div className="p-4 space-y-4 bg-red-50 border border-red-200 rounded-lg">
			<h3 className="text-lg font-semibold text-red-800">
				Sentry Error Testing ({count} clicks)
			</h3>
			<div className="grid grid-cols-2 gap-2">
				<button
					type="button"
					onClick={() => {
						setCount(count + 1);
						handleJavaScriptError();
					}}
					className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
				>
					JavaScript Error
				</button>

				<button
					type="button"
					onClick={() => {
						setCount(count + 1);
						handleTypeError();
					}}
					className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
				>
					TypeError
				</button>

				<button
					type="button"
					onClick={() => {
						setCount(count + 1);
						handleAsyncError();
					}}
					className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
				>
					Async Error
				</button>

				<button
					type="button"
					onClick={() => {
						setCount(count + 1);
						handleNetworkError();
					}}
					className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
				>
					Network Error
				</button>

				<button
					type="button"
					onClick={() => {
						setCount(count + 1);
						handleUnhandledPromiseRejection();
					}}
					className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
				>
					Promise Rejection
				</button>

				<button
					type="button"
					onClick={() => {
						setCount(count + 1);
						handleRuntimeError();
					}}
					className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
				>
					Runtime Error
				</button>
			</div>
			<p className="text-sm text-red-600">
				⚠️ These buttons will generate errors that should be captured by Sentry
				with user information.
			</p>
		</div>
	);
}
