export type ProofLinks = { internetArchive?: string; archiveToday?: string };
export type Record = {
  url: string; slug: string; company?: string; industry?: string; country?: string;
  detectedYears: number[]; currentYear: number; status: 'ok'|'stale'|'inconclusive'|'future';
  firstIncorrectAt?: string; lastIncorrectAt?: string; lastCorrectAt?: string; correctedAt?: string;
  verifiedAt?: string; lastCheckedAt?: string; proof?: ProofLinks; screenshot?: string;
};