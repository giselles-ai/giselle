# Giselle Playground [Experimental]

**[IMPORTANT]** This is an experimental playground. Use at your own risk.

## Getting Started

1. Create a `.env.local` file in the root directory.

    ```sh
    touch .env.local
    ```

2. Add your API keys to the `.env.local` file. At least one API key is required, others are optional.

    ```.env
    # Required (at least one of these)
    OPENAI_API_KEY="YOUR_OPENAI_API_KEY"
    # Optional
    GOOGLE_GENERATIVE_AI_API_KEY="YOUR_GOOGLE_GENERATIVE_AI_API_KEY"
    ANTHROPIC_API_KEY="YOUR_ANTHROPIC_API_KEY"
    ```

3. Install dependencies

    ```sh
    pnpm install
    ```

4. Start the development server

    ```sh
    pnpm turbo dev
    ```

## Tasks

- [ ] Improve Catalog UI
- [ ] Add filesize limit to workspace property
- [ ] Split stream route
- [ ] Copy button
- [ ] Run detail route
- [ ] Webclip Node
- [ ] Split create generation and start generation
- [ ] Rework selected node design
- [ ] Add setting button to title
- [ ] API Middleware
- [ ] API Auth
- [ ] API Rate Limit
- [ ] Add to do comment llmProviders property
- [ ] Handling error in file upload
- [ ] Undo/Redo for prompt editor
- [ ] Telemetry


## Backlog

- [ ] OpenAI Assistant
  - [ ] Migrate Vector store from Expired one
  - [ ] Handling error in assistant

## Done

- [x] Toast UI
- [x] Image File
- [x] contentType to type
- [x] Textfile Node
- [x] Support server action
- [x] Model catalog
- [x] Model catalog UI
- [x] Writing getting started
- [x] LLM Provider from .env
- [x] Remove upload file name inference
- [x] Rework generation state management
- [x] Cancel on Run
- [x] Fix longtext layout of view
- [x] Fix editing workflows
- [x] Animation
- [x] Cancel button
- [x] Show unable sources
- [x] Update text node icon
- [x] Auto detect storage backend
- [x] Create exention for a source
- [x] Rework node select intereaction
- [x] Make fill yellow for connected file node port
- [x] Styling connector
- [x] Add title
- [x] Better font(base: Geist, accent: Hubot)
- [x] Fix layout of text node
- [x] Improve layout of gen node's prompt tab
- [x] Show running job
- [x] Show running state on run view
- [x] Workflow View
- [x] Show flow selector if workspace has multiple flows
- [x] Markdown styling
- [x] Add generate text short cut
- [x] Set viewport to storage
- [x] animate spinner
- [x] Support multi output
- [x] Prompt object to html to markdown
- [x] Add typecheck script to template of turborepo
- [x] at removeFileHandler (packages/giselle-engine/src/core/handlers/remove-file.ts:35:53)
- [x] Handling error in completion
- [x] Focus prompt tab when open text generation node
- [x] File node per filetype
- [x] Consistent fallback handling
- [x] Anthropic Model tab
- [x] Rename node
- [x] File node
- [x] Text node
- [x] Focus textarea when source inserted
- [x] Unite generation runner
- [x] Improve Playground Generation
- [x] Stream text
  - [x] OpenAI
  - [x] Google
- [x] Read Text Generation Node
  - [x] OpenAI
  - [x] Anthoropic
  - [x] Google
- [x] Read Text Node
  - [x] OpenAI
  - [x] Anthoropic
  - [x] Google
- [x] Persist text generation hooks
- [x] Workflow read file
- [x] Persist generated text
- [x] Claude
- [x] Gemini
- [x] Switch to assistant and completion
- [x] Add pdf constraints to file node
- [x] Multiple file upload
- [x] Prevent clearing the input using openai
- [x] OpenAI Vector Store per Workspace
- [x] PDF file name with Claude PDF support
- [x] Add llmProviders property to the engine context
- [x] Set WorkflowDesigner's llmProviders from the engine context
- [x] Markdown preview
- [x] Click generate button, and then run `assistant` command.
- [x] Change the node name
