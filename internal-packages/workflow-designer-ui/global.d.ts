declare module "@xyflow/react/dist/style.css" {
	const content: { [className: string]: string };
	export default content;
}

declare module "*.css" {
	const content: { [className: string]: string };
	export default content;
}
