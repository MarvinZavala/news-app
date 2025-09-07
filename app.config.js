export default ({ config }) => {
  return {
    ...config,
    extra: {
      ...(config.extra || {}),
      HF_API_TOKEN: process.env.HF_API_TOKEN || "",
      HF_ZERO_SHOT_URL:
        process.env.HF_ZERO_SHOT_URL ||
        "https://api-inference.huggingface.co/models/MoritzLaurer/DeBERTa-v3-base-mnli",
    },
  };
};
