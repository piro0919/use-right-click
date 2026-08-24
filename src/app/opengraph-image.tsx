import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "use-right-click";

export const size = { width: 1200, height: 630 };

export const contentType = "image/png";

const TITLE = "use-right-click";
const DESCRIPTION =
  "React hook for custom context menus, on desktop and mobile.";

export default async function Image() {
  /* 見出しの書体はサイトと同じ Archivo。使う文字だけに絞ったものを
     同梱している。文言を変えたら assets/README.md の手順で作り直す */
  const font = await readFile(
    join(process.cwd(), "assets/Archivo-700-subset.ttf"),
  );

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        padding: "0 80px",
        background: "#0b0b0f",
        color: "#ffffff",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: 600,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 68,
            fontWeight: 700,
            letterSpacing: -1,
          }}
        >
          {TITLE}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 32,
            marginTop: 28,
            lineHeight: 1.4,
            color: "#a1a1aa",
          }}
        >
          {DESCRIPTION}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 26,
            marginTop: 48,
            color: "#71717a",
          }}
        >
          kkweb.io
        </div>
      </div>

      {/* 何をするパッケージなのかを右に置く。名前と説明だけだと、
          9件が同じ絵になってタイムラインで見分けが付かない */}
      <div
        style={{
          alignItems: "center",
          display: "flex",
          flex: 1,
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", position: "relative" }}>
          <div
            style={{
              background: "#15151c",
              border: "1px solid #26262f",
              borderRadius: 14,
              display: "flex",
              flexDirection: "column",
              padding: "14px 0",
              width: 300,
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  alignItems: "center",
                  background: i === 1 ? "#f59e0b" : "transparent",
                  display: "flex",
                  height: 52,
                  padding: "0 22px",
                }}
              >
                <div
                  style={{
                    background: i === 1 ? "#1a1206" : "#3f3f46",
                    borderRadius: 4,
                    height: 12,
                    width: i === 0 ? 180 : i === 1 ? 140 : 160,
                  }}
                />
              </div>
            ))}
          </div>
          {/* 右クリックした位置に出る、という話なのでカーソルを重ねる */}
          <svg
            aria-hidden="true"
            fill="none"
            height="46"
            style={{ left: -20, position: "absolute", top: -24 }}
            viewBox="0 0 24 24"
            width="46"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 3l14 8.5-6.2 1.4L9.7 19 5 3z"
              fill="#f59e0b"
              stroke="#0b0b0f"
              strokeWidth="1.2"
            />
          </svg>
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [{ data: font, name: "Archivo", style: "normal", weight: 700 }],
    },
  );
}
