export function getApiErrorMessage(error, fallback) {
  const serverMessage = error?.response?.data?.message;
  if (typeof serverMessage === "string" && serverMessage.trim()) {
    return serverMessage;
  }

  if (error?.code === "ERR_NETWORK" || !error?.response) {
    return "We couldn't reach the server. Check the API URL, backend status, and CORS settings, then try again.";
  }

  return fallback;
}
