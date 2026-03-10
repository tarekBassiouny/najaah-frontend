import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchLandingPage,
  publishLandingPage,
  requestLandingPagePreviewToken,
  unpublishLandingPage,
  uploadHeroBackground,
  uploadTestimonialImage,
  updateLandingPageSection,
} from "@/features/centers/services/landing-page.service";
import { http } from "@/lib/http";

vi.mock("@/lib/http", () => ({
  http: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedHttp = http as unknown as {
  get: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
};

describe("landing-page.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches landing page with an explicit center api key when provided", async () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: {
        data: {
          id: 11,
          hero: {
            title: "Hero title",
            title_translations: { en: "Hero title", ar: "عنوان البطل" },
            background_url: "https://cdn.example.test/hero.jpg",
            cta_text: "Explore",
            cta_url: "https://example.test",
          },
        },
      },
    });

    await expect(fetchLandingPage(3, "center-api-key")).resolves.toEqual({
      id: 11,
      center_id: undefined,
      status: null,
      status_label: undefined,
      is_published: undefined,
      created_at: undefined,
      updated_at: undefined,
      meta: null,
      hero: {
        hero_title: { en: "Hero title", ar: "عنوان البطل" },
        hero_subtitle: null,
        hero_background_url: "https://cdn.example.test/hero.jpg",
        hero_cta_text: "Explore",
        hero_cta_url: "https://example.test",
      },
      about: null,
      contact: null,
      social: null,
      styling: null,
      visibility: null,
      testimonials: null,
    });

    expect(mockedHttp.get).toHaveBeenCalledWith(
      "/api/v1/admin/centers/3/landing-page",
      {
        headers: {
          "X-Api-Key": "center-api-key",
        },
      },
    );
  });

  it("updates landing page sections with partial payloads and api-key override", async () => {
    mockedHttp.patch.mockResolvedValueOnce({
      data: { data: { visibility: { show_hero: false } } },
    });

    await expect(
      updateLandingPageSection(
        3,
        "visibility",
        { show_hero: false },
        "center-api-key",
      ),
    ).resolves.toEqual({
      id: undefined,
      center_id: undefined,
      status: null,
      status_label: undefined,
      is_published: undefined,
      created_at: undefined,
      updated_at: undefined,
      meta: null,
      hero: null,
      about: null,
      contact: null,
      social: null,
      styling: null,
      testimonials: null,
      visibility: {
        show_hero: false,
        show_about: undefined,
        show_courses: undefined,
        show_testimonials: undefined,
        show_contact: undefined,
      },
    });

    expect(mockedHttp.patch).toHaveBeenCalledWith(
      "/api/v1/admin/centers/3/landing-page/sections/visibility",
      { show_hero: false },
      {
        headers: {
          "X-Api-Key": "center-api-key",
        },
      },
    );
  });

  it("requests preview token with api-key override", async () => {
    mockedHttp.post.mockResolvedValueOnce({
      data: { data: { preview_url: "http://example.test" } },
    });

    await expect(
      requestLandingPagePreviewToken(3, "center-api-key"),
    ).resolves.toEqual({
      preview_url: "http://example.test",
    });

    expect(mockedHttp.post).toHaveBeenCalledWith(
      "/api/v1/admin/centers/3/landing-page/preview-token",
      undefined,
      {
        headers: {
          "X-Api-Key": "center-api-key",
        },
      },
    );
  });

  it("publishes the landing page with the default authenticated client", async () => {
    mockedHttp.post.mockResolvedValueOnce({
      data: { data: { is_published: true, status_label: "Published" } },
    });

    await expect(publishLandingPage(3)).resolves.toEqual({
      id: undefined,
      center_id: undefined,
      status: null,
      is_published: true,
      status_label: "Published",
      created_at: undefined,
      updated_at: undefined,
      meta: null,
      hero: null,
      about: null,
      contact: null,
      social: null,
      styling: null,
      testimonials: null,
      visibility: null,
    });

    expect(mockedHttp.post).toHaveBeenCalledWith(
      "/api/v1/admin/centers/3/landing-page/publish",
      undefined,
      undefined,
    );
  });

  it("unpublishes the landing page with an explicit api-key override", async () => {
    mockedHttp.post.mockResolvedValueOnce({
      data: { data: { is_published: false, status_label: "Draft" } },
    });

    await expect(unpublishLandingPage(3, "center-api-key")).resolves.toEqual({
      id: undefined,
      center_id: undefined,
      status: null,
      is_published: false,
      status_label: "Draft",
      created_at: undefined,
      updated_at: undefined,
      meta: null,
      hero: null,
      about: null,
      contact: null,
      social: null,
      styling: null,
      testimonials: null,
      visibility: null,
    });

    expect(mockedHttp.post).toHaveBeenCalledWith(
      "/api/v1/admin/centers/3/landing-page/unpublish",
      undefined,
      {
        headers: {
          "X-Api-Key": "center-api-key",
        },
      },
    );
  });

  it("uploads the hero background and unwraps the updated landing page", async () => {
    mockedHttp.post.mockResolvedValueOnce({
      data: {
        data: {
          url: "https://cdn.example.test/hero.jpg",
          landing_page: {
            hero: {
              background_url: "https://cdn.example.test/hero.jpg",
            },
          },
        },
      },
    });

    const file = new File(["hero"], "hero.jpg", { type: "image/jpeg" });

    await expect(
      uploadHeroBackground(3, {
        file,
        filename: file.name,
      }),
    ).resolves.toEqual({
      url: "https://cdn.example.test/hero.jpg",
      landingPage: {
        id: undefined,
        center_id: undefined,
        status: null,
        status_label: undefined,
        is_published: undefined,
        created_at: undefined,
        updated_at: undefined,
        meta: null,
        hero: {
          hero_title: null,
          hero_subtitle: null,
          hero_background_url: "https://cdn.example.test/hero.jpg",
          hero_cta_text: undefined,
          hero_cta_url: undefined,
        },
        about: null,
        contact: null,
        social: null,
        styling: null,
        visibility: null,
        testimonials: null,
      },
    });

    expect(mockedHttp.post).toHaveBeenCalledWith(
      "/api/v1/admin/centers/3/landing-page/media/hero-background",
      expect.any(FormData),
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
  });

  it("uploads testimonial images and returns the uploaded url only", async () => {
    mockedHttp.post.mockResolvedValueOnce({
      data: {
        data: {
          url: "https://cdn.example.test/testimonial.jpg",
        },
      },
    });

    const file = new File(["testimonial"], "testimonial.jpg", {
      type: "image/jpeg",
    });

    await expect(
      uploadTestimonialImage(
        3,
        {
          file,
          filename: file.name,
        },
        "center-api-key",
      ),
    ).resolves.toEqual({
      url: "https://cdn.example.test/testimonial.jpg",
      landingPage: null,
    });

    expect(mockedHttp.post).toHaveBeenCalledWith(
      "/api/v1/admin/centers/3/landing-page/media/testimonial-image",
      expect.any(FormData),
      {
        headers: {
          "X-Api-Key": "center-api-key",
          "Content-Type": "multipart/form-data",
        },
      },
    );
  });
});
