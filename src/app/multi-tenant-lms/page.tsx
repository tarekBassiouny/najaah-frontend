import { SeoPageShell } from "@/components/marketing/seo-page-shell";
import { buildPageMetadata } from "@/lib/seo/site";

export const metadata = buildPageMetadata({
  title: "Multi-Tenant LMS for Educational Groups and Centers",
  description:
    "Explore a multi-tenant LMS model for educational groups that need separate center administration, shared oversight, and branded learner experiences.",
  path: "/multi-tenant-lms",
  keywords: [
    "multi-tenant lms",
    "multi tenant learning platform",
    "lms for multiple schools",
    "lms for educational groups",
  ],
  languages: {
    en: "/multi-tenant-lms",
    ar: "/ar/multi-tenant-lms",
  },
});

const SEO_PAGE_TITLE =
  "A Multi-Tenant LMS for Educational Groups That Need Separation Without Chaos";

export default function MultiTenantLmsPage() {
  return (
    <SeoPageShell
      eyebrow="Multi-Tenant LMS"
      title={SEO_PAGE_TITLE}
      intro="Educational businesses with multiple centers, branches, or partner academies need more than user roles. They need clean tenant boundaries, local control, and central oversight without rebuilding operations for every new center."
      bullets={[
        "Separate operational boundaries for each center or branch",
        "Shared platform standards with center-level independence",
        "Useful for multi-brand or multi-branch education businesses",
        "Fits white-label delivery, analytics, and secure content workflows",
      ]}
      sections={[
        {
          title: "Why tenant separation matters operationally",
          content:
            "Once an education business serves more than one center, a single shared admin space becomes messy fast. Reporting, branding, content permissions, staff visibility, and learner experience all start to collide. A multi-tenant LMS prevents that drift by giving each center its own controlled environment.",
        },
        {
          title: "Growth becomes easier when the model is repeatable",
          content:
            "A multi-tenant platform is not only about current structure. It is what makes future expansion manageable. New centers, franchises, or partner operations can launch on the same platform model without forcing the business to duplicate infrastructure or compromise governance.",
        },
        {
          title: "Multi-tenant is stronger when paired with brand control",
          content:
            "Educational groups often need each center to feel local while maintaining central standards. Najaah combines tenant separation with white-label presentation so each center can operate under its own identity without losing platform consistency.",
        },
      ]}
      useCases={[
        {
          title: "Education groups with several branches",
          description:
            "Keep each branch operationally independent while giving leadership a clearer top-level picture of platform usage and growth.",
        },
        {
          title: "Franchise-style academies",
          description:
            "Launch new locations on a repeatable platform model without mixing their data, branding, or staff permissions.",
        },
        {
          title: "Partner-delivered programs",
          description:
            "Support partner centers that need their own environment inside one broader product and support model.",
        },
        {
          title: "Regional education businesses",
          description:
            "Scale into new markets or cities without rebuilding the core platform every time the operating structure expands.",
        },
      ]}
      comparisonRows={[
        {
          label: "Center separation",
          najaah: "Designed for clear tenant boundaries and local control.",
          generic:
            "Often relies on broad role rules inside one shared workspace.",
        },
        {
          label: "Expansion model",
          najaah: "New centers can fit the same operating pattern quickly.",
          generic:
            "Each new branch tends to require more manual setup and exceptions.",
        },
        {
          label: "Brand flexibility",
          najaah:
            "Supports center-specific identity without losing shared standards.",
          generic:
            "Branding and structure often stay fixed at the platform level.",
        },
        {
          label: "Governance",
          najaah:
            "Better fit for balancing local autonomy and central oversight.",
          generic:
            "Reporting and permissions become harder to manage as teams grow.",
        },
      ]}
      faqs={[
        {
          question: "What is a multi-tenant LMS?",
          answer:
            "It is a learning platform designed to serve multiple centers, branches, or organizations inside one product while keeping their operations and user experiences separated.",
        },
        {
          question: "Who needs multi-tenant LMS software most?",
          answer:
            "Education groups with multiple branches, regional expansion plans, partner academies, or center-specific branding needs usually benefit most.",
        },
        {
          question: "How is multi-tenant different from using roles only?",
          answer:
            "Roles help with permissions, but they do not create clean operational boundaries. Multi-tenant architecture is about structured separation, not only access levels.",
        },
      ]}
      relatedLinks={[
        { href: "/white-label-lms", label: "White-Label LMS Platform" },
        {
          href: "/lms-for-educational-centers",
          label: "LMS for Educational Centers",
        },
        {
          href: "/resources/how-to-choose-a-white-label-lms",
          label: "How to Choose a White-Label LMS",
        },
        { href: "/resources", label: "Resources Hub" },
      ]}
    />
  );
}
