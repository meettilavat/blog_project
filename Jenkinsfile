pipeline {
  agent any

  options {
    timestamps()
  }

  environment {
    NEXT_TELEMETRY_DISABLED = "1"
  }

  stages {
    stage("Checkout") {
      steps {
        checkout scm
      }
    }

    stage("Install") {
      steps {
        sh "npm ci"
      }
    }

    stage("Lint") {
      steps {
        sh "npm run lint"
      }
    }

    stage("Build Apps") {
      parallel {
        stage("Build Admin") {
          steps {
            sh "npm run build"
          }
        }
        stage("Build Public") {
          steps {
            sh "npm run build:public"
          }
        }
      }
    }

    stage("Build Docker Images") {
      steps {
        script {
          def sha = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
          env.IMAGE_TAG = "${env.BUILD_NUMBER}-${sha}"
        }
        sh '''
          docker build --build-arg APP=admin -t meettilavat-admin:${IMAGE_TAG} .
          docker build --build-arg APP=public -t meettilavat-public:${IMAGE_TAG} .
        '''
      }
    }

    stage("Push Docker Images") {
      when {
        allOf {
          expression { env.DOCKER_USERNAME?.trim() }
          expression { env.DOCKER_PASSWORD?.trim() }
        }
      }
      steps {
        script {
          def registry = env.DOCKER_REGISTRY?.trim()
          def namespace = env.DOCKER_NAMESPACE?.trim()

          if (registry && registry != "docker.io") {
            env.DOCKER_IMAGE_PREFIX = namespace ? "${registry}/${namespace}" : registry
            env.DOCKER_LOGIN_TARGET = registry
          } else {
            if (!namespace) {
              namespace = env.DOCKER_USERNAME
            }
            env.DOCKER_IMAGE_PREFIX = namespace
            env.DOCKER_LOGIN_TARGET = ""
          }
        }
        sh '''
          if [ -n "$DOCKER_LOGIN_TARGET" ]; then
            echo "$DOCKER_PASSWORD" | docker login "$DOCKER_LOGIN_TARGET" -u "$DOCKER_USERNAME" --password-stdin
          else
            echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
          fi

          docker tag meettilavat-admin:${IMAGE_TAG} ${DOCKER_IMAGE_PREFIX}/meettilavat-admin:${IMAGE_TAG}
          docker tag meettilavat-public:${IMAGE_TAG} ${DOCKER_IMAGE_PREFIX}/meettilavat-public:${IMAGE_TAG}

          docker push ${DOCKER_IMAGE_PREFIX}/meettilavat-admin:${IMAGE_TAG}
          docker push ${DOCKER_IMAGE_PREFIX}/meettilavat-public:${IMAGE_TAG}
        '''
      }
    }

    stage("Deploy to EC2") {
      when {
        allOf {
          expression { env.EC2_HOST?.trim() }
          expression { env.EC2_USER?.trim() }
          expression { env.EC2_SSH_KEY_ID?.trim() }
          expression { env.DOCKER_USERNAME?.trim() }
          expression { env.DOCKER_PASSWORD?.trim() }
          expression { env.NEXT_PUBLIC_SUPABASE_URL?.trim() }
          expression { env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() }
        }
      }
      steps {
        script {
          def registry = env.DOCKER_REGISTRY?.trim()
          def namespace = env.DOCKER_NAMESPACE?.trim()

          if (registry && registry != "docker.io") {
            env.DOCKER_IMAGE_PREFIX = namespace ? "${registry}/${namespace}" : registry
            env.DOCKER_LOGIN_TARGET = registry
          } else {
            if (!namespace) {
              namespace = env.DOCKER_USERNAME
            }
            env.DOCKER_IMAGE_PREFIX = namespace
            env.DOCKER_LOGIN_TARGET = ""
          }
        }
        sshagent(credentials: [env.EC2_SSH_KEY_ID]) {
          sh '''
            set +x
            scp -o StrictHostKeyChecking=no docker-compose.ec2.yml $EC2_USER@$EC2_HOST:~/docker-compose.ec2.yml
            ssh -o StrictHostKeyChecking=no $EC2_USER@$EC2_HOST "
              set -euo pipefail
              export DOCKER_IMAGE_PREFIX=\\\"$DOCKER_IMAGE_PREFIX\\\"
              export DOCKER_LOGIN_TARGET=\\\"$DOCKER_LOGIN_TARGET\\\"
              export IMAGE_TAG=\\\"$IMAGE_TAG\\\"
              export NEXT_PUBLIC_SUPABASE_URL=\\\"$NEXT_PUBLIC_SUPABASE_URL\\\"
              export NEXT_PUBLIC_SUPABASE_ANON_KEY=\\\"$NEXT_PUBLIC_SUPABASE_ANON_KEY\\\"
              export PUBLIC_PORT=\\\"$PUBLIC_PORT\\\"
              export ADMIN_PORT=\\\"$ADMIN_PORT\\\"

              if [ -n \\\"$DOCKER_LOGIN_TARGET\\\" ]; then
                echo \\\"$DOCKER_PASSWORD\\\" | docker login \\\"$DOCKER_LOGIN_TARGET\\\" -u \\\"$DOCKER_USERNAME\\\" --password-stdin
              else
                echo \\\"$DOCKER_PASSWORD\\\" | docker login -u \\\"$DOCKER_USERNAME\\\" --password-stdin
              fi

              docker compose -f ~/docker-compose.ec2.yml pull
              docker compose -f ~/docker-compose.ec2.yml up -d --remove-orphans
            "
          '''
        }
      }
    }
  }
}
