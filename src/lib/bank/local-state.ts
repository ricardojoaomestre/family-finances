import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type BankLocalState = {
  providerId: string;
  connectionId: string;
  institutionId: string;
  connectedAt: string;
};

const STATE_DIR = '.bank';
const STATE_FILE = 'local-state.json';

function getStatePath(): string {
  return path.join(process.cwd(), STATE_DIR, STATE_FILE);
}

export async function readBankLocalState(): Promise<BankLocalState | null> {
  try {
    const raw = await readFile(getStatePath(), 'utf8');
    return JSON.parse(raw) as BankLocalState;
  } catch {
    return null;
  }
}

export async function writeBankLocalState(state: BankLocalState): Promise<void> {
  const statePath = getStatePath();
  await mkdir(path.dirname(statePath), { recursive: true });
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}
