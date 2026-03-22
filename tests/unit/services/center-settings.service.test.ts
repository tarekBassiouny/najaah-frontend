import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getCenterSettings,
  updateCenterSettings,
} from "@/features/centers/services/center-settings.service";
import { http } from "@/lib/http";

vi.mock("@/lib/http", () => ({
  http: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockedHttp = http as unknown as {
  get: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
};

describe("center-settings.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes grouped center settings payloads", async () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: {
        data: {
          id: 12,
          center_id: 5,
          settings: {
            default_view_limit: 3,
          },
          resolved_settings: {
            default_view_limit: 3,
            branding: {
              primary_color: "#123456",
            },
          },
          system_constraints: {
            max_view_limit: 10,
          },
          features: {
            ai_content: true,
          },
          page: {
            type: "system_admin_center_settings",
            actor_scope: "system",
            editable: {
              settings: ["default_view_limit", "branding"],
              features: ["ai_content"],
              ai: {
                providers: {
                  openai: ["default_model"],
                },
              },
            },
          },
          sections: {
            settings: {
              groups: {
                playback: {
                  default_view_limit: 3,
                },
              },
              resolved_groups: {
                playback: {
                  default_view_limit: 3,
                },
                branding: {
                  branding: {
                    primary_color: "#123456",
                  },
                },
              },
            },
            features: {
              values: {
                ai_content: true,
              },
            },
            ai: {
              feature_enabled: true,
              providers: [
                {
                  key: "openai",
                  label: "OpenAI",
                  enabled: true,
                  configured: true,
                  default_model: "gpt-4o-mini",
                  models: ["gpt-4o-mini"],
                  editable_fields: ["default_model"],
                },
              ],
            },
          },
          summaries: [
            {
              type: "info",
              title: "Platform policy",
              message: "Managed by platform.",
            },
          ],
        },
      },
    });

    const result = await getCenterSettings(5);

    expect(result.page?.type).toBe("system_admin_center_settings");
    expect(result.sections?.settings?.groups?.playback).toEqual({
      default_view_limit: 3,
    });
    expect(result.sections?.features?.values).toEqual({
      ai_content: true,
    });
    expect(result.sections?.ai?.providers?.[0]).toMatchObject({
      key: "openai",
      default_model: "gpt-4o-mini",
    });
    expect(result.summaries?.[0]).toEqual({
      type: "info",
      title: "Platform policy",
      message: "Managed by platform.",
    });
  });

  it("patches grouped payloads through the center settings endpoint", async () => {
    mockedHttp.patch.mockResolvedValueOnce({
      data: {
        data: {
          center_id: 3,
          settings: {
            default_view_limit: 4,
          },
          resolved_settings: {
            default_view_limit: 4,
          },
          system_constraints: {},
          catalog: {},
          features: {},
        },
      },
    });

    await updateCenterSettings(3, {
      settings: {
        default_view_limit: 4,
      },
      features: {
        ai_content: false,
      },
    });

    expect(mockedHttp.patch).toHaveBeenCalledWith(
      "/api/v1/admin/centers/3/settings",
      {
        settings: {
          default_view_limit: 4,
        },
        features: {
          ai_content: false,
        },
      },
    );
  });
});
