import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Phos AI — AI Image Editing & Retouching";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const baseUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://phos.studio";

  let heroSrc = `${baseUrl}/images/og/hero-model.jpg`;
  try {
    const res = await fetch(heroSrc, { cache: "force-cache" });
    if (res.ok) {
      const buf = await res.arrayBuffer();
      const b64 = Buffer.from(buf).toString("base64");
      heroSrc = `data:image/jpeg;base64,${b64}`;
    }
  } catch {
    // fall back to URL; Satori will try to fetch directly
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background:
            "linear-gradient(135deg, #090A14 0%, #10112A 50%, #090A14 100%)",
        }}
      >
        {/* Model image — right side */}
        <img
          src={heroSrc}
          width={820}
          height={630}
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            width: 820,
            height: 630,
            objectFit: "cover",
            objectPosition: "50% 18%",
          }}
        />

        {/* Left-to-right fade over image for text readability */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to right, #090A14 0%, #090A14 32%, rgba(9,10,20,0.75) 48%, rgba(9,10,20,0.25) 68%, rgba(9,10,20,0) 90%)",
          }}
        />

        {/* Ambient indigo glow */}
        <div
          style={{
            position: "absolute",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 70%)",
            top: -120,
            left: -120,
          }}
        />

        {/* Content — left side */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 80px",
            width: 640,
            height: "100%",
          }}
        >
          {/* Icon */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 76,
              height: 76,
              borderRadius: 22,
              background: "linear-gradient(135deg, #6366F1, #818CF8)",
              marginBottom: 28,
              boxShadow: "0 0 40px rgba(99,102,241,0.35)",
            }}
          >
            <svg
              width="44"
              height="44"
              viewBox="0 0 20 20"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m10 2.5-1.593 4.844a1.667 1.667 0 0 1-1.063 1.063L2.5 10l4.844 1.593a1.667 1.667 0 0 1 1.063 1.063L10 17.5l1.593-4.844a1.667 1.667 0 0 1 1.063-1.063L17.5 10l-4.844-1.593a1.667 1.667 0 0 1-1.063-1.063L10 2.5Z" />
            </svg>
          </div>

          {/* Title */}
          <div
            style={{
              display: "flex",
              fontSize: 76,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              background:
                "linear-gradient(135deg, #FFFFFF 0%, #C7D2FE 100%)",
              backgroundClip: "text",
              color: "transparent",
              marginBottom: 20,
              lineHeight: 1,
            }}
          >
            Phos AI
          </div>

          {/* Subtitle — 2 lines for clean break */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 30,
              color: "#CBD5E1",
              fontWeight: 500,
              lineHeight: 1.35,
              marginBottom: 32,
            }}
          >
            <div style={{ display: "flex" }}>AI image editing</div>
            <div style={{ display: "flex" }}>& retouching studio</div>
          </div>

          {/* Domain */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 22,
              color: "#A5B4FC",
              fontWeight: 600,
              letterSpacing: "0.05em",
            }}
          >
            phos.studio
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
