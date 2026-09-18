package com.learnhub.lms.exception;

/**
 * Thrown when an authenticated user attempts an operation they are not
 * allowed to perform, e.g. a faculty member editing another faculty's course.
 * Maps to HTTP 403 Forbidden.
 */
public class UnauthorizedActionException extends RuntimeException {

    public UnauthorizedActionException(String message) {
        super(message);
    }
}