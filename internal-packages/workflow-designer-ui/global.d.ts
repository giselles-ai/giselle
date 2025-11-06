declare module "@xyflow/react/dist/style.css" {
	const content: { [className: string]: string };
	export default content;
}

declare module "*.gif" {
	const content: import("next/image").StaticImageData;
	export default content;
}

declare module "*.png" {
	const content: import("next/image").StaticImageData;
	export default content;
}
