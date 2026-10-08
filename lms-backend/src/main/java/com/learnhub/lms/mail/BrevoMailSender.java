package com.learnhub.lms.mail;

import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.annotation.Primary;
import org.springframework.mail.MailException;
import org.springframework.mail.MailParseException;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

import jakarta.mail.internet.MimeMessage;

/**
 * Outgoing mail over HTTPS (Brevo transactional API) instead of SMTP.
 *
 * <p>Why: hosts like Render blackhole outbound SMTP (smtp.gmail.com:587 times
 * out), which not only breaks OTP/reset emails but also hangs every send for
 * minutes AND poisons {@code /actuator/health} via MailHealthIndicator. HTTPS
 * to api.brevo.com uses port 443, which is always open.</p>
 *
 * <p>Only created when {@code app.brevo-api-key} is non-blank, and
 * {@code @Primary} so it wins if an SMTP sender also exists. Call sites
 * ({@code OtpService}, {@code PasswordResetService}) only ever send
 * {@code SimpleMailMessage}, so MIME methods are unsupported by design.</p>
 *
 * <p>Setup: free Brevo account → generate an API key → verify the sender email
 * (Settings &rarr; Senders) → set {@code APP_BREVO_API_KEY} (+
 * {@code APP_MAIL_FROM} to match the verified sender).</p>
 */
@Component
@Primary
@ConditionalOnExpression("'${app.brevo-api-key:}' != ''")
public class BrevoMailSender implements JavaMailSender {

  private static final Logger LOG = LoggerFactory.getLogger(BrevoMailSender.class);
  private static final String API_URL = "https://api.brevo.com/v3/smtp/email";

  private final String apiKey;
  private final String defaultFrom;
  private final HttpClient http;

  public BrevoMailSender(@Value("${app.brevo-api-key}") String apiKey,
      @Value("${app.mail-from:no-reply@learnhub.local}") String defaultFrom) {
    this.apiKey = apiKey;
    this.defaultFrom = defaultFrom;
    this.http = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(10))
        .build();
  }

  @Override
  public void send(SimpleMailMessage simpleMessage) throws MailException {
    send(new SimpleMailMessage[] { simpleMessage });
  }

  @Override
  public void send(SimpleMailMessage... simpleMessages) throws MailException {
    for (SimpleMailMessage m : simpleMessages) {
      sendOne(m);
    }
  }

  private void sendOne(SimpleMailMessage m) {
    String[] to = m.getTo();
    if (to == null || to.length == 0) {
      throw new MailParseException("Brevo send failed: no recipients");
    }
    StringBuilder toJson = new StringBuilder();
    for (String addr : to) {
      if (toJson.length() > 0) {
        toJson.append(',');
      }
      toJson.append("{\"email\":\"").append(esc(addr)).append("\"}");
    }
    String from = m.getFrom() != null ? m.getFrom() : defaultFrom;
    String body = "{\"sender\":{\"email\":\"" + esc(from) + "\"},"
        + "\"to\":[" + toJson + "],"
        + "\"subject\":\"" + esc(m.getSubject()) + "\","
        + "\"textContent\":\"" + esc(m.getText()) + "\"}";
    HttpRequest req = HttpRequest.newBuilder()
        .uri(URI.create(API_URL))
        .timeout(Duration.ofSeconds(15))
        .header("api-key", apiKey)
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
        .build();
    try {
      HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
      if (res.statusCode() < 200 || res.statusCode() >= 300) {
        throw new MailSendException(
            "Brevo rejected the message: HTTP " + res.statusCode() + " " + res.body());
      }
      LOG.debug("Brevo accepted mail to {}", (Object) to);
    } catch (MailException e) {
      throw e;
    } catch (Exception e) {
      throw new MailSendException("Brevo send failed: " + e.getMessage());
    }
  }

  private static String esc(String s) {
    if (s == null) {
      return "";
    }
    return s.replace("\\", "\\\\").replace("\"", "\\\"")
        .replace("\r", "\\r").replace("\n", "\\n").replace("\t", "\\t");
  }

  @Override
  public MimeMessage createMimeMessage() {
    throw new UnsupportedOperationException("BrevoMailSender supports SimpleMailMessage only");
  }

  @Override
  public MimeMessage createMimeMessage(InputStream contentStream) throws MailException {
    throw new UnsupportedOperationException("BrevoMailSender supports SimpleMailMessage only");
  }

  @Override
  public void send(MimeMessage mimeMessage) throws MailException {
    throw new UnsupportedOperationException("BrevoMailSender supports SimpleMailMessage only");
  }

  @Override
  public void send(MimeMessage... mimeMessages) throws MailException {
    throw new UnsupportedOperationException("BrevoMailSender supports SimpleMailMessage only");
  }

  @Override
  public void send(org.springframework.mail.javamail.MimeMessagePreparator mimeMessagePreparator)
      throws MailException {
    throw new UnsupportedOperationException("BrevoMailSender supports SimpleMailMessage only");
  }

  @Override
  public void send(org.springframework.mail.javamail.MimeMessagePreparator... mimeMessagePreparators)
      throws MailException {
    throw new UnsupportedOperationException("BrevoMailSender supports SimpleMailMessage only");
  }
}
