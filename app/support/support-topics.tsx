"use client";

import { useMemo, useState } from "react";
import { analyticsEvents, track } from "@/lib/analytics/events";
import { useI18n } from "../i18n-provider";

const TOPICS = ["Password generator", "Username generator", "Password strength", "Privacy", "Account and settings", "Technical issues"];

export default function SupportTopics() {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const topics = useMemo(() => TOPICS.filter((topic) => topic.toLowerCase().includes(query.toLowerCase())), [query]);
  return (
    <div className="support-topics-wrap">
      <label className="support-search-label" htmlFor="support-search">{t.searchHelp}</label>
      <input id="support-search" className="support-search" type="search" value={query} onChange={(event) => { setQuery(event.target.value); track(analyticsEvents.supportSearchUsed, { has_query: Boolean(event.target.value) }); }} placeholder={t.searchHelp} />
      <ul className="support-topics">
        {topics.map((topic) => <li key={topic}><button type="button" onClick={() => setQuery(topic)}>{topic}</button></li>)}
      </ul>
      {topics.length === 0 && <p className="form-note">{t.noTopics}</p>}
    </div>
  );
}
