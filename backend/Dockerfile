FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src src
RUN mvn -B -q -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system opencamp && mkdir /app/uploads && chown opencamp /app/uploads
COPY --from=build /app/target/backend-0.0.1-SNAPSHOT.jar app.jar
USER opencamp
ENV UPLOAD_DIR=/app/uploads
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
