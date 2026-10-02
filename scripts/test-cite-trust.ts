import { prisma } from "../src/server/db/client";

import {
  calculateLocationTagCiteTrustScore,
} from "../src/server/services/cite-trust.service";

async function main() {
  const tags =
    await prisma.locationTag.findMany({
      where: {
        possibleDuplicateOfId: null,
      },

      select: {
        id: true,
        title: true,
        citeTrustScore: true,

        _count: {
          select: {
            citations: true,
          },
        },
      },

      orderBy: {
        title: "asc",
      },
    });

  const results = [];

  for (const tag of tags) {
    const score =
      await calculateLocationTagCiteTrustScore(
        tag.id,
      );

    results.push({
      title:
        tag.title,

      storedScore:
        tag.citeTrustScore,

      rawCitations:
        tag._count.citations,

      eligibleCitations:
        score.eligibleCiteCount,

      creators:
        score.distinctCreatorCount,

      verified:
        score.verifiedVisitCount,

      volume:
        score.citeVolumeScore,

      quality:
        score.citeQualityScore,

      consistency:
        score.crossPlanConsistency,

      score:
        score.citeTrustScore,
    });
  }

  console.table(results);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });