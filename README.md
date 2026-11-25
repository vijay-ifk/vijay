# LearnAI

LearnAI is a role-based AI student learning and academic management platform built with React, Express, and SQLite.

## Run locally

```bash
npm install
npm run dev
```

Vite serves the frontend on port 5173 and Express serves the API on port 3001.

For a production build:

```bash
npm run build
npm start
```

## Demo accounts

- Student: `student@learnai.demo` / `Student@123`
- Faculty: `faculty@learnai.demo` / `Faculty@123`
- Administrator: `admin@learnai.demo` / `Admin@123`

Demo records are seeded once into `data/learnai.db` and are clearly labeled by the interface.

## AI configuration

Set `OPENAI_API_KEY` to enable the server-side OpenAI-compatible tutor:

```bash
export OPENAI_API_KEY="your-key"
export OPENAI_API_BASE="https://api.openai.com/v1/chat/completions"
export OPENAI_MODEL="gpt-4o-mini"
npm start
```

When no key is configured, the chat endpoint returns a clearly labeled rule-based study guide. It does not claim to be an LLM response.