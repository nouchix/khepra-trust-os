export interface JsonLdProps {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data, null, 2),
      }}
    />
  );
}

export const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "KHEPRA",
  legalName: "KHEPRA Trust Network",
  url: "https://adinkhepra.com",
  logo: "https://adinkhepra.com/favicon.ico",
  description:
    "KHEPRA is the Autonomous Governance Platform providing cryptographic governance, bounded privilege, and independently verifiable evidence for autonomous systems.",
  sameAs: [
    "https://github.com/khepra-trust",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    email: "hello@khepra.network",
    contactType: "customer support",
  },
};

export const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "KHEPRA",
  alternateName: "KHEPRA Autonomous Governance Platform",
  url: "https://adinkhepra.com",
  publisher: {
    "@type": "Organization",
    name: "KHEPRA",
  },
};

export function buildSoftwareAppSchema(opts: {
  name: string;
  description: string;
  url: string;
  applicationCategory: string;
  operatingSystem?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: opts.name,
    description: opts.description,
    url: opts.url,
    applicationCategory: opts.applicationCategory,
    operatingSystem: opts.operatingSystem || "Cross-platform, Cloud, Enterprise",
    publisher: {
      "@type": "Organization",
      name: "KHEPRA",
    },
  };
}

export function buildFaqSchema(questions: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };
}

export function buildBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
