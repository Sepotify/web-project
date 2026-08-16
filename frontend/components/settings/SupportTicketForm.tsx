"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { createSupportTicketRequest } from "@/lib/tickets";
import { useAuth } from "@/store/AuthContext";

interface SupportTicketFormProps {
  userId: string;
  onSubmitted?: () => void;
}

export function SupportTicketForm({ userId, onSubmitted }: SupportTicketFormProps) {
  const { useApiAuth } = useAuth();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await createSupportTicketRequest(
      userId,
      subject,
      message,
      useApiAuth,
    );
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error ?? "Could not open support ticket.");
      return;
    }

    setSubject("");
    setMessage("");
    onSubmitted?.();
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
      <Input
        id="support-subject"
        label="Subject"
        value={subject}
        onChange={(event) => setSubject(event.target.value)}
        placeholder="Brief summary of your issue"
        required
      />

      <Textarea
        id="support-message"
        label="Message"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Describe what happened and how we can help"
        rows={5}
        required
      />

      {error ? (
        <p className="text-sm text-accent-danger" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? "Submitting..." : "Open support ticket"}
      </Button>
    </form>
  );
}
