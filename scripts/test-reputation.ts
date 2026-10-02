import { runReputationScoringJob } from "../src/server/services/reputation.service";

async function main() {
  const result =
    await runReputationScoringJob();

  console.dir(result, {
    depth: null,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});