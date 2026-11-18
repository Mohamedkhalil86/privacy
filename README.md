# Shoply Support Chatbot

A responsive FAQ chatbot built with the Next.js App Router, React, TypeScript, and Tailwind CSS 4.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The chat runs entirely in the browser and uses the FAQ entries in `src/data/chatbotData.ts`; no API key or external service is required.

## Project structure

- `src/app/` — App Router page, metadata, and global styles
- `src/components/Chatbot.tsx` — accessible chat UI and conversation state
- `src/data/chatbotData.ts` — typed FAQ knowledge base, suggestions, and matching logic

Add FAQ entries to `chatbotData` to extend the assistant’s knowledge. The matcher normalizes text, checks phrase and keyword overlap, and returns a polite fallback for unrelated questions.
