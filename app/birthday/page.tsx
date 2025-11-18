import { BirthdayGenerator } from "@/components/BirthdayGenerator";

export default function BirthdayPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto py-8 px-4">
        <BirthdayGenerator />
      </div>
    </div>
  );
}

