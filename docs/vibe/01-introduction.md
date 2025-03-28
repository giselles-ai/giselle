# Vibe Corder: Building Products with LLMs for Non-Engineers

## What is a Vibe Corder?

A "vibe corder" is someone who builds products with the power of Large Language Models (LLMs) despite not having traditional software engineering expertise. The term is inspired by "vibe coding," a concept popularized by Andrej Karpathy (former Tesla AI director) that describes a new development approach where you communicate the "vibe" or essence of what you want to create to AI, and it generates the technical implementation.

Rather than writing code line-by-line using traditional programming knowledge, vibe corders focus on:

- Describing the desired functionality and user experience
- Iteratively refining AI-generated code through natural language feedback
- Understanding enough about software concepts to guide the AI effectively
- Creating working products without needing to master programming languages

Vibe cording represents a significant shift in how digital products can be created, making software development more accessible to people with domain expertise but limited coding skills.

**References:**
- [Ars Technica: Is vibe coding with AI gnarly or reckless?](https://arstechnica.com/ai/2025/03/is-vibe-coding-with-ai-gnarly-or-reckless-maybe-some-of-both/)
- [Times of India: What is vibe coding? Former Tesla AI director Andrej Karpathy defines a new era in AI-driven development](https://timesofindia.indiatimes.com/technology/tech-news/what-is-vibe-coding-former-tesla-ai-director-andrej-karpathy-defines-a-new-era-in-ai-driven-development/articleshow/118659724.cms)

## Getting Started as a Vibe Corder

### System Requirements

- Node.js 22.14.0 or later
- pnpm

> [!NOTE]
> If you are not familiar with Node.js, read and follow the installation instructions on the [Setup Node.js](./02-nodejs.md).

## Project Structure

Giselle is a project with a [Multi-package workspace](https://vercel.com/docs/glossary#multi-package-workspace) configuration.

- The apps folder contains two applications: `playground` and `studio.giselles.ai`.

  - `playground` is an application that allows you to run Giselle's core features as a standalone app.
  - `studio.giselles.ai` is the `https://studio.giselles.ai` application, which adds authentication, authorization, and payment features to the playground.

- The packages folder contains Giselle's common features and libraries.

## Run Playground

To start using Giselle's playground:

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Set up environment variables. Create a `.env.local` file in the `apps/playground` directory with at least one of the following API keys:

   ```
   # OpenAI API Key
   OPENAI_API_KEY=your_openai_api_key

   # Anthropic API Key
   ANTHROPIC_API_KEY=your_anthropic_api_key

   # Google AI API Key
   GOOGLE_AI_API_KEY=your_google_ai_api_key

   # Perplexity API Key
   PERPLEXITY_API_KEY=your_perplexity_api_key

   # FAL AI API Key
   FAL_API_KEY=your_fal_api_key
   ```

   You need at least one of these API keys to use the LLM features.

3. Start the playground development server:
   ```bash
   pnpm dev
   ```

   By default, the development server runs on port 3000 (this is the standard Next.js default). If you need to use a different port, you can set the `PORT` environment variable:

   ```bash
   PORT=6180 pnpm dev
   ```

4. Open your browser and visit `http://localhost:3000` to access the playground interface.

The playground allows you to experiment with Giselle's core features in a standalone environment without needing to set up authentication or other production features.
