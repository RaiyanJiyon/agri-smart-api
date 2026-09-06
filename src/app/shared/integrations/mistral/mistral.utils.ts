export const getMistralUsage = (
  usage:
    | {
        promptTokens?: number | undefined;
        completionTokens?: number | undefined;
        totalTokens?: number | undefined;
      }
    | undefined
): {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
} => {
  return {
    promptTokens: Number(usage?.promptTokens ?? 0),
    completionTokens: Number(usage?.completionTokens ?? 0),
    totalTokens: Number(usage?.totalTokens ?? 0),
  };
};
