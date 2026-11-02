import { useEffect, useState } from "react";
import axios from "axios";
import { BackendUrl } from "./FrontendUtils";
import { getApiErrorMessage } from "./apiErrorMessage";

export function storiesByWriter(stories, authorId) {
  return stories.filter((story) => String(typeof story.createdBy === "object" ? story.createdBy?._id : story.createdBy) === String(authorId));
}

export function writerTopics(stories) {
  return [...new Set(stories.map((story) => story.category).filter(Boolean))].sort();
}

export default function useWriters() {
  const [state, setState] = useState({ authors: [], stories: [], loading: true, error: "" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState((current) => ({ ...current, loading: true, error: "" }));
    async function load() {
      try {
        const [authorsResponse, storiesResponse] = await Promise.all([
          axios.get(`${BackendUrl}/api/v1/user/authors`, { signal: controller.signal, withCredentials: true }),
          axios.get(`${BackendUrl}/api/v1/blog/all`, { signal: controller.signal, withCredentials: true }),
        ]);
        if (!Array.isArray(authorsResponse.data.authors) || !Array.isArray(storiesResponse.data.allBlogs)) {
          console.error("Writer directory received an invalid API response.");
          setState({ authors: [], stories: [], loading: false, error: "The writer directory returned incomplete data. Please try again." });
          return;
        }
        setState({ authors: authorsResponse.data.authors, stories: storiesResponse.data.allBlogs.filter((story) => story.published !== false), loading: false, error: "" });
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Could not load writer directory", error);
        setState({ authors: [], stories: [], loading: false, error: getApiErrorMessage(error, "We couldn't load the writers and their stories. Please try again.") });
      }
    }
    load();
    return () => controller.abort();
  }, [attempt]);
  return { ...state, retry: () => setAttempt((value) => value + 1) };
}
