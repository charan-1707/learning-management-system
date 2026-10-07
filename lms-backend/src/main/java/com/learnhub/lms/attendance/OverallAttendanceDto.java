package com.learnhub.lms.attendance;

public record OverallAttendanceDto(int present, int total, int percent, int courses) {
}
