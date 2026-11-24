"use client";

import {
  Avatar,
  Combobox,
  Group,
  Text,
  TextInput,
  useCombobox,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconArrowUpRight, IconSearch } from "@tabler/icons-react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import useSWR from "swr";

interface SearchUser {
  login: string;
  avatar_url: string;
}

async function fetchUsers(url: string) {
  const { data } = await axios.get<{ users: SearchUser[] }>(url);
  return data.users;
}

function usersUrl(query: string, exact = false) {
  const params = new URLSearchParams({ q: query, scope: "profile" });
  if (exact) params.set("exact", "1");
  return `/api/github/users/search?${params}`;
}

export function ProfileSearch() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const [validating, setValidating] = useState(false);
  const liveInput = useRef("");
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });
  const query = input.trim().replace(/^@/, "");
  const [debounced] = useDebouncedValue(query, 240);
  const valid = /^[a-z\d-]{1,39}$/i.test(query);
  const ready = valid && query.length >= 2 && debounced === query;
  const {
    data: users,
    isLoading,
    error,
  } = useSWR(
    ready && combobox.dropdownOpened ? usersUrl(query) : null,
    fetchUsers,
    { shouldRetryOnError: false, revalidateOnFocus: false },
  );
  const results = users ?? [];

  function openProfile(login: string) {
    combobox.closeDropdown();
    setInput("");
    liveInput.current = "";
    setMessage("");
    router.push(`/u/${encodeURIComponent(login)}`);
  }

  async function validateUsername() {
    if (!valid || validating) return;
    const entered = liveInput.current;
    setValidating(true);
    setMessage("");
    combobox.openDropdown();
    try {
      const [match] = await fetchUsers(usersUrl(query, true));
      if (liveInput.current !== entered) return;
      if (match) openProfile(match.login);
      else setMessage("Không tìm thấy đúng username này.");
    } catch {
      if (liveInput.current === entered)
        setMessage("Chưa kiểm tra được username. Thử lại sau.");
    } finally {
      setValidating(false);
    }
  }

  return (
    <Combobox
      store={combobox}
      onOptionSubmit={openProfile}
      position="bottom"
      offset={7}
      withinPortal
      shadow="md"
    >
      <Combobox.Target>
        <TextInput
          size="sm"
          radius="md"
          aria-label="Tìm tài khoản GitHub"
          placeholder="Tìm username GitHub"
          leftSection={<IconSearch size={17} />}
          value={input}
          className="w-full [&_input]:bg-zinc-50"
          onFocus={() => {
            if (query) combobox.openDropdown();
          }}
          onBlur={() => combobox.closeDropdown()}
          onChange={(event) => {
            const next = event.currentTarget.value;
            liveInput.current = next;
            setInput(next);
            setMessage("");
            combobox.resetSelectedOption();
            if (next.trim()) combobox.openDropdown();
            else combobox.closeDropdown();
          }}
          onKeyDown={(event) => {
            if (
              event.key !== "Enter" ||
              event.nativeEvent.isComposing ||
              combobox.getSelectedOptionIndex() !== -1
            )
              return;
            event.preventDefault();
            void validateUsername();
          }}
        />
      </Combobox.Target>
      <Combobox.Dropdown>
        <Combobox.Options mah={310} style={{ overflowY: "auto" }}>
          {message && <Combobox.Empty role="status">{message}</Combobox.Empty>}
          {!message && validating && (
            <Combobox.Empty role="status">
              Đang kiểm tra username…
            </Combobox.Empty>
          )}
          {!message &&
            !validating &&
            (isLoading || (valid && query.length >= 2 && !ready)) && (
              <Combobox.Empty>Đang tìm tài khoản…</Combobox.Empty>
            )}
          {!message &&
            !validating &&
            ready &&
            !isLoading &&
            !results.length && (
              <Combobox.Empty>
                {error
                  ? "Không tải được gợi ý GitHub."
                  : "Không có tài khoản phù hợp."}
              </Combobox.Empty>
            )}
          {!message && !validating && query && !valid && (
            <Combobox.Empty>
              Username GitHub chỉ gồm chữ, số và dấu gạch ngang.
            </Combobox.Empty>
          )}
          {!message && !validating && valid && !ready && query.length < 2 && (
            <Combobox.Empty>Gõ ít nhất 2 ký tự để xem gợi ý.</Combobox.Empty>
          )}
          {ready &&
            !validating &&
            results.map((user) => (
              <Combobox.Option key={user.login} value={user.login}>
                <Group wrap="nowrap" gap="sm">
                  <Avatar size={29} src={user.avatar_url} />
                  <Text size="sm" fw={600} truncate style={{ flex: 1 }}>
                    @{user.login}
                  </Text>
                  <IconArrowUpRight size={14} color="#71717a" />
                </Group>
              </Combobox.Option>
            ))}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
