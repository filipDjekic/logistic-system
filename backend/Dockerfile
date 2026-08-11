FROM eclipse-temurin:21-jdk-jammy AS builder

WORKDIR /workspace

COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw

COPY src/ src/
RUN ./mvnw -DskipTests clean package

FROM eclipse-temurin:21-jre-jammy AS runtime

WORKDIR /app

RUN groupadd --system logistics \
    && useradd --system --gid logistics --home-dir /app logistics \
    && mkdir -p /app/uploads/operational-attachments \
    && chown -R logistics:logistics /app

COPY --from=builder --chown=logistics:logistics /workspace/target/logistics-system-*.jar /app/application.jar

USER logistics
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/application.jar"]
