import assert from "node:assert";
import { describe, it } from "node:test";
import { Formatter } from "./formatter.js";

const testData = new Map([
	[
		"Search for .env.example file in giselles-ai/giselle repository",
		{
			total_count: 1,
			incomplete_results: false,
			items: [
				{
					name: ".env.example",
					path: "apps/studio.giselles.ai/.env.example",
					sha: "df58ba6fd4766ed6933ff53ab0618f738b60ff38",
					score: 1,
				},
			],
		},
	],
]);

describe("Formatter", () => {
	it("basic tree structure with score alignment", () => {
		const formatter = new Formatter();
		const result = formatter.format(testData);
		const expected = `## Search for .env.example file in giselles-ai/giselle repository
├── total_count 1
├── incomplete_results false
└── items
    ├── name .env.example
    ├── path apps/studio.giselles.ai/.env.example
    ├── sha df58ba6fd4766ed6933ff53ab0618f738b60ff38
    └── score 1`;
		assert.strictEqual(result, expected);
	});

	it("empty values are filtered out", () => {
		const emptyData = new Map([
			[
				"Test",
				{
					a: "",
					b: null,
					c: undefined,
					d: "value",
				},
			],
		]);
		const formatter = new Formatter();
		const result = formatter.format(emptyData);
		const expected = `## Test
└── d value`;
		assert.strictEqual(result, expected);
	});

	it("nested objects with proper alignment", () => {
		const nestedData = new Map([
			[
				"Test",
				{
					parent: {
						child1: "value1",
						child2: {
							grandchild: "value2",
						},
					},
				},
			],
		]);
		const formatter = new Formatter();
		const result = formatter.format(nestedData);
		const expected = `## Test
└── parent
    ├── child1 value1
    └── child2
        └── grandchild value2`;
		assert.strictEqual(result, expected);
	});

	it("deep nested objects with score at correct level", () => {
		const deepNestedData = new Map([
			[
				"Test",
				{
					items: [
						{
							repository: {
								name: "test-repo",
								owner: {
									login: "test-user",
								},
							},
							score: 1,
						},
					],
				},
			],
		]);
		const formatter = new Formatter();
		const result = formatter.format(deepNestedData);
		const expected = `## Test
└── items
    ├── repository
    │   ├── name test-repo
    │   └── owner
    │       └── login test-user
    └── score 1`;
		assert.strictEqual(result, expected);
	});

	it("multiline values", () => {
		const multilineData = new Map([
			[
				"Test",
				{
					description: "This is a\nmultiline\ndescription",
					code: "function test() {\n  console.log('hello');\n}",
					single: "single line value",
				},
			],
		]);
		const formatter = new Formatter();
		const result = formatter.format(multilineData);
		const expected = `## Test
├── description
│   This is a
│   multiline
│   description
├── code
│   function test() {
│     console.log('hello');
│   }
└── single single line value`;
		assert.strictEqual(result, expected);
	});

	it("nested multiline values", () => {
		const nestedMultilineData = new Map([
			[
				"Test",
				{
					repository: {
						description: "This is a\nmultiline\ndescription",
						readme: "# Title\n\nThis is a readme\nwith multiple lines",
						metadata: {
							notes: "Important note:\n- Point 1\n- Point 2",
						},
					},
				},
			],
		]);
		const formatter = new Formatter();
		const result = formatter.format(nestedMultilineData);
		const expected = `## Test
└── repository
    ├── description
    │   This is a
    │   multiline
    │   description
    ├── readme
    │   # Title
    │
    │   This is a readme
    │   with multiple lines
    └── metadata
        └── notes
            Important note:
            - Point 1
            - Point 2`;
		assert.strictEqual(result, expected);
	});

	it("formatArray - nested arrays and objects", () => {
		const formatter = new Formatter();
		const data = new Map([
			[
				"testArray",
				[
					{ name: "item1", value: 1 },
					{ name: "item2", value: 2 },
					[1, 2, 3],
					{
						nested: {
							deep: "value",
						},
					},
				],
			],
		]);

		const expected = `## testArray
├── {0}
│   ├── name item1
│   └── value 1
├── {1}
│   ├── name item2
│   └── value 2
├── [2]
│   ├── 1
│   ├── 2
│   └── 3
└── {3}
    └── nested
        └── deep value`;

		const result = formatter.format(data);
		assert.strictEqual(result, expected);
	});

	it("formatArray - empty arrays and objects", () => {
		const formatter = new Formatter();
		const data = new Map([
			["emptyData", [[], {}, { emptyArray: [], emptyObject: {} }]],
		]);

		const expected = `## emptyData
├── [0]
├── {1}
└── {2}
    ├── emptyArray
    └── emptyObject`;

		const result = formatter.format(data);
		assert.strictEqual(result, expected);
	});
});
