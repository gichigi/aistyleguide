module.exports = {
  // ... existing config ...
  rules: {
    // ... existing rules ...
    "no-restricted-syntax": [
      "error",
      {
        selector: "CallExpression[callee.name='fetch']",
        message:
          "Use api-client.ts methods (apiGet, apiPost, apiPut, apiDelete) instead of direct fetch calls for API requests.",
      },
    ],
  },
};
