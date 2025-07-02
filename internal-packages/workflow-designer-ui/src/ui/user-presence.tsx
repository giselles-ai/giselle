import clsx from "clsx";
import { WilliIcon } from "../icons/willi";
import { Tooltip } from "./tooltip";

// Random colors for willi icons
const WILLI_COLORS = [
	"#9D71EA", // Nebula Purple: a rich purple with a slight glow
	"#4A9FF5", // Cosmic Blue: deep blue with a celestial brightness
	"#39E3B0", // Aurora Green: teal green like northern lights
	"#FF61D2", // Stardust Pink: vibrant pink like distant galaxies
	"#FF7E50", // Solar Orange: warm orange like a distant sun
	"#2DC7FF", // Comet Blue: bright ice-blue like a comet trail
	"#00B8A9", // Celestial Teal: deep teal like nebula gases
	"#E84855", // Martian Red: dusty red like the surface of Mars
	"#FFDC5E", // Pulsar Yellow: pulsing yellow like a distant star
	"#C2D3DD", // Galactic Silver: subtle silver with blue undertones
];

// Demo user data (in real implementation, this would be fetched from backend in real-time)
const DEMO_USERS = [
	{ id: "1", name: "John Doe", isGuest: true },
	{ id: "2", name: "Jane Smith", isGuest: true },
	{ id: "3", name: "Alex Johnson", isGuest: true },
	{ id: "4", name: "Guest User", isGuest: true },
	{ id: "5", name: "Anonymous", isGuest: true },
];

interface User {
	id: string;
	name: string;
	avatar?: string;
	color?: string;
	isGuest?: boolean;
}

interface UserAvatarProps {
	user: User;
	index: number;
	total: number;
}

// Get a random color from the WILLI_COLORS array
function _getRandomColor() {
	return WILLI_COLORS[Math.floor(Math.random() * WILLI_COLORS.length)];
}

// Get color based on user ID
function getColorForUser(userId: string) {
	// Convert user ID to a number by summing character codes
	const sum = userId
		.split("")
		.reduce((acc, char) => acc + char.charCodeAt(0), 0);
	// Use modulo to get an index within the colors array
	return WILLI_COLORS[sum % WILLI_COLORS.length];
}

// Individual user avatar
function UserAvatar({ user, index, total }: UserAvatarProps) {
	// Calculate offset for overlapping display
	const offsetStyle = {
		zIndex: total - index, // Users on the left appear on top
		marginLeft: index > 0 ? "-8px" : "0", // Overlap from the second user onwards
	};

	// For guest users, get color based on user ID
	const williColor = user.isGuest
		? getColorForUser(user.id)
		: user.color || "#6E56CF";

	// Display initial if no avatar
	const initial = user.name ? user.name.charAt(0) : "?";

	return (
		<Tooltip text={user.isGuest ? `Guest (${user.name})` : user.name}>
			<div
				className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-black-900 overflow-hidden"
				style={{
					backgroundColor: williColor,
					...offsetStyle,
				}}
			>
				{user.isGuest ? (
					<WilliIcon className="w-5 h-5" color="white" fill="white" />
				) : user.avatar ? (
					<img
						src={user.avatar}
						alt={user.name}
						className="w-full h-full object-cover"
					/>
				) : (
					<span className="text-white-900 text-sm font-bold">{initial}</span>
				)}
			</div>
		</Tooltip>
	);
}

interface UserPresenceProps {
	// In real implementation, props for real-time updates would be here
	users?: User[];
	className?: string;
	maxDisplay?: number;
}

export function UserPresence({
	users = DEMO_USERS, // Default value for demo
	className,
	maxDisplay = 3,
}: UserPresenceProps) {
	const displayUsers = users.slice(0, maxDisplay);
	const remainingCount = users.length - maxDisplay;

	return (
		<div className={clsx("flex items-center", className)}>
			<div className="flex">
				{displayUsers.map((user, index) => (
					<UserAvatar
						key={user.id}
						user={user}
						index={index}
						total={displayUsers.length}
					/>
				))}

				{remainingCount > 0 && (
					<div
						className="flex flex-col items-center justify-center border-2 border-black-900 text-white-900 text-xs font-medium"
						style={{
							marginLeft: "-8px",
							zIndex: 0,
							gap: "10px",
							borderRadius: "70px",
							background: "var(--primary400, #6B8FF0)",
							display: "flex",
							width: "32px",
							height: "32px",
							flexDirection: "column",
							justifyContent: "center",
							alignItems: "center",
						}}
					>
						+{remainingCount}
					</div>
				)}
			</div>
		</div>
	);
}
