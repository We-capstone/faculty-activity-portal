// services/syncService.js

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);


export async function syncUserByOrcid(orcidId) {
  // 1. Fetch works
  const worksResponse = await fetch(
    `https://pub.orcid.org/v3.0/${orcidId}/works`,
    { headers: { Accept: "application/json" } }
  );

  if (!worksResponse.ok) {
  throw new Error("Failed to fetch ORCID works");
}


  const worksData = await worksResponse.json();
  const works = worksData.group || [];

  // 2. Get profile
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("orcid_id", orcidId)
    .single();

  if (error || !profile) {
    throw new Error("Profile not found");
  }

  const profileId = profile.id;

  let journalCount = 0;
  let conferenceCount = 0;

  const journalRows = [];
  const conferenceRows = [];

  for (const group of works) {
    const summaries = group["work-summary"] || [];
    const work = summaries[0];
    if (!work) continue;

    const putCode = work["put-code"];
    const type = work.type;

    const title = work.title?.title?.value || null;
    const journalName = work["journal-title"]?.value || null;
    const year = work["publication-date"]?.year?.value || null;
    const url = work.url?.value || null;
    const date = year ? `${year}-01-01` : null;

    if (type === "journal-article") {
      journalCount++;
      journalRows.push({
        profile_id: profileId,
        orcid_put_code: putCode,
        title,
        journal_name: journalName,
        publication_date: date,
        paper_link: url,
        status: "APPROVED",
      });
    }

    if (
      type === "conference-paper" ||
      type === "conference-abstract" ||
      type === "conference-poster" ||
      type === "conference-proceedings"
    ) {
      conferenceCount++;
      conferenceRows.push({
        profile_id: profileId,
        orcid_put_code: putCode,
        title,
        conference_name: journalName,
        conference_date: date,
        conference_link: url,
        status: "APPROVED",
      });
    }
  }

  if (journalRows.length) {
    await supabase.from("journal_publications").upsert(journalRows, {
      onConflict: "profile_id,orcid_put_code",
    });
  }

  if (conferenceRows.length) {
    await supabase.from("conference_publications").upsert(conferenceRows, {
      onConflict: "profile_id,orcid_put_code",
    });
  }

  // FUNDING
  const recordResponse = await fetch(
    `https://pub.orcid.org/v3.0/${orcidId}/record`,
    { headers: { Accept: "application/json" } }
  );

  const recordData = await recordResponse.json();
  const fundingData = recordData?.["activities-summary"]?.fundings || {};

  const normalizedFunding = normalizeFunding(fundingData);
  const fundingCount = normalizedFunding.length;

  const fundingRows = normalizedFunding.map((item) => ({
    profile_id: profileId,
    orcid_put_code: item.putCode,
    funding_agency: item.organization,
    project_title: item.title,
    start_date: item.startDate,
    end_date: item.endDate,
    status: "APPROVED",
  }));

  if (fundingRows.length) {
    await supabase.from("research_funding").upsert(fundingRows, {
      onConflict: "profile_id,orcid_put_code",
    });
  }

  await supabase
    .from("profiles")
    .update({
      publications_count: journalCount + conferenceCount,
      funding_count: fundingCount,
      last_orcid_sync: new Date(),
    })
    .eq("id", profileId);

  return {
    journalCount,
    conferenceCount,
    fundingCount,
  };
}

function normalizeFunding(fundingData) {
  const groups = fundingData.group || [];
  const flattened = [];

  for (const group of groups) {
    const summaries = group["funding-summary"] || [];

    for (const item of summaries) {
      flattened.push({
        putCode: item["put-code"],
        title: item.title?.title?.value || null,
        organization: item.organization?.name || null,
        startDate: formatDate(item["start-date"]),
        endDate: formatDate(item["end-date"]),
      });
    }
  }

  return flattened;
}

function formatDate(dateObj) {
  if (!dateObj) return null;

  const y = dateObj.year?.value;
  const m = dateObj.month?.value;
  const d = dateObj.day?.value;

  return [y, m, d].filter(Boolean).join("-");
}
