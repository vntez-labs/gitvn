'use client';

import { useState, useEffect } from 'react';
import { Box } from '@mantine/core';
import { useDashboardStore } from '@/store/dashboard.store';
import { WorkspaceHeader, WorkspaceTab } from '../workspace/WorkspaceHeader';
import { BranchActionBanner } from '../workspace/BranchActionBanner';
import { CodeTab } from '../workspace/CodeTab';
import { CommitsTab } from '../workspace/CommitsTab';
import { JiraWorkspace } from '../workspace/jira/JiraWorkspace';
import { OverviewTab } from '../workspace/OverviewTab';
import { PullsTab } from '../workspace/PullsTab';
import { IssuesTab } from '../workspace/IssuesTab';
import axios from 'axios';
import { SettingsTab } from '../workspace/SettingsTab';

export function RepoWorkspace() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('code');
  const [commitsCount, setCommitsCount] = useState<number | undefined>(undefined);
  const [pullsCount, setPullsCount] = useState<number>(0);
  const [issuesCount, setIssuesCount] = useState<number>(0);
  const { selectedRepo } = useDashboardStore();

  // Tự động đồng bộ số lượng PRs và Issues mở thực tế ngay khi đổi Repo
  useEffect(() => {
    if (!selectedRepo) return;

    // Reset về 0 tránh giữ số cũ của repo trước
    setCommitsCount(undefined);
    setPullsCount(0);
    setIssuesCount(0);

    const owner = selectedRepo.owner.login;
    const repo = selectedRepo.name;

    // Gọi API stats để lấy số đếm thực tế (dùng GraphQL backend, không bị giới hạn 1 trang)
    axios
      .get(`/api/github/stats?owner=${owner}&repo=${repo}`)
      .then((res) => {
        const pulse = res.data?.pulse;
        if (pulse) {
          setPullsCount(pulse.pulls?.open ?? 0);
          setIssuesCount(pulse.issues?.open ?? 0);
        }
      })
      .catch((err) => {
        console.error('Lỗi lấy số đếm badge:', err);
      });
  }, [selectedRepo?.id]);

  if (!selectedRepo) return null;

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, backgroundColor: '#0d1117' }}>
      <WorkspaceHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        commitsCount={commitsCount}
        pullsCount={pullsCount}
        issuesCount={issuesCount}
      />

      <BranchActionBanner onTabChange={setActiveTab} />

      {activeTab === 'code' && <CodeTab onNavigateTab={setActiveTab} />}
      {activeTab === 'commits' && <CommitsTab onCommitsLoaded={setCommitsCount} />}
      {activeTab === 'kanban' && <JiraWorkspace />}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'pulls' && (
        <PullsTab
          onPullsLoaded={(count) => {
            if (typeof count === 'number') {
              setPullsCount(count);
            }
          }}
        />
      )}
      {activeTab === 'issues' && (
        <IssuesTab
          onIssuesLoaded={(count) => {
            if (typeof count === 'number') {
              setIssuesCount(count);
            }
          }}
        />
      )}
      {activeTab === 'settings' && <SettingsTab />}
    </Box>
  );
}
