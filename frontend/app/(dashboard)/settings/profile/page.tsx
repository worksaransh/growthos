"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ProfileSettingsPage() {
  return <SettingsSection />;
}

function SettingsSection() {
  const sections = [
    {
      title: "Workspace",
      items: [
        { label: "Brand Name", value: "MyBrand Co.", type: "text" },
        { label: "Timezone", value: "Asia/Kolkata (IST)", type: "text" },
        { label: "Currency", value: "INR — Indian Rupee", type: "text" },
        { label: "Plan", value: "Growth · ₹4,999/mo", type: "badge" },
      ],
    },
    {
      title: "Profile",
      items: [
        { label: "Full Name", value: "Arjun Sharma", type: "text" },
        { label: "Email", value: "arjun@mybrand.co", type: "text" },
        { label: "Password", value: "••••••••", type: "password" },
      ],
    },
    {
      title: "Notifications",
      items: [
        { label: "Sync failures", value: "On", type: "toggle" },
        { label: "Daily digest email", value: "Off", type: "toggle" },
        { label: "ROAS drop alert", value: "On", type: "toggle" },
        { label: "Weekly report", value: "On", type: "toggle" },
      ],
    },
  ];

  return (
    <div className="flex gap-6">
      <div className="w-[180px] flex-shrink-0">
        <nav className="flex flex-col gap-0.5">
          {["Workspace", "Profile", "Notifications", "Billing", "API Keys"].map(
            (s, i) => (
              <button
                key={s}
                className={`px-3 py-2 rounded-lg text-left text-sm border-l-2 transition-all ${
                  i === 0
                    ? "bg-[rgba(0,229,160,0.08)] text-[#00E5A0] border-[#00E5A0]"
                    : "text-[#8A95B0] hover:bg-[#151921] border-transparent"
                }`}
              >
                {s}
              </button>
            )
          )}
        </nav>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        {sections.map((section) => (
          <Card key={section.title} className="p-5">
            <h3 className="font-syne text-sm font-bold text-[#F0F4FF] mb-4">
              {section.title}
            </h3>
            <div className="flex flex-col gap-4">
              {section.items.map((item, i) => (
                <div
                  key={item.label}
                  className={`flex justify-between items-center pb-4 ${
                    i < section.items.length - 1
                      ? "border-b border-[#1E2737]"
                      : ""
                  }`}
                >
                  <div className="text-sm text-[#F0F4FF]">{item.label}</div>
                  {item.type === "badge" ? (
                    <Badge color="#00E5A0">{item.value}</Badge>
                  ) : item.type === "toggle" ? (
                    <div
                      className={`w-10 h-5.5 rounded-full relative cursor-pointer transition-colors ${
                        item.value === "On"
                          ? "bg-[#00E5A0] border border-[#00E5A0]"
                          : "bg-[#1C2230] border border-[#1E2737]"
                      }`}
                    >
                      <div
                        className={`absolute top-[3px] w-3.5 h-3.5 rounded-full bg-[#0F1217] transition-all shadow-sm ${
                          item.value === "On" ? "left-5" : "left-[3px]"
                        }`}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs text-[#8A95B0]">
                        {item.value}
                      </span>
                      <button className="text-[11px] text-[#00E5A0] font-mono">
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}

        <div className="flex gap-2.5">
          <Button>Save Changes</Button>
          <Button variant="secondary">Cancel</Button>
        </div>
      </div>
    </div>
  );
}
