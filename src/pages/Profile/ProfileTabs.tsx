// src/components/ProfileTabs.tsx
interface Tab {
  id: string;
  label: string;
  isDanger?: boolean;
}

interface ProfileTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs: Tab[] = [
  { id: "profile", label: "Profile" },
  { id: "security", label: "Security" },
  { id: "mfa", label: "Two-Factor Auth" },
  { id: "danger", label: "Danger Zone", isDanger: true },
];

export default function ProfileTabs({
  activeTab,
  onTabChange,
}: ProfileTabsProps) {
  return (
    <div className="border-b border-gray-200">
      <nav className="flex gap-8 px-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`py-4 border-b-2 font-medium transition whitespace-nowrap ${
              activeTab === tab.id
                ? tab.isDanger
                  ? "border-red-600 text-red-600"
                  : "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
