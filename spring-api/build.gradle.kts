plugins {
    java
    id("org.springframework.boot") version "3.4.5"
    id("io.spring.dependency-management") version "1.1.7"
    id("checkstyle")
    id("org.owasp.dependencycheck") version "12.1.1"
}

group = "com.example"
version = "0.0.1-SNAPSHOT"

// Override managed versions to address CVEs
extra["tomcat.version"] = "10.1.45"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.flywaydb:flyway-database-postgresql")
    runtimeOnly("org.postgresql:postgresql")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.withType<Test> {
    useJUnitPlatform()
}

tasks.named<org.springframework.boot.gradle.tasks.run.BootRun>("bootRun") {
    val dotenv = file(".env")
    if (dotenv.exists()) {
        dotenv.readLines()
            .filter { it.isNotBlank() && !it.startsWith("#") }
            .mapNotNull { line ->
                val idx = line.indexOf('=')
                if (idx > 0) line.substring(0, idx) to line.substring(idx + 1) else null
            }
            .forEach { (key, value) -> environment(key, value) }
    }
}

checkstyle {
    toolVersion = "10.21.4"
    configFile = file("config/checkstyle/checkstyle.xml")
    isIgnoreFailures = false
}

dependencyCheck {
    failBuildOnCVSS = 7.0f
    suppressionFile = "config/dependency-check-suppressions.xml"
    skipConfigurations = listOf("checkstyle")
    cveValidForHours = 24
    nvd {
        apiKey = System.getenv("NVD_API_KEY") ?: ""
    }
    analyzers {
        ossIndex {
            enabled = false
        }
    }
}
