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
          expression { env.DOCKER_REGISTRY?.trim() }
          expression { env.DOCKER_USERNAME?.trim() }
          expression { env.DOCKER_PASSWORD?.trim() }
        }
      }
      steps {
        sh '''
          echo "$DOCKER_PASSWORD" | docker login "$DOCKER_REGISTRY" -u "$DOCKER_USERNAME" --password-stdin

          docker tag meettilavat-admin:${IMAGE_TAG} $DOCKER_REGISTRY/meettilavat-admin:${IMAGE_TAG}
          docker tag meettilavat-public:${IMAGE_TAG} $DOCKER_REGISTRY/meettilavat-public:${IMAGE_TAG}

          docker push $DOCKER_REGISTRY/meettilavat-admin:${IMAGE_TAG}
          docker push $DOCKER_REGISTRY/meettilavat-public:${IMAGE_TAG}
        '''
      }
    }

    stage("Deploy to EC2") {
      when {
        allOf {
          expression { env.EC2_HOST?.trim() }
          expression { env.EC2_USER?.trim() }
          expression { env.EC2_SSH_KEY_ID?.trim() }
          expression { env.DOCKER_REGISTRY?.trim() }
          expression { env.DOCKER_USERNAME?.trim() }
          expression { env.DOCKER_PASSWORD?.trim() }
          expression { env.NEXT_PUBLIC_SUPABASE_URL?.trim() }
          expression { env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() }
        }
      }
      steps {
        sshagent(credentials: [env.EC2_SSH_KEY_ID]) {
          sh '''
            set +x
            scp -o StrictHostKeyChecking=no docker-compose.ec2.yml $EC2_USER@$EC2_HOST:~/docker-compose.ec2.yml
            ssh -o StrictHostKeyChecking=no $EC2_USER@$EC2_HOST "
              set -euo pipefail
              export DOCKER_REGISTRY=\\\"$DOCKER_REGISTRY\\\"
              export IMAGE_TAG=\\\"$IMAGE_TAG\\\"
              export NEXT_PUBLIC_SUPABASE_URL=\\\"$NEXT_PUBLIC_SUPABASE_URL\\\"
              export NEXT_PUBLIC_SUPABASE_ANON_KEY=\\\"$NEXT_PUBLIC_SUPABASE_ANON_KEY\\\"
              export PUBLIC_PORT=\\\"$PUBLIC_PORT\\\"
              export ADMIN_PORT=\\\"$ADMIN_PORT\\\"

              echo \\\"$DOCKER_PASSWORD\\\" | docker login \\\"$DOCKER_REGISTRY\\\" -u \\\"$DOCKER_USERNAME\\\" --password-stdin

              docker compose -f ~/docker-compose.ec2.yml pull
              docker compose -f ~/docker-compose.ec2.yml up -d --remove-orphans
            "
          '''
        }
      }
    }
  }
}
