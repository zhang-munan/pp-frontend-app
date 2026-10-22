#!/usr/bin/env bash
set -euo pipefail

version="${1:-}"
output_dir="unpackage/dist/build/web"

if [[ ! "$version" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "用法: bash scripts/publish-h5-release.sh v1.0.0"
  exit 1
fi

release_branch="$(git branch --show-current)"
if [[ "$release_branch" != release/* ]]; then
  echo "请先把待发布代码合并到 release/ 分支，并切换到该分支。"
  exit 1
fi

if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  echo "存在未提交的源码改动，请先提交或处理后再发布。"
  exit 1
fi

if [[ ! -f "$output_dir/index.html" ]]; then
  echo "未找到 $output_dir/index.html，请先在 HBuilderX 中发行 H5。"
  exit 1
fi

command -v gh >/dev/null || { echo "未安装 GitHub CLI（gh）。"; exit 1; }
gh auth status >/dev/null

git fetch origin "$release_branch"
local_commit="$(git rev-parse HEAD)"
remote_commit="$(git rev-parse "origin/$release_branch")"
if [[ "$local_commit" != "$remote_commit" ]]; then
  echo "本地 $release_branch 与 GitHub origin/$release_branch 不一致，请先执行 git pull --ff-only。"
  exit 1
fi

archive_dir="$(mktemp -d)"
archive="$archive_dir/h5-dist.tar.gz"
tar -czf "$archive" -C "$output_dir" .

gh release create "$version" "$archive#h5-dist.tar.gz" \
  --target "$local_commit" \
  --title "H5 $version" \
  --notes "HBuilderX H5 production build"

echo "H5 Release $version 已创建"
