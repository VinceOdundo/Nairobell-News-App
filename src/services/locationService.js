import { supabase } from "../lib/supabase";

// Other African countries for broader coverage
export const AFRICAN_COUNTRIES = [
  { code: "kenya", name: "Kenya", flag: "🇰🇪" },
  { code: "nigeria", name: "Nigeria", flag: "🇳🇬" },
  { code: "south-africa", name: "South Africa", flag: "🇿🇦" },
  { code: "ghana", name: "Ghana", flag: "🇬🇭" },
  { code: "ethiopia", name: "Ethiopia", flag: "🇪🇹" },
  { code: "egypt", name: "Egypt", flag: "🇪🇬" },
  { code: "morocco", name: "Morocco", flag: "🇲🇦" },
  { code: "tanzania", name: "Tanzania", flag: "🇹🇿" },
  { code: "uganda", name: "Uganda", flag: "🇺🇬" },
  { code: "zambia", name: "Zambia", flag: "🇿🇲" },
  { code: "rwanda", name: "Rwanda", flag: "🇷🇼" },
  { code: "senegal", name: "Senegal", flag: "🇸🇳" },
  { code: "ivory-coast", name: "Côte d'Ivoire", flag: "🇨🇮" },
  { code: "cameroon", name: "Cameroon", flag: "🇨🇲" },
  { code: "tunisia", name: "Tunisia", flag: "🇹🇳" },
  { code: "algeria", name: "Algeria", flag: "🇩🇿" },
  { code: "libya", name: "Libya", flag: "🇱🇾" },
  { code: "sudan", name: "Sudan", flag: "🇸🇩" },
  { code: "angola", name: "Angola", flag: "🇦🇴" },
  { code: "mozambique", name: "Mozambique", flag: "🇲🇿" },
  { code: "madagascar", name: "Madagascar", flag: "🇲🇬" },
  { code: "mali", name: "Mali", flag: "🇲🇱" },
  { code: "burkina-faso", name: "Burkina Faso", flag: "🇧🇫" },
  { code: "niger", name: "Niger", flag: "🇳🇪" },
  { code: "malawi", name: "Malawi", flag: "🇲🇼" },
  { code: "chad", name: "Chad", flag: "🇹🇩" },
  { code: "somalia", name: "Somalia", flag: "🇸🇴" },
  { code: "zimbabwe", name: "Zimbabwe", flag: "🇿🇼" },
  { code: "botswana", name: "Botswana", flag: "🇧🇼" },
  { code: "namibia", name: "Namibia", flag: "🇳🇦" },
  { code: "mauritius", name: "Mauritius", flag: "🇲🇺" },
  { code: "seychelles", name: "Seychelles", flag: "🇸🇨" },
];

export const LANGUAGES = [
  { code: "en", name: "English", native: "English" },
  { code: "sw", name: "Swahili", native: "Kiswahili" },
  { code: "ha", name: "Hausa", native: "Hausa" },
  { code: "yo", name: "Yoruba", native: "Yorùbá" },
  { code: "ig", name: "Igbo", native: "Igbo" },
  { code: "am", name: "Amharic", native: "አማርኛ" },
  { code: "zu", name: "Zulu", native: "isiZulu" },
  { code: "xh", name: "Xhosa", native: "isiXhosa" },
  { code: "af", name: "Afrikaans", native: "Afrikaans" },
  { code: "fr", name: "French", native: "Français" },
  { code: "ar", name: "Arabic", native: "العربية" },
  { code: "pt", name: "Portuguese", native: "Português" },
];

export class LocationService {
  // Get all African countries
  static getAfricanCountries() {
    return AFRICAN_COUNTRIES;
  }

  // Get supported languages
  static getLanguages() {
    return LANGUAGES;
  }

  // Format location display text
  static formatLocation(profile) {
    const parts = [];

    if (profile.region) parts.push(profile.region);
    if (profile.country) {
      const country = AFRICAN_COUNTRIES.find((c) => c.code === profile.country);
      parts.push(country ? country.name : profile.country);
    }

    return parts.join(", ") || "Location not specified";
  }

  // Validate location (simplified - just check if country exists)
  static validateLocation(country, region) {
    if (!country) {
      return { valid: false, message: "Country is required" };
    }

    const validCountry = AFRICAN_COUNTRIES.find((c) => c.code === country);
    if (!validCountry) {
      return { valid: false, message: "Please select a valid African country" };
    }

    return { valid: true, message: "Valid location" };
  }

  // Get location-based news feed
  static async getLocationBasedContent(userLocation) {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .or(
          `country_focus.cs.{${userLocation.country}},region.ilike.%${userLocation.region || ""}%`
        )
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching location-based content:", error);
      return [];
    }
  }

  // Store user location preferences
  static async updateUserLocation(userId, locationData) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({
          country: locationData.country,
          region: locationData.region || "",
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error updating user location:", error);
      return { data: null, error };
    }
  }
}
