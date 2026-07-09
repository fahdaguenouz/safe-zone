pipeline {
    agent any

    parameters {
        choice(
            name: 'DEPLOY_ENV',
            choices: ['production', 'staging', 'development'],
            description: 'Select the target deployment environment'
        )
        booleanParam(
            name: 'CLEAR_CACHE',
            defaultValue: false,
            description: 'Check this to aggressively prune Docker cache before building'
        )
    }

    tools {
        jdk 'JDK-21'
        nodejs 'NodeJS-22'
    }

    environment {
        COMPOSE_PROJECT_NAME = 'buy01'
        ENV_CREDENTIALS_ID = 'buy01-env'
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
                echo '✅ Source code fetched successfully!'
            }
        }

        stage('Backend: Build Microservices') {
            steps {
                script {
                    def services = ["discovery-server", "api-gateway", "user-service", "product-service", "media-service"]

                    for (String service : services) {
                        echo "⚙️ Processing backend/${service}..."

                        dir("backend/${service}") {
                            sh 'chmod +x mvnw'
                            sh './mvnw clean package -DskipTests'
                        }
                    }
                }
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: 'backend/*/target/surefire-reports/*.xml'
                }
            }
        }

        stage('Frontend: Build Angular') {
            steps {
                dir('frontend') {
                    echo '📦 Building Angular Frontend...'
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    echo "🚀 Starting ${params.DEPLOY_ENV} deployment via Docker Compose..."

                    withCredentials([file(credentialsId: "${ENV_CREDENTIALS_ID}", variable: 'ENV_FILE')]) {
                        try {
                            sh '''
                                set +x
                                docker compose version
                                docker compose -p "$COMPOSE_PROJECT_NAME" --env-file "$ENV_FILE" down || true
                            '''

                            if (params.CLEAR_CACHE) {
                                echo '🧹 CLEAR_CACHE enabled: pruning Docker build cache...'
                                sh '''
                                    set +e
                                    docker builder prune -af
                                    docker image prune -af
                                    docker container prune -f
                                    set -e
                                '''
                            }

                            sh '''
                                set +x
                                docker compose -p "$COMPOSE_PROJECT_NAME" --env-file "$ENV_FILE" up --build -d
                            '''

                            echo '⏳ Waiting for services to initialize...'
                            sleep(time: 30, unit: 'SECONDS')

                            sh '''
                                docker ps --format '{{.Names}}' | grep '^buy01-discovery-service$'
                                docker ps --format '{{.Names}}' | grep '^buy01-api-gateway-service$'
                                docker ps --format '{{.Names}}' | grep '^buy01-user-service$'
                                docker ps --format '{{.Names}}' | grep '^buy01-product-service$'
                                docker ps --format '{{.Names}}' | grep '^buy01-media-service$'
                                docker ps --format '{{.Names}}' | grep '^buy01-mongodb$'
                                docker ps --format '{{.Names}}' | grep '^buy01-kafka$'
                            '''

                            echo '✅ Deployment Successful and Healthy!'
                        } catch (Exception e) {
                            echo '🚨 DEPLOYMENT OR HEALTH CHECK FAILED! INITIATING ROLLBACK...'

                            sh '''
                                set +x
                                docker compose -p "$COMPOSE_PROJECT_NAME" --env-file "$ENV_FILE" down || true
                            '''

                            error('Deployment failed and was rolled back.')
                        }
                    }
                }
            }
        }
    }

    post {
        success {
            echo '🎉 SUCCESS: All microservices and frontend built and deployed perfectly!'

            withCredentials([string(credentialsId: 'discord-webhook-url', variable: 'DISCORD_WEBHOOK')]) {
                sh '''
                    set +x
                    curl -H "Content-Type: application/json" \
                    -X POST \
                    -d '{"content": "✅ **SUCCESS:** 01buy Pipeline compiled, built, and deployed successfully! 🎉"}' \
                    "$DISCORD_WEBHOOK"
                '''
            }

            mail to: 'YOUR_EMAIL@gmail.com',
                 subject: "✅ SUCCESS: 01buy Build #${env.BUILD_NUMBER}",
                 body: "Great news! The 01buy pipeline completed successfully.\n\nView the logs here: ${env.BUILD_URL}"
        }

        failure {
            echo '❌ FAILURE: A build or deployment failed. Check the Jenkins console output.'

            withCredentials([string(credentialsId: 'discord-webhook-url', variable: 'DISCORD_WEBHOOK')]) {
                sh '''
                    set +x
                    curl -H "Content-Type: application/json" \
                    -X POST \
                    -d '{"content": "🚨 **FAILED:** 01buy Pipeline crashed. Please check the Jenkins console logs immediately."}' \
                    "$DISCORD_WEBHOOK"
                '''
            }

            mail to: 'YOUR_EMAIL@gmail.com',
                 subject: "🚨 FAILURE: 01buy Build #${env.BUILD_NUMBER}",
                 body: "The 01buy pipeline failed during execution.\n\nPlease check the logs immediately: ${env.BUILD_URL}"
        }
    }
}