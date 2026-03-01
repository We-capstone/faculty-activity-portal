// services/orcidService.js

export async function fetchFromOrcid(orcidId) {
  const response = await fetch(
    `https://pub.orcid.org/v3.0/${orcidId}/record`,
    {
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch ORCID data");
  }

  return await response.json();
}
