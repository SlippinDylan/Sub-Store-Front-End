export type PreviewNodeGroup<T> =
  | { status: "retained"; before?: T; after: T }
  | { status: "filtered"; before: T; after?: never };

export const groupPreviewNodes = <T extends { id: number }>(
  original: T[],
  processed: T[],
): PreviewNodeGroup<T>[] => {
  const originals = new Map(original.map((node) => [node.id, node]));
  const processedIds = new Set(processed.map((node) => node.id));
  return [
    ...processed.map((after) => ({
      status: "retained" as const,
      before: originals.get(after.id),
      after,
    })),
    ...original
      .filter((node) => !processedIds.has(node.id))
      .map((before) => ({
        status: "filtered" as const,
        before,
      })),
  ];
};
