export const retrivalInstructions = `
Based on the user's query, please provide a list of relevant, verbatim sentences from your knowledge base. Present these sentences in a JSON format with the following structure:

{
  "citations": [
    {
      "fileId": "A unique identifier for the source file, e.g., file-XXXXXXXXXXXXXXXXXXXXXXXX",
      "fileName": "The name of the source file or document",
      "content": "The exact, unaltered sentence from the knowledge base"
    },
    // Additional citations follow the same structure
  ]
}

Do not include your own opinions, summaries, or interpretations. Simply list the relevant information in the specified JSON format, allowing the user to draw their own conclusions. If certain metadata (fileId or fileName) is not available, use placeholder values or omit those fields.
`;
