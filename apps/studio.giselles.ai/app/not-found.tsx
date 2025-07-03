import Link from "next/link";

export default function NotFound() {
	return (
		<div className="flex flex-col items-center justify-center min-h-screen">
			<h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
			<p className="text-gray-600 mb-8">
				The page you are looking for does not exist.
			</p>
			<Link href="/apps" className="text-blue-500 hover:underline">
				Go back to apps
			</Link>
		</div>
	);
}
