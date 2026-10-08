# LearnHub LMS backend — Render Dockerfile.
#
# Render settings for this file: Root Directory EMPTY (repo root),
# Dockerfile Path ./Dockerfile (the default), runtime Docker.
# (A nested lms-backend/Dockerfile made Render send an empty build context,
# so every COPY failed — root placement avoids that entirely.)
#
# Build:  multi-stage Maven build; no local Java/Maven needed on the host.
# Runtime env needed: PORT (set by Render), APP_DB_URL, DB_USERNAME,
# DB_PASSWORD, JWT_SECRET, APP_CORS_ALLOWED_ORIGINS, APP_FRONTEND_URL,
# TRUSTSTORE_PASSWORD + truststore.jks mounted at /etc/secrets/ (Render
# Secret Files) for Aiven TLS.

FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY lms-backend/pom.xml ./
COPY lms-backend/.mvn ./.mvn
COPY lms-backend/mvnw lms-backend/mvnw.cmd ./
RUN chmod +x mvnw && ./mvnw -q dependency:go-offline
COPY lms-backend/src ./src
RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/lms-backend-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java -Djavax.net.ssl.trustStore=/etc/secrets/truststore.jks -Djavax.net.ssl.trustStorePassword=$TRUSTSTORE_PASSWORD -jar app.jar --spring.profiles.active=prod"]
