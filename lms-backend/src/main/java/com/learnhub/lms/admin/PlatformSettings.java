package com.learnhub.lms.admin;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

/**
 * Reads platform toggles saved via AdminService. Unknown keys fall back to
 * the caller's default so fresh databases behave sanely.
 */
@Component
public class PlatformSettings {

  private final PlatformSettingRepository settings;
  private final ObjectMapper json;

  public PlatformSettings(PlatformSettingRepository settings, ObjectMapper json) {
    this.settings = settings;
    this.json = json;
  }

  public boolean isEnabled(String key, boolean defaultValue) {
    return settings.findById(key).map(s -> parseBool(s.getValueJson(), defaultValue))
        .orElse(defaultValue);
  }

  private boolean parseBool(String raw, boolean defaultValue) {
    if (raw == null) {
      return defaultValue;
    }
    String t = raw.trim();
    if (t.startsWith("\"") && t.endsWith("\"") && t.length() >= 2) {
      t = t.substring(1, t.length() - 1);
    }
    if (t.equalsIgnoreCase("true") || t.equals("1")) {
      return true;
    }
    if (t.equalsIgnoreCase("false") || t.equals("0")) {
      return false;
    }
    return defaultValue;
  }
}
