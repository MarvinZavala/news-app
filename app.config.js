export default ({ config }) => {
  return {
    ...config,
    extra: {
      HF_API_TOKEN: process.env.HF_API_TOKEN || "",
    },
  };
};
