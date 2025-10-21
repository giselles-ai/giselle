"use client";
import clsx from "clsx/lite";
import { jsx as _jsx } from "react/jsx-runtime";

function Table({ className, ...props }) {
	return _jsx("div", {
		"data-slot": "table-container",
		className: "overflow-auto",
		children: _jsx("table", {
			"data-slot": "table",
			className: clsx("w-full text-sm", className),
			...props,
		}),
	});
}
function TableHeader({ className, ...props }) {
	return _jsx("thead", {
		"data-slot": "table-header",
		className: clsx(className),
		...props,
	});
}
function TableBody({ className, ...props }) {
	return _jsx("tbody", {
		"data-slot": "table-body",
		className: clsx(className),
		...props,
	});
}
function TableFooter({ className, ...props }) {
	return _jsx("tfoot", {
		"data-slot": "table-footer",
		className: clsx(
			"bg-background border-t border-border font-medium [&>tr]:border-b [&>tr]:last:border-b-0",
			className,
		),
		...props,
	});
}
function TableRow({ className, ...props }) {
	return _jsx("tr", {
		"data-slot": "table-row",
		className: clsx("border-b border-white-400/10", className),
		...props,
	});
}
function TableHead({ className, ...props }) {
	return _jsx("th", {
		"data-slot": "table-head",
		className: clsx(
			"text-left py-3 px-4 text-white-400 font-normal text-xs",
			className,
		),
		...props,
	});
}
function TableCell({ className, ...props }) {
	return _jsx("td", {
		"data-slot": "table-cell",
		className: clsx("py-3 px-4 text-white-800 whitespace-nowrap", className),
		...props,
	});
}
function TableCaption({ className, ...props }) {
	return _jsx("caption", {
		"data-slot": "table-caption",
		className: clsx("text-text-muted mt-[4px] text-[12px]", className),
		...props,
	});
}
export {
	Table,
	TableHeader,
	TableBody,
	TableFooter,
	TableHead,
	TableRow,
	TableCell,
	TableCaption,
};
//# sourceMappingURL=table.js.map
