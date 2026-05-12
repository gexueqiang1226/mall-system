# 使用本地已构建的 dist，不重新编译
# 构建阶段已在本地完成（make build-admin）
FROM m.daocloud.io/docker.io/library/nginx:alpine
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]
