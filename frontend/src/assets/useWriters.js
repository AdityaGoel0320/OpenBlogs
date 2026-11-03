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

export function writerBio(author, stories = []) {
  if (typeof author.bio === "string" && author.bio.trim()) return author.bio.trim();
  const name = author.name?.trim() || "This writer";
  const identity = String(author._id || name);
  let seed = 2166136261;
  for (const character of identity) seed = Math.imul(seed ^ character.charCodeAt(0), 16777619) >>> 0;
  const published = stories.filter((story) => story.published !== false);
  const topics = writerTopics(published);
  const subject = topics.slice(0, 2).join(" and ") || "the OpenBlogs journal";
  const collection = `${published.length} published ${published.length === 1 ? "story" : "stories"}`;
  const introductions = published.length ? [
    `${name} writes about ${subject}.`,
    `Discover ${name}'s perspective on ${subject}.`,
    `${name}'s writing brings ${subject} to the page.`,
    `Meet ${name}, with ${collection} on OpenBlogs.`,
    `Explore ${subject} through ${name}'s writing.`,
    `${name}'s collection includes ${collection}.`,
    `Read ${name}'s stories on ${subject}.`,
    `${name} contributes to the conversation around ${subject}.`,
  ] : [
    `${name} has joined the OpenBlogs community.`,
    `Meet ${name}, a new voice on OpenBlogs.`,
    `This is ${name}'s corner of OpenBlogs.`,
    `${name}'s author profile is ready for its first story.`,
    `A new chapter on OpenBlogs starts with ${name}.`,
    `${name} is part of our growing writing community.`,
    `Find ${name} among the voices of OpenBlogs.`,
    `${name}'s story collection starts here.`,
  ];
  const endings = published.length ? [
    "Visit their profile for the full collection.",
    "Find their published work in the journal.",
    "There is a perspective here to spend some time with.",
    "Their stories are part of an ongoing community conversation.",
    "Open a story and see where it takes you.",
    "Explore their work, one story at a time.",
    "Join the discussion on their published stories.",
    "A different voice for your next good read.",
  ] : [
    "No stories published yet.",
    "Their first published story is still ahead.",
    "Their collection is currently a blank page.",
    "There are no published chapters just yet.",
    "A profile at the beginning of its story.",
    "Their public story collection is still taking shape.",
    "An empty bookshelf, with room for a first story.",
    "No published writing to explore just yet.",
  ];
  return `${introductions[seed % introductions.length]} ${endings[Math.floor(seed / introductions.length) % endings.length]}`;
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
