# Newt

**Newt** is an AI-powered web platform that creates a fully synthetic internet experience. Every page, website, and piece of content is generated on-demand by AI, creating an interconnected web of knowledge that feels authentic but is completely artificial.

## Features

### 🌐 Two Distinct Experiences

- **Explorer Mode** (`/explore`): Wikipedia-style article generation with auto-generated cover images, table of contents, and cross-links
- **Website Simulator** (`/visit`): Visit any imaginary website - Twitter, Hogwarts, Spotify, etc. - with realistic layouts, forms, feeds, and interactive components

### 🤖 AI-Powered Generation
- **Real-time Content**: Every page is generated dynamically using Groq's fast LLM API
- **Structured Output**: Smart JSON generation creates realistic website layouts and components  
- **Image Generation**: Auto-generated aesthetic cover images for articles
- **Cross-linking**: Internal links between generated content create an interconnected web

### 🎨 Modern Design
- **Responsive UI**: Works seamlessly on desktop and mobile
- **Tailwind CSS 4**: Modern styling with custom design system
- **Interactive Components**: Forms, feeds, grids, navigation - all AI-generated
- **Real-time Updates**: Content streams in as it's generated

## Tech Stack

- **Frontend**: Next.js 15 with React 19
- **Styling**: Tailwind CSS 4 with custom design system
- **AI Provider**: Groq API with GPT OSS 20B model for text generation
- **Image Generation**: AI-powered cover image generation
- **Streaming**: Real-time content streaming with AI SDK
- **Schema Validation**: Zod for structured data generation
- **Deployment**: Optimized for Edge Runtime

## Getting Started

### Prerequisites

- Node.js 18+ 
- A Groq API key (get one at [console.groq.com](https://console.groq.com))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/newt.git
cd newt
```

2. Navigate to the project directory:
```bash
cd ai-wiki
```

3. Install dependencies:
```bash
npm install
```

4. Set up environment variables:
```bash
cp .env.local.example .env.local
```

5. Add your Groq API key to `.env.local`:
```env
GROQ_API_KEY=your_groq_api_key_here
```

6. Run the development server:
```bash
cd ai-wiki
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Use Newt

### Explorer Mode (`/explore`)
1. **Generate Articles**: Enter any topic (e.g., "Quantum Computing explained to a five year old")
2. **Browse Content**: Use the table of contents to navigate sections
3. **Follow Links**: Click on internal links to generate related articles
4. **Copy & Share**: Use the copy button or share URLs with the `?q=` parameter

### Website Simulator (`/visit`)
1. **Visit Any Site**: Enter any website name (e.g., "Twitter", "Hogwarts", "Spotify")  
2. **Interactive Experience**: Fill out forms, browse feeds, click navigation links
3. **Explore Connections**: Follow generated links to discover new "websites"
4. **Use Browser Controls**: Back/forward buttons and regenerate content as needed

### Getting Around
- **Home Page**: Choose between Explorer mode or Website simulator
- **Search Bar**: Available on all pages for quick navigation
- **Random Pages**: Use the "Random" button for discovery
- **Browser History**: Standard back/forward navigation works

## Project Structure

```
ai-wiki/
├── src/
│   └── app/
│       ├── api/
│       │   └── generate/
│       │       └── route.ts      # Groq API integration
│       ├── globals.css           # Global styles and theme
│       ├── layout.tsx           # Font setup and metadata
│       └── page.tsx             # Main search interface
├── public/                      # Static assets
├── .env.local.example          # Environment variables template
└── package.json                # Dependencies and scripts
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GROQ_API_KEY` | Your Groq API key for LLM access | Yes |

## Customization

### Styling
- Colors and theme are defined in `src/app/globals.css`
- Current theme uses beige background (`#f5efe2`) and black text (`#111111`)
- Fonts: Crimson Text for headings, IBM Plex Mono for body text

### AI Model
- Currently uses `llama-3.3-70b-versatile` for balanced performance and quality
- Can be changed in `src/app/api/generate/route.ts`
- Other available models: `llama-3.1-8b-instant`, `deepseek-r1-distill-llama-70b`

### Article Format
The AI is prompted to generate articles with:
- Short lead paragraph (2-4 sentences)
- 3-5 section headings with concise content
- Neutral, encyclopedic tone
- No external links or references
- Under 900 words

## Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project as a starting point for your own AI-powered applications.

## Troubleshooting

### "Model decommissioned" error
- Update the model name in `route.ts` to a currently supported Groq model
- Check [console.groq.com/docs/models](https://console.groq.com/docs/models) for available models

### API key issues
- Ensure your `.env.local` file contains a valid Groq API key
- Check that the key has proper permissions in the Groq console

### Build errors
- Clear `.next` folder and rebuild: `rm -rf .next && npm run build`
- Ensure all dependencies are installed: `npm install`

