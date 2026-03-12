import axios from "axios";
import https from "https";
import { akasaTokenUrl, spicejetTokenUrl } from "../../../constants";

// Shared HTTPS Agent to ignore SSL errors
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

export const checkTimeFormat = (text: string): string => {
  if (!text) return "";
  if (
    text.charAt(0) === "0" ||
    text.slice(0, 2) === "11" ||
    text.slice(0, 2) === "10"
  ) {
    return text.concat(" ", "AM");
  } else {
    return text.concat(" ", "PM");
  }
};

// --- SPICEJET UTILS ---
export const getSpiceJetToken = async (
  maxAttempts = 5,
  current = 1
): Promise<string> => {
  try {
    const response = await axios.post(
      spicejetTokenUrl,
      {},
      { headers: { "Content-Type": "application/json" } }
    );
    if (response.data.data.token) return response.data.data.token;
    throw new Error("No token received");
  } catch (error) {
    if (current < maxAttempts)
      return getSpiceJetToken(maxAttempts, current + 1);
    throw error;
  }
};

// --- AKASA UTILS ---
export const getAkasaToken = async (
  maxAttempts = 5,
  current = 1
): Promise<string> => {
  try {
    const response = await axios.post(
      akasaTokenUrl,
      { clientType: "WEB" },
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
        httpsAgent,
      }
    );
    // Akasa response structure check
    const token = response.data?.data?.token;
    if (token) return token;
    throw new Error("No token received");
  } catch (error) {
    if (current < maxAttempts) {
      console.log("Retrying Akasa Token...");
      return getAkasaToken(maxAttempts, current + 1);
    }
    throw error;
  }
};
