# Environment Variables Setup

## Local Development

Create a `.env.local` file in the root directory with the following variables:

```env
# Anthropic Claude API Key for AI Bias Analysis
EXPO_PUBLIC_ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Hugging Face API Token for AI Summaries
HF_API_TOKEN=your_huggingface_token_here
```

## Production (EAS Build)

Set environment variables in your EAS build configuration or through the Expo CLI:

```bash
# For EAS builds
eas secret:create --scope project --name EXPO_PUBLIC_ANTHROPIC_API_KEY --value "your_anthropic_api_key"
```

## Security Notes

- **NEVER** commit `.env.local` or any files containing API keys
- The `.env.local` file is already included in `.gitignore`
- Use `EXPO_PUBLIC_` prefix for client-side environment variables in Expo
- For production, use EAS Secrets or your deployment platform's environment variable system