interface ManagementQuotaResult {
  quotaMb: number;
  plan?: string;
  source: "management_api" | "env" | "fallback";
}

let cachedQuotaInfo: { data: ManagementQuotaResult; expiresAt: number } | null = null;

export async function getSupabaseManagementQuota(usedMb = 0): Promise<ManagementQuotaResult> {
  const now = Date.now();
  if (cachedQuotaInfo && cachedQuotaInfo.expiresAt > now) {
    return cachedQuotaInfo.data;
  }

  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  let projectRef: string | null = null;
  if (projectUrl) {
    try {
      projectRef = new URL(projectUrl).hostname.split(".")[0] || null;
    } catch {
      projectRef = null;
    }
  }

  if (token && projectRef) {
    try {
      const diskRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/disk`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (diskRes.ok) {
        const diskJson = await diskRes.json();
        const sizeGb = diskJson?.attributes?.size_gb;
        if (typeof sizeGb === "number" && sizeGb > 0) {
          const isFreeTier = sizeGb <= 2;
          const quotaMb = isFreeTier ? 500 : sizeGb * 1024;
          const result: ManagementQuotaResult = {
            quotaMb,
            plan: isFreeTier ? "free" : "pro",
            source: "management_api",
          };
          cachedQuotaInfo = { data: result, expiresAt: now + 10 * 60 * 1000 };
          return result;
        }
      }

      const projectRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (projectRes.ok) {
        const projJson = await projectRes.json();
        const plan = String(projJson?.plan || "").toLowerCase();
        const quotaMb = plan === "pro" ? 8192 : plan === "team" ? 16384 : 500;
        const result: ManagementQuotaResult = {
          quotaMb,
          plan: plan || "free",
          source: "management_api",
        };
        cachedQuotaInfo = { data: result, expiresAt: now + 10 * 60 * 1000 };
        return result;
      }
    } catch {}
  }

  const envQuota = Number(process.env.SUPABASE_DB_LIMIT_MB || process.env.NEXT_PUBLIC_DB_STORAGE_LIMIT_MB);
  if (envQuota && envQuota > 0) {
    return {
      quotaMb: envQuota,
      plan: envQuota > 500 ? "pro" : "free",
      source: "env",
    };
  }

  const baseQuota = 500;
  const quotaMb = usedMb > baseQuota ? Math.ceil(usedMb / 1024) * 1024 : baseQuota;
  return {
    quotaMb,
    plan: quotaMb > 500 ? "pro" : "free",
    source: "fallback",
  };
}

export function clearManagementQuotaCache(): void {
  cachedQuotaInfo = null;
}
