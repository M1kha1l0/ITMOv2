#!/usr/bin/env bash
set -euo pipefail

REPO="M1kha1l0/sample-python-project"
COMMAND="${1:-status}"

case "$COMMAND" in
  create)
    BRANCH="demo/defense-pr-$(date +%s)"
    TITLE="Feature: Add rating system and cache metrics [Demo $(date +%H:%M:%S)]"
    TEMP_DIR=$(mktemp -d)
    echo "Cloning to temporary directory $TEMP_DIR..."
    git clone "git@github.com:${REPO}.git" "$TEMP_DIR" --depth 1
    cd "$TEMP_DIR"
    git checkout -b "$BRANCH"

    cat << 'EOF' >> blog/models.py

class PostRating(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="ratings")
    score = models.IntegerField(default=5)
    ip_hash = models.CharField(max_length=64, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
EOF

    cat << 'EOF' >> blog/views.py

def rate_post(request, slug: str):
    post = get_object_or_404(Post, slug=slug, published=True)
    if request.method == "POST":
        score = int(request.POST.get("score", 5))
        PostRating.objects.create(post=post, score=score)
        return render(request, "blog/post_detail.html", {"post": post})
    return render(request, "blog/post_detail.html", {"post": post})
EOF

    git add blog/models.py blog/views.py
    git commit -m "Add PostRating model and rate_post view"
    git push origin "$BRANCH"

    PR_URL=$(gh pr create --repo "$REPO" --base main --head "$BRANCH" --title "$TITLE" --body "Live demo PR for Practice 7.1 defense.")
    echo "SUCCESS: Created $PR_URL"
    rm -rf "$TEMP_DIR"
    ;;

  review-other)
    PR_NUM="${2:-9}"
    echo "Sending /make_other_ai_review to PR #$PR_NUM in $REPO..."
    gh pr comment "$PR_NUM" --repo "$REPO" --body "/make_other_ai_review"
    echo "Triggered 2nd model review (Claude Sonnet 4.5). Check n8n Executions or wait 20s to refresh PR."
    ;;

  review-main)
    PR_NUM="${2:-9}"
    echo "Sending /make_ai_review to PR #$PR_NUM in $REPO..."
    gh pr comment "$PR_NUM" --repo "$REPO" --body "/make_ai_review"
    echo "Triggered main model review. Open n8n Executions: will show filtered out by Data Table deduplication."
    ;;

  status)
    PR_NUM="${2:-9}"
    echo "=== PR #$PR_NUM Details ==="
    gh pr view "$PR_NUM" --repo "$REPO" --comments
    ;;

  *)
    echo "Usage: $0 {create|review-other [PR_NUM]|review-main [PR_NUM]|status [PR_NUM]}"
    exit 1
    ;;
esac
