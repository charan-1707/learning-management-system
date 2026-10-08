# LearnHub LMS backend — Render Dockerfile (use only if the Java runtime
# isn't offered; otherwise prefer the native Java runtime with:
#   build: ./mvnw clean package -DskipTests
#   start: java ... --spring.profiles.active=prod)
#
# Build:  Render builds this from lms-backend/ as the root directory.
# Runtime env needed: PORT (set by Render), APP_DB_URL, DB_USERNAME,
# DB_PASSWORD, JWT_SECRET, APP_CORS_ALLOWED_ORIGINS, APP_FRONTEND_URL,
# TRUSTSTORE_PASSWORD + truststore.jks mounted at /etc/secrets/ (Render
# Secret Files) for Aiven TLS.

FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml ./
COPY .mvn ./.mvn
COPY mvnw mvnw.cmd ./
RUN chmod +x mvnw && ./mvnw -q dependency:go-offline
COPY src ./src
RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/lms-backend-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java -Djavax.net.ssl.trustStore=/etc/secrets/truststore.jks -Djavax.net.ssl.trustStorePassword=$TRUSTSTORE_PASSWORD -jar app.jar --spring.profiles.active=prod"]
