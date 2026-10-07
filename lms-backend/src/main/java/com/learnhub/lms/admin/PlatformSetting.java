package com.learnhub.lms.admin;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** 1:1 with §6.1 platform_settings. Backs GET/PATCH /api/admin/settings (Phase 7). */
@Entity
@Table(name = "platform_settings")
public class PlatformSetting {

  @Id
  @Column(name = "setting_key", length = 80)
  private String settingKey;

  @Column(name = "value_json", columnDefinition = "JSON")
  private String valueJson;

  public String getSettingKey() { return settingKey; }
  public void setSettingKey(String settingKey) { this.settingKey = settingKey; }
  public String getValueJson() { return valueJson; }
  public void setValueJson(String valueJson) { this.valueJson = valueJson; }
}
