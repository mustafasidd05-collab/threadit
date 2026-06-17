"use client";

import CreateThreadForm from "@/components/CreateThreadForm";

export default function CreatePage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="font-heading font-extrabold text-3xl text-txt tracking-tight mb-6">Start a New Discussion</h1>
      <CreateThreadForm />
    </div>
  );
}
