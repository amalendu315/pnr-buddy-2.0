import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "emails.json");

// Default emails (Hardcoded fallback)
const DEFAULT_EMAILS = [
  "airlines@airiq.in",
  "info.airiq@gmail.com",
  "accounts@airiq.in",
  "airlines.reco@airiq.in",
  "chitra@airiq.in",
  "hafiz@trinityairtravel.com",
  "gulf1@trinityairtravel.com",
  "support@vishaltravels.in",
];

export const getStoredEmails = async (): Promise<string[]> => {
  try {
    // Ensure directory exists
    try {
      await fs.access(DATA_DIR);
    } catch {
      await fs.mkdir(DATA_DIR, { recursive: true });
    }

    // Try to read file
    const data = await fs.readFile(FILE_PATH, "utf8");
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, create it with defaults
    await fs.writeFile(FILE_PATH, JSON.stringify(DEFAULT_EMAILS, null, 2));
    return DEFAULT_EMAILS;
  }
};

export const saveEmail = async (email: string): Promise<string[]> => {
  const emails = await getStoredEmails();
  if (!emails.includes(email)) {
    const newCount = [...emails, email];
    await fs.writeFile(FILE_PATH, JSON.stringify(newCount, null, 2));
    return newCount;
  }
  return emails;
};

export const deleteEmail = async (email: string): Promise<string[]> => {
  const emails = await getStoredEmails();
  const newCount = emails.filter((e) => e !== email);
  await fs.writeFile(FILE_PATH, JSON.stringify(newCount, null, 2));
  return newCount;
};
