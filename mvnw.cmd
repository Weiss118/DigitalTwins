@echo off
REM Maven Wrapper Batch File
REM Generated for digital-twin-poc project

setlocal enabledelayedexpansion

set "MAVEN_VERSION=3.9.6"
set "MAVEN_DIST_URL=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/%MAVEN_VERSION%/apache-maven-%MAVEN_VERSION%-bin.zip"
set "WRAPPER_JAR=.mvn\wrapper\maven-wrapper.jar"
set "WRAPPER_URL=https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar"

REM Check if wrapper jar exists
if not exist "%WRAPPER_JAR%" (
    echo Downloading Maven Wrapper...
    powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%WRAPPER_URL%' -OutFile '%WRAPPER_JAR%'"
    if errorlevel 1 (
        echo Failed to download Maven Wrapper. Please check your internet connection.
        exit /b 1
    )
)

REM Run Maven Wrapper
java -cp "%WRAPPER_JAR%" org.apache.maven.wrapper.MavenWrapperMain %*