package com.learnhub.lms.user;

/**
 * Mirrors users.status ENUM('active','suspended','warning','on-leave').
 * {@code on-leave} is not a legal Java identifier, so the enum constant is
 * {@code on_leave} and {@link UserStatusConverter} maps it to {@code on-leave}.
 */
public enum UserStatus {
  active("active"),
  suspended("suspended"),
  warning("warning"),
  on_leave("on-leave");

  public final String dbValue;

  UserStatus(String dbValue) {
    this.dbValue = dbValue;
  }

  public static UserStatus fromDb(String dbValue) {
    for (UserStatus s : values()) {
      if (s.dbValue.equals(dbValue)) {
        return s;
      }
    }
    throw new IllegalArgumentException("Unknown user status: " + dbValue);
  }
}
