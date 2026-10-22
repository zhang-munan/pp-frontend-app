pipeline {
    agent any

    options {
        disableConcurrentBuilds(abortPrevious: true)
        timestamps()
    }

    parameters {
        string(
            name: 'H5_VERSION',
            defaultValue: 'v0.1.0',
            description: '已发布且包含 h5-dist.tar.gz 的 GitHub Release 标签',
            trim: true
        )
    }

    environment {
        PATH        = '/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin'
        IMAGE_NAME  = 'maoyu-h5'
        IMAGE_TAG   = "${params.H5_VERSION}"
        SERVER_IP   = '124.222.204.121'
        SERVER_USER = 'deploy'
        DEPLOY_DIR  = '/opt/apps/mao-yu-ye'
        BUILD_DIR   = '/opt/apps/mao-yu-ye/build-h5'
    }

    stages {
        stage('Checkout') {
            steps {
                script {
                    if (!(params.H5_VERSION ==~ /^v\d+\.\d+\.\d+$/)) {
                        error('H5_VERSION 必须为 v1.2.3 格式')
                    }
                }
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: "refs/tags/${params.H5_VERSION}"]],
                    userRemoteConfigs: [[
                        credentialsId: 'ghcr-credentials',
                        url: 'https://github.com/zhang-munan/send-frontend-app.git'
                    ]]
                ])
            }
        }

        stage('Download H5 Artifact') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'ghcr-credentials',
                    usernameVariable: 'GITHUB_USER',
                    passwordVariable: 'GITHUB_TOKEN'
                )]) {
                    sh '''
                        set -eu
                        rm -rf h5-dist h5-dist.tar.gz release.json

                        curl --silent --show-error --fail --location \
                            --header "Authorization: Bearer $GITHUB_TOKEN" \
                            --header "Accept: application/vnd.github+json" \
                            "https://api.github.com/repos/zhang-munan/send-frontend-app/releases/tags/$IMAGE_TAG" \
                            --output release.json

                        ASSET_API_URL="$(python3 -c 'import json, sys; data=json.load(open(sys.argv[1])); print(next((item["url"] for item in data.get("assets", []) if item.get("name") == "h5-dist.tar.gz"), ""))' release.json)"
                        test -n "$ASSET_API_URL"

                        curl --silent --show-error --fail --location \
                            --header "Authorization: Bearer $GITHUB_TOKEN" \
                            --header "Accept: application/octet-stream" \
                            "$ASSET_API_URL" \
                            --output h5-dist.tar.gz

                        mkdir h5-dist
                        tar -xzf h5-dist.tar.gz -C h5-dist
                        test -s h5-dist/index.html
                    '''
                }
            }
        }

        stage('Sync to Server') {
            steps {
                sshagent(credentials: ['server-ssh']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} 'mkdir -p ${BUILD_DIR}'
                    """
                    sh """
                        rsync -az --delete \
                            --exclude='.git' \
                            --exclude='.github' \
                            --exclude='node_modules' \
                            --exclude='unpackage' \
                            --exclude='h5-dist.tar.gz' \
                            --exclude='release.json' \
                            -e 'ssh -o StrictHostKeyChecking=no' \
                            ./ ${SERVER_USER}@${SERVER_IP}:${BUILD_DIR}/
                    """
                }
            }
        }

        stage('Build & Deploy on Server') {
            steps {
                sshagent(credentials: ['server-ssh']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} '
                            set -eu
                            cd ${BUILD_DIR}
                            docker build -t ${IMAGE_NAME}:${IMAGE_TAG} -f Dockerfile.h5 .
                            cd ${DEPLOY_DIR}
                            sed -i "s|^H5_IMAGE=.*|H5_IMAGE=${IMAGE_NAME}:${IMAGE_TAG}|" .env.production
                            docker compose --env-file .env.production -f compose.yml up -d --no-deps h5
                            # compose 返回只表示容器已创建；端口刚切换时常见 Connection reset，
                            # curl --retry-connrefused 不会重试 56，这里轮询 host:8102/healthz。
                            ready=0
                            n=1
                            while [ "\$n" -le 30 ]; do
                                if curl --fail --silent --connect-timeout 2 --max-time 5 http://127.0.0.1:8102/healthz >/dev/null 2>&1; then
                                    ready=1
                                    break
                                fi
                                n=\$((n + 1))
                                sleep 1
                            done
                            if [ "\$ready" -ne 1 ]; then
                                echo "H5 健康检查失败: http://127.0.0.1:8102/healthz"
                                docker compose --env-file .env.production -f compose.yml ps || true
                                docker compose --env-file .env.production -f compose.yml logs --tail 80 h5 || true
                                exit 1
                            fi
                            echo "✅ 构建部署完成: ${IMAGE_NAME}:${IMAGE_TAG}"
                        '
                    """
                }
            }
        }
    }

    post {
        always {
            sh 'rm -f h5-dist.tar.gz release.json'
        }
        success {
            echo "✅ H5 部署成功！镜像: ${IMAGE_NAME}:${IMAGE_TAG}"
        }
        failure {
            echo "❌ H5 部署失败，请检查日志"
        }
    }
}
