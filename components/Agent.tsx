"use client";
import vapi from "@/lib/vapi.sdk";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}
interface AgentProps {
  userName: string;
  userId: string;
  type: string;
}

const Agent = ({ userName, userId, type }: AgentProps) => {
  const router = useRouter();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onCallStart = () => setCallStatus(CallStatus.ACTIVE);
    const onCallEnd = () => setCallStatus(CallStatus.FINISHED);
    const onMessage = (message: any) => {
      // VAPI transcript type can be "final"/"partial"
      if (message.type === "transcript" && message.transcriptType === "final") {
        setMessages((prev) => [...prev, { role: message.role, content: message.transcript }]);
      } else if (message.type === "text" && message.content) {
        setMessages((prev) => [...prev, { role: message.role, content: message.content }]);
      }
    };
    const onSpeechStart = () => setIsSpeaking(true);
    const onSpeechEnd = () => setIsSpeaking(false);
    const onError = (error: any) => setError(error?.message ?? "Unknown VAPI Error");

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
    };
  }, []);

  useEffect(() => {
    if (callStatus === CallStatus.FINISHED) {
      setTimeout(() => router.push("/"), 1500); // Optional: Remove to stay on page after call
    }
  }, [callStatus, router]);

  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);
    setError(null);

    try {
      // Use new VAPI Workflow start signature!
      setCallStatus(CallStatus.CONNECTING);
    await vapi.start(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!, {
      variableValues: {
        username: userName,
        userid: userId,
      },
    });
    } catch (err: any) {
      setError(err?.message ?? "Could not start VAPI interview.");
      setCallStatus(CallStatus.INACTIVE);
    }
  };

  const handleDisconnect = async () => {
    setCallStatus(CallStatus.FINISHED);
    vapi.stop();
  };

  const lastestMessage = messages[messages.length - 1]?.content;
  const isCallInactiveOrFinished = callStatus === CallStatus.INACTIVE || callStatus === CallStatus.FINISHED;

  return (
    <>
      <div className="call-view">
        {/* AI Card */}
        <div className="card-interviewer">
          <div className="avatar">
            <Image src="/ai-avatar.png" alt="vapi" width={65} height={54} className="object-cover" />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
        </div>
        {/* User Card */}
        <div className="card-border">
          <div className="card-content">
            <Image src="/user-avatar.png" alt="user avatar" className="rounded-full object-cover size-[120px]" width={540} height={540} />
            <h3>{userName}</h3>
          </div>
        </div>
      </div>
      {/* Transcript display */}
      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            {messages.map((msg, i) => (
              <p
                key={i}
                className={cn(
                  "transition-opacity duration-500",
                  i === messages.length - 1 && "animate-fadeIn opacity-100"
                )}
              >
                <strong>{msg.role === "assistant" ? "AI:" : "You:"}</strong>&nbsp;{msg.content}
              </p>
            ))}
          </div>
        </div>
      )}
      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 my-2">
          {error}
        </div>
      )}
      {/* Call Buttons */}
      <div className="w-full flex justify-center">
        {callStatus !== CallStatus.ACTIVE ? (
          <button className="relative btn-call" onClick={handleCall} disabled={callStatus === CallStatus.CONNECTING}>
            <span className={cn("absolute animate-ping rounded-full opacity-75", callStatus !== CallStatus.CONNECTING && "hidden")} />
            <span>
              {isCallInactiveOrFinished ? "Call" : ". . ."}
            </span>
          </button>
        ) : (
          <button className="btn-disconnect cursor-pointer" onClick={handleDisconnect}>End</button>
        )}
      </div>
    </>
  );
};

export default Agent;
