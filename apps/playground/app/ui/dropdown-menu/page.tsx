"use client";

import { Button } from "@giselle-internal/ui/button";
import { DropdownMenu } from "@giselle-internal/ui/dropdown-menu";

export default function () {
	return (
		<>
			<h2 className="text-text mb-6">Dropdown Menu</h2>
			<div className="space-y-8">
				<div>
					<p className="text-text mb-2 text-sm">Demo</p>
					<div className="bg-transparent p-8 rounded-[4px] border border-border shadow-sm text-sans">
						<div className="space-y-4">
							<DropdownMenu
								items={[
									{ id: 1, name: "apple" },
									{ id: 2, name: "banana" },
									{ id: 3, name: "melon" },
								]}
								renderItem={(option) => option.name}
								trigger={<Button>Hello</Button>}
							/>
						</div>
					</div>
				</div>
				<div>
					<p className="text-text mb-2 text-sm">Group</p>
					<div className="bg-transparent p-8 rounded-[4px] border border-border shadow-sm text-sans">
						<div className="space-y-4">
							<DropdownMenu
								items={[
									{
										id: "fruits",
										groupLabel: "Fruits",
										items: [
											{ id: 1, name: "apple" },
											{ id: 2, name: "banana" },
										],
									},
									{
										id: "vegetables",
										groupLabel: "Vegetables",
										items: [
											{ id: 3, name: "carrot" },
											{ id: 4, name: "broccoli" },
										],
									},
								]}
								renderItem={(option) => option.name}
								trigger={<Button>Group</Button>}
							/>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
