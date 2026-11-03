import { useEffect, useState } from "react";
import axios from "axios";
import { BackendUrl } from "./frontendConstants";
import { getApiErrorMessage } from "./apiErrorMessage";

export function storiesByWriter(stories, authorId) {
  return stories.filter((story) => String(typeof story.createdBy === "object" ? story.createdBy?._id : story.createdBy) === String(authorId));
}

export function writerTopics(stories) {
  return [...new Set(stories.map((story) => story.category).filter(Boolean))].sort();
}

export function writerReputation(stories) {
  const totals = stories.filter((story) => story.published !== false).reduce((result, story) => {
    const stats = story.community || {};
    result.upvoteCount += stats.upvoteCount || 0;
    result.ratingCount += stats.ratingCount || 0;
    result.starTotal += stats.starTotal || 0;
    result.commentCount += stats.commentCount || 0;
    return result;
  }, { upvoteCount: 0, ratingCount: 0, starTotal: 0, commentCount: 0 });
  return { ...totals, averageRating: totals.ratingCount ? totals.starTotal / totals.ratingCount : 0, score: totals.upvoteCount + totals.starTotal };
}

export function rankWriters(authors, stories) {
  const writers = authors.map((author) => {
    const writing = storiesByWriter(stories, author._id).filter((story) => story.published !== false);
    return { author, writing, topics: writerTopics(writing), reputation: writerReputation(writing) };
  }).sort((first, second) => second.reputation.score - first.reputation.score || first.author.name.localeCompare(second.author.name));
  let rank = null;
  return writers.map((writer, index) => {
    if (!writer.reputation.score) return { ...writer, rank: null };
    if (index === 0 || writer.reputation.score !== writers[index - 1].reputation.score) rank = index + 1;
    return { ...writer, rank };
  });
}

export function compareWriters(first, second, sort) {
  let difference = 0;
  if (sort === "community") difference = second.reputation.score - first.reputation.score;
  if (sort === "upvotes") difference = second.reputation.upvoteCount - first.reputation.upvoteCount;
  if (sort === "stars") difference = second.reputation.averageRating - first.reputation.averageRating || second.reputation.ratingCount - first.reputation.ratingCount;
  if (sort === "stories") difference = second.writing.length - first.writing.length;
  return difference || first.author.name.localeCompare(second.author.name);
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
