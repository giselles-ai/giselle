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

    By default, the development server runs on port 3000 (this is the standard Next.js default). If you need to use a different port, you can set the `PORT` environment variable:

    ```sh
    PORT=6180 pnpm turbo dev
    ```

## Tasks

- [ ] Raname the action's fieldname: parameters to inputs
- [ ] Rename the output typename: generated-text to text
- [ ] Rename the output typename: generated-image to image
- [ ] Restruct input/output resolver: text-generation panel
- [ ] Refactor resolver: text generation resolver to operation resolver
- [ ] Refector connectedInputs: based on connectedOutputs
