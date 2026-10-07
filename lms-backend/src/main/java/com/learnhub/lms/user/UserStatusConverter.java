package com.learnhub.lms.user;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Maps {@link UserStatus} <-> the hyphenated DB ENUM value (see §6.1). */
@Converter(autoApply = true)
public class UserStatusConverter implements AttributeConverter<UserStatus, String> {

  @Override
  public String convertToDatabaseColumn(UserStatus status) {
    return status == null ? null : status.dbValue;
  }

  @Override
  public UserStatus convertToEntityAttribute(String dbValue) {
    return dbValue == null ? null : UserStatus.fromDb(dbValue);
  }
}
