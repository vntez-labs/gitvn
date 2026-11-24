"use client";

import {
  Alert,
  Button,
  Group,
  Paper,
  Skeleton,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import axios from "axios";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import useSWR from "swr";
import type { PullRequestDetails } from "@/lib/pull-request";
import { useAuthStore } from "@/store/auth.store";

interface Entry {
  id: number;
  body: string | null;
  user: { login: string } | null;
  html_url: string;
}

interface Activity {
  comments: (Entry & { created_at: string })[];
  reviews: (Entry & { submitted_at: string | null; state: string })[];
}

type Action = "comment" | "APPROVE" | "REQUEST_CHANGES" | "ready" | "update";

export function PullActivity({
  owner,
  repo,
  pull,
  onRefresh,
}: {
  owner: string;
  repo: string;
  pull: PullRequestDetails;
  onRefresh: () => void;
}) {
  const login = useAuthStore((state) => state.user?.login);
  const endpoint = "/api/github/pulls/activity";
  const params = new URLSearchParams({
    owner,
    repo,
    pull_number: String(pull.number),
  });
  const { data, error, isLoading, mutate } = useSWR(
    login ? [`${endpoint}?${params}`, login] : null,
    async ([url]) => (await axios.get<Activity>(url)).data,
  );
  const [message, setMessage] = useState("");
  const [action, setAction] = useState<Action | null>(null);
  const [notice, setNotice] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [updateSha, setUpdateSha] = useState<string | null>(null);
  const [reviewSha, setReviewSha] = useState(pull.head.sha);
  const isOpen = pull.state === "open";
  const isAuthor = Boolean(login && login === pull.user?.login);
  const entries = [
    ...(data?.comments ?? []).map((comment) => ({
      ...comment,
      date: comment.created_at,
      label: "Comment",
      kind: "comment",
    })),
    ...(data?.reviews ?? []).flatMap((review) =>
      review.submitted_at
        ? [
            {
              ...review,
              date: review.submitted_at,
              label: review.state.replaceAll("_", " "),
              kind: "review",
            },
          ]
        : [],
    ),
  ].sort((a, b) => a.date.localeCompare(b.date));

  async function submit(next: Action) {
    setAction(next);
    setNotice("");
    setSubmitError("");
    try {
      await axios.post(endpoint, {
        owner,
        repo,
        pullNumber: pull.number,
        action: next,
        body: message,
        sha:
          next === "APPROVE" || next === "REQUEST_CHANGES"
            ? reviewSha
            : pull.head.sha,
      });
      if (next === "update") {
        setUpdateSha(pull.head.sha);
        setNotice(
          "GitHub đã nhận yêu cầu cập nhật nhánh. Trạng thái sẽ tự làm mới.",
        );
      } else if (next === "ready") {
        setNotice("PR đã sẵn sàng để review.");
      } else {
        setMessage("");
        void mutate();
      }
      onRefresh();
    } catch (error) {
      setSubmitError(
        axios.isAxiosError(error)
          ? error.response?.data?.error || error.message
          : "Không thể gửi thao tác.",
      );
      onRefresh();
    } finally {
      setAction(null);
    }
  }

  return (
    <Stack gap="sm">
      {isLoading && <Skeleton height={48} />}
      {error && (
        <Alert color="red">
          Không thể tải hội thoại.{" "}
          <Button
            size="compact-xs"
            variant="subtle"
            onClick={() => void mutate()}
          >
            Thử lại
          </Button>
        </Alert>
      )}
      {entries.map((entry) => (
        <Paper withBorder key={`${entry.kind}-${entry.id}`} p="sm">
          <Group justify="space-between">
            <Text size="sm" fw={600}>
              {entry.user?.login ?? "GitHub"} · {entry.label}
            </Text>
            <Text size="xs" c="dimmed">
              {new Date(entry.date).toLocaleString()}
            </Text>
          </Group>
          {entry.body && (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {entry.body}
            </ReactMarkdown>
          )}
        </Paper>
      ))}
      <Paper withBorder p="sm">
        <Stack gap="xs">
          {submitError && <Alert color="red">{submitError}</Alert>}
          {notice && <Alert color="blue">{notice}</Alert>}
          <Textarea
            label="Bình luận hoặc nhận xét"
            value={message}
            onChange={(event) => setMessage(event.currentTarget.value)}
            minRows={3}
            disabled={action !== null}
          />
          {isOpen &&
            !pull.draft &&
            !isAuthor &&
            reviewSha !== pull.head.sha && (
              <Alert color="yellow">
                PR có commit mới.
                <Button
                  size="compact-xs"
                  variant="subtle"
                  onClick={() => setReviewSha(pull.head.sha)}
                >
                  Dùng commit mới sau khi xem diff
                </Button>
              </Alert>
            )}
          <Group gap="xs">
            <Button
              size="xs"
              variant="default"
              disabled={
                !message.trim() || (action !== null && action !== "comment")
              }
              loading={action === "comment"}
              onClick={() => void submit("comment")}
            >
              Gửi bình luận
            </Button>
            {isOpen && !pull.draft && !isAuthor && (
              <>
                <Button
                  size="xs"
                  variant="light"
                  color="green"
                  disabled={
                    reviewSha !== pull.head.sha ||
                    (action !== null && action !== "APPROVE")
                  }
                  loading={action === "APPROVE"}
                  onClick={() => void submit("APPROVE")}
                >
                  Approve
                </Button>
                <Button
                  size="xs"
                  variant="light"
                  color="orange"
                  disabled={
                    !message.trim() ||
                    reviewSha !== pull.head.sha ||
                    (action !== null && action !== "REQUEST_CHANGES")
                  }
                  loading={action === "REQUEST_CHANGES"}
                  onClick={() => void submit("REQUEST_CHANGES")}
                >
                  Request changes
                </Button>
              </>
            )}
            {isOpen && pull.draft && isAuthor && (
              <Button
                size="xs"
                disabled={action !== null && action !== "ready"}
                loading={action === "ready"}
                onClick={() => void submit("ready")}
              >
                Ready for review
              </Button>
            )}
            {isOpen &&
              pull.mergeable === true &&
              pull.mergeable_state === "behind" && (
                <Button
                  size="xs"
                  disabled={
                    updateSha === pull.head.sha ||
                    (action !== null && action !== "update")
                  }
                  loading={action === "update"}
                  onClick={() => void submit("update")}
                >
                  Update branch
                </Button>
              )}
          </Group>
        </Stack>
      </Paper>
    </Stack>
  );
}
