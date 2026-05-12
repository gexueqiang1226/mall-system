FROM m.daocloud.io/docker.io/library/amazoncorretto:17-alpine
WORKDIR /app
COPY target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
