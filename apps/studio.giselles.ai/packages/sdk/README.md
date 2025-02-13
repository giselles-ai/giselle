# Giselle SDK

Giselle SDK is a powerful toolkit for building AI-powered workflows and applications. It provides a comprehensive set of tools and components for creating agentic workflows, managing executions, and configuring various aspects of your AI applications.

## Installation

```bash
npm install giselle-sdk
```

## Usage

```typescript
import { initWorkflow } from 'giselle-sdk';

const workflow = initWorkflow({
  storage: {
    type: "localfilesystem",
    directory: "./workflow-storage"
  }
});

// Create nodes
const textNode = workflow.addTextNode({
  name: "Input Text",
  text: "Hello, world!"
});

const generationNode = workflow.addTextGenerationNode({
  name: "Text Generator",
  llm: "openai:gpt-4",
  temperature: 0.7,
  topP: 1,
  instruction: "Generate content based on input",
  sources: []
});

// Connect nodes
generationNode.addSources([textNode]);

// Save workflow
await workflow.save();

// Run workflow
const results = await workflow.run();
```

## Features

- Create and manage AI workflows
- Text generation nodes
- Text input nodes
- Node connections and dependencies
- Local filesystem storage
- Vercel Blob storage support
- Workflow state management
- Error handling and retries

<!--
## Documentation

For detailed documentation, visit [Giselle AI Documentation](https://github.com/giselles-ai/sdk#documentation)
 -->

<!--
## Contributing

Contributions are welcome! Please read our [Contributing Guide](https://github.com/giselles-ai/sdk/CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.
-->

## License

[Apache License Version 2.0](/LICENSE).
