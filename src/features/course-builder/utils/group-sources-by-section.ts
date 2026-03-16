import type { CourseAssetSource } from "@/features/course-assets/types/asset-catalog";

export type SectionSourcesGroup = {
  section: {
    id: number | null;
    title: string | null;
    order_index: number;
  };
  sources: CourseAssetSource[];
};

export function groupSourcesBySection(
  sources: CourseAssetSource[],
): SectionSourcesGroup[] {
  const groups = new Map<number | null, SectionSourcesGroup>();

  const sortedSources = [...sources].sort((left, right) => {
    const leftSectionOrder = Number(left.section?.order_index ?? 0);
    const rightSectionOrder = Number(right.section?.order_index ?? 0);

    if (leftSectionOrder !== rightSectionOrder) {
      return leftSectionOrder - rightSectionOrder;
    }

    const leftSourceOrder = Number(left.order_index ?? 0);
    const rightSourceOrder = Number(right.order_index ?? 0);

    if (leftSourceOrder !== rightSourceOrder) {
      return leftSourceOrder - rightSourceOrder;
    }

    return Number(left.id) - Number(right.id);
  });

  sortedSources.forEach((source) => {
    const sectionId = source.section?.id ?? null;

    if (!groups.has(sectionId)) {
      groups.set(sectionId, {
        section: {
          id: source.section?.id ?? null,
          title: source.section?.title ?? null,
          order_index: Number(source.section?.order_index ?? 0),
        },
        sources: [],
      });
    }

    groups.get(sectionId)!.sources.push(source);
  });

  return [...groups.values()].sort(
    (left, right) => left.section.order_index - right.section.order_index,
  );
}
