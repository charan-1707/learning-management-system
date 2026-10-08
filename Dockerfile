# LearnHub LMS backend — Render Dockerfile.
#
# Render settings for this file: Root Directory EMPTY (repo root),
# Dockerfile Path ./Dockerfile (the default), runtime Docker.
# (A nested lms-backend/Dockerfile made Render send an empty build context,
# so every COPY failed — root placement avoids that entirely.)
#
# Aiven TLS: the CA cert (lms-backend/aiven-ca.pem, public key material —
# safe to commit) is baked into a truststore AT BUILD TIME, so no Render
# Secret Files upload is needed. (Uploading the binary .jks as a secret file
# corrupted it: "Invalid keystore format".)
#
# Build:  multi-stage Maven build; no local Java/Maven needed on the host.
# Runtime env needed: PORT (set by Render), APP_DB_URL, DB_USERNAME,
# DB_PASSWORD, JWT_SECRET, APP_CORS_ALLOWED_ORIGINS, APP_FRONTEND_URL.

FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY lms-backend/pom.xml ./
COPY lms-backend/.mvn ./.mvn
COPY lms-backend/mvnw lms-backend/mvnw.cmd ./
RUN chmod +x mvnw && ./mvnw -q dependency:go-offline
COPY lms-backend/src ./src
RUN ./mvnw clean package -DskipTests
# Bake the Aiven CA into a truststore (keytool is guaranteed in this JDK image).
COPY lms-backend/aiven-ca.pem /tmp/aiven-ca.pem
RUN keytool -importcert -alias aiven-ca -file /tmp/aiven-ca.pem \
  -keystore /tmp/truststore.jks -storepass changeit -noprompt

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/lms-backend-0.0.1-SNAPSHOT.jar app.jar
COPY --from=build /tmp/truststore.jks /app/truststore.jks
EXPOSE 8080
# Cold-start flags for free-tier hosts (Render port-scans with a timeout and
# our JPA metamodel build is slow on shared CPU): C1-only JIT + serial GC cut
# startup CPU, and urandom avoids entropy stalls in containers.
ENTRYPOINT ["sh", "-c", "java -XX:TieredStopAtLevel=1 -XX:+UseSerialGC -Djava.security.egd=file:/dev/./urandom -Djavax.net.ssl.trustStore=/app/truststore.jks -Djavax.net.ssl.trustStorePassword=changeit -jar app.jar --spring.profiles.active=prod"]
